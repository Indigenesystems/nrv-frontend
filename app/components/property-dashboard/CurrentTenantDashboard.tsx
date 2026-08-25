import Button from "../shared/buttons/Button";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  createUploadAgreement,
  getCurrentTenantForProperty,
} from "../../../redux/slices/propertySlice";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { Form, Formik, FormikHelpers } from "formik";
import Modal from "../shared/modals/Modal";
import EndTenancyLeaseModal from "../shared/EndTenancyLeaseModal";
import CustomDatePicker from "../shared/CustomDatePicker";
import {
  assignDateTenancyTenure,
  createUserByLandlord,
  endTenancyTenure,
  extendTenancyTenure,
} from "@/redux/slices/userSlice";
import { toast } from "react-toastify";
import { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import FileUploader from "../shared/upload/FileUploader";
import Viewer from "react-viewer";
import { getFileExtension } from "@/helpers/utils";
import { formatEndTenancySummary } from "@/lib/applicationDisplay";
import FormikInputField from "../shared/input-fields/FormikInputField";
import * as yup from "yup";
import SelectDate from "../shared/SelectDate";
import { FaCalendar } from "react-icons/fa6";
import { format } from "date-fns";
import CalendarIcon from "../shared/icons/CalendarIcon";

interface Data {
  data: any;
}

type AddTenantFunction = (
  values: any,
  formikHelpers: Pick<FormikHelpers<any>, "resetForm" | "setSubmitting">,
  dispatch: ThunkDispatch<any, any, AnyAction>
) => Promise<void>;

const CurrentTenantDashboard: React.FC<Data> = ({ data }) => {
  console.log({ data });

  const { id } = useParams();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [viewDocs, setViewDocs] = useState<boolean>(false);
  const [user, setUser] = useState<any>({});
  const [fileUrl, setFileUrl] = useState<string>("");
  const [tenantDetails, setTenantDetails] = useState<any>({});
  const [viewerVisible, setViewerVisible] = useState<boolean>(true);
  const [isVisible, setIsVisible] = useState(false);
  const [pdf, setPdf] = useState<any>(null);
  const [openAddTenantModal, setOpenAddTenantModal] = useState(false);
  const [openOnboardTenantModal, setOpenOnboardTenantModal] = useState(false);
  const [openStartDate, setOpenStartDate] = useState(false);
  const [openEndDate, setOpenEndDate] = useState(false);
  const [openAssignDateModal, setOpenAssignDateModal] = useState(false);
  const [openUploadAgreementDocsModal, setOpenUploadAgreementDocsModal] =
    useState(false);

  const [openEndTenancyModal, setOpenTenancyModal] = useState(false);
  const [unsignedDocument, setUnsignedDocuments] = useState<File[]>([]);
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const validationSchema = yup.object({
    firstName: yup.string().required("First Name is required"),
    lastName: yup.string().required("Last Name is required"),
    email: yup
      .string()
      .email("Invalid email address")
      .required("Email is required"),
    nin: yup.string().required("NIN is required").min(11).max(11),
    rentEndDate: yup.string().required("Rent start date is required"),
    rentStartDate: yup.string().required("Rent end date is required"),
  });

  const fetchData = async () => {
    const user = JSON.parse(localStorage.getItem("nrv-user") as any);
    setUser(user?.user);
    try {
      const tenant = await dispatch(
        getCurrentTenantForProperty(id) as any
      ).unwrap();
      setTenantDetails(tenant);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateToWords = (dateString: any) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const calculateDateDifference = (
    startDateString: string,
    endDateString: string
  ) => {
    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);

    // // Ensure the end date is after the start date
    // if (endDate < startDate) {
    //   throw new Error("End date must be after start date.");
    // }

    // Calculate difference
    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    // Adjust months and years if necessary
    if (days < 0) {
      months--;
      days += new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate(); // days in the previous month
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    // Return formatted difference
    return `${years} year${years !== 1 ? "s" : ""}, ${months} month${
      months !== 1 ? "s" : ""
    }, and ${days} day${days !== 1 ? "s" : ""}`;
  };

  const extendTenancy: AddTenantFunction = async (
    values,
    { resetForm, setSubmitting },
    dispatch
  ) => {
    try {
      const result = (await dispatch(extendTenancyTenure(values))) as any;
      if (result.error) {
        if (result.error.message === "Rejected") {
          toast.error(
            result.payload || "Failed to extend tenancy. Please try again."
          );
        } else {
          toast.error("Failed to extend tenancy. Please try again.");
        }
      } else {
        toast.success("Tenant tenure extended successfully");
        resetForm();
        fetchData();
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "An unexpected error occurred."
      );
    } finally {
      setSubmitting(false);
      setOpenAddTenantModal(false);
    }
  };

  const addTenant: AddTenantFunction = async (
    values,
    { resetForm, setSubmitting },
    dispatch
  ) => {
    try {
      const result = (await dispatch(createUserByLandlord(values))) as any;
      if (result.error) {
        if (result.error.message === "Rejected") {
          toast.error(
            result.payload || "Failed to add tenant. Please try again."
          );
        } else {
          toast.error("Failed to add tenant. Please try again.");
        }
      } else {
        toast.success("Tenant onboarded successfully");
        fetchData();
        resetForm();
        setOpenOnboardTenantModal(false);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "An unexpected error occurred."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const assignDateToTenancy: AddTenantFunction = async (
    values,
    { resetForm, setSubmitting },
    dispatch
  ) => {
    try {
      const result = (await dispatch(assignDateTenancyTenure(values))) as any;
      if (result.error) {
        if (result.error.message === "Rejected") {
          toast.error(
            result.payload || "Failed to extend tenancy. Please try again."
          );
        } else {
          toast.error("Failed to extend tenancy. Please try again.");
        }
      } else {
        toast.success("Tenant tenure extended successfully");
        resetForm();
        fetchData();
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "An unexpected error occurred."
      );
    } finally {
      setSubmitting(false);
      setOpenAddTenantModal(false);
    }
  };

  const uploadTenantAgreement: AddTenantFunction = async (
    values,
    { resetForm, setSubmitting },
    dispatch
  ) => {
    try {
      const result = (await dispatch(createUploadAgreement(values))) as any;
      if (result.error) {
        if (result.error.message === "Rejected") {
          toast.error(
            result.payload ||
              "Failed to upload agreement documents. Please try again."
          );
        } else {
          toast.error(
            "Failed to upload agreement documents. Please try again."
          );
        }
      } else {
        toast.success("Agreement document uploaded successfully");
        resetForm();
        fetchData();
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "An unexpected error occurred."
      );
    } finally {
      setSubmitting(false);
      setOpenAddTenantModal(false);
    }
  };

  const viewDocument = (item: string) => {
    const fileType = getFileExtension(item);
    if (
      fileType === "jpg" ||
      fileType === "jpeg" ||
      fileType === "png" ||
      fileType === "gif"
    ) {
      setPdf("image");
    } else if (fileType === "pdf") {
      setPdf("pdf");
    }
    setFileUrl(item);
    setViewDocs(true);
    setViewerVisible(true); // Ensure viewer is visible when a document is viewed
  };

  const closeViewer = () => {
    setViewerVisible(false);
    setViewDocs(false);
    setFileUrl(""); // Reset fileUrl
    setPdf(""); // Reset pdf state
  };

  const endTenancy: AddTenantFunction = async (
    values,
    { resetForm, setSubmitting },
    dispatch
  ) => {
    try {
      const result = (await dispatch(endTenancyTenure(values))) as any;
      if (result.error) {
        if (result.error.message === "Rejected") {
          toast.error(
            result.payload || "Failed to end tenancy. Please try again."
          );
        } else {
          toast.error("Failed to end tenancy. Please try again.");
        }
      } else {
        toast.success("Tenant ended successfully");
        resetForm();
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "An unexpected error occurred."
      );
    } finally {
      setSubmitting(false);
      setOpenTenancyModal(false);
    }
  };

  const handleFileChange = (files: File[]) => {
    setUnsignedDocuments(files);
  };

  const handleRemoveFile = (index: number) => {
    setUnsignedDocuments((prevFiles) =>
      prevFiles.filter((_, i) => i !== index)
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  const validate = (values: any) => {
    const errors: { rentEndDate?: string } = {};
    if (tenantDetails?.data?.finalResult?.rentEndDate) {
      const currentEndDate = new Date(
        tenantDetails?.data?.finalResult?.rentEndDate
      );
      const newEndDate = new Date(values.rentEndDate);
      if (newEndDate <= currentEndDate) {
        errors.rentEndDate =
          "End date must be later than current rent end date.";
      }
    }
    return errors;
  };

  const validateTenancyDateAssignment = (values: any) => {
    const errors: { rentEndDate?: string; rentStartDate?: string } = {};

    if (tenantDetails?.data?.finalResult?.rentEndDate) {
      const currentEndDate = new Date(
        tenantDetails?.data?.finalResult?.rentEndDate
      );
      const newEndDate = new Date(values.rentEndDate);

      if (newEndDate <= currentEndDate) {
        errors.rentEndDate =
          "End date must be later than the current rent end date.";
      }
    }

    const newStartDate = new Date(values.rentStartDate);
    const newEndDate = new Date(values.rentEndDate);

    if (newStartDate && newEndDate && newStartDate >= newEndDate) {
      errors.rentStartDate = "Start date must be earlier than the end date.";
      errors.rentEndDate = "End date must be later than the start date.";
    }

    return errors;
  };

  return (
    <div className="pb-4 md:pb-0">
      <div>
        {tenantDetails.data != null ? (
          <div>
            <div className="w-full">
              <div className="md:gap-8">
                <div className="grid md:grid-cols-5 grid-cols-2 gap-4 border-r border-l border-b border-t-0 rounded-l-xl rounded-r-xl  p-4 text-sm">
                  <div className="text-[#101928]">
                    <p className="text-[#475367] text-xs">Tenant Name</p>
                    <p className="font-semibold text-[#101928]">
                      {" "}
                      {
                        tenantDetails?.data?.finalResult?.applicant?.firstName
                      }{" "}
                      {tenantDetails?.data?.finalResult?.applicant?.lastName}
                    </p>
                  </div>
                  <div className="text-[#101928]">
                    <p className="text-[#475367] text-xs">Tenant Email</p>
                    <p className="text-[#1D2739] pt-1.5 text-[13px]">
                      {" "}
                      {tenantDetails?.data?.finalResult?.applicant?.email}
                    </p>
                    <p className="pt-1.5 text-[11px]">
                      {tenantDetails?.data?.finalResult?.applicant
                        ?.phoneNumber || "No phone number provided yet"}
                    </p>
                  </div>
                  {/* <div>
                    <p className="text-[#475367] text-xs mb-2">Tenant Type</p>
                    <p className="text-[#1D2739] pt-1.5 text-[13px]">{data.tenantType}</p>
                  </div> */}
                  <div>
                    <p className="text-[#475367] text-xs">
                      Rent Starts on
                    </p>
                    <p className="text-[#1D2739] pt-1.5 text-[13px]">
                      {formatDateToWords(
                        tenantDetails?.data?.finalResult?.rentStartDate
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#475367] text-xs">
                      Rent Expires on
                    </p>
                    <p className="text-[#1D2739] pt-1.5 text-[13px]">
                      {formatDateToWords(
                        tenantDetails?.data?.finalResult?.rentEndDate
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#475367] text-xs">
                      Tenancy Duration
                    </p>
                    <p className="text-[#1D2739] pt-1.5 text-[13px]">
                      {calculateDateDifference(
                        tenantDetails?.data?.finalResult?.rentStartDate,
                        tenantDetails?.data?.finalResult?.rentEndDate
                      )}
                    </p>
                  </div>
                  {formatEndTenancySummary(tenantDetails?.data?.finalResult) && (
                    <div className="md:col-span-2">
                      <p className="text-[#475367] text-xs">
                        Reason tenancy ended
                      </p>
                      <p className="text-[#1D2739] pt-1.5 text-[13px]">
                        {formatEndTenancySummary(
                          tenantDetails?.data?.finalResult,
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-4 mt-6 w-full">
                  <div
                    onClick={() => setOpenAddTenantModal(true)}
                    className="flex-1 flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 cursor-pointer transition duration-300"
                  >
                    <span className="text-sm font-medium text-nrvGreyBlack">
                      Extend Rent Tenure
                    </span>
                    <span className="text-nrvPrimaryGreen hover:underline text-sm">
                      Click here
                    </span>
                  </div>
                  <div
                    onClick={() => setOpenTenancyModal(true)}
                    className="flex-1 flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 cursor-pointer transition duration-300"
                  >
                    <span className="text-sm font-medium text-nrvGreyBlack">
                      End Rent Tenure
                    </span>
                    <span className="text-nrvPrimaryGreen hover:underline text-sm">
                      Click here
                    </span>
                  </div>

                  {/* Upload or View Agreement */}
                  {tenantDetails?.data?.agreementDocument === null ? (
                    <div
                      onClick={() => setOpenUploadAgreementDocsModal(true)}
                      className="flex-1 flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 cursor-pointer transition duration-300"
                    >
                      <span className="text-sm font-medium text-nrvGreyBlack">
                        Upload Agreement Documents
                      </span>
                      <span className="text-nrvPrimaryGreen hover:underline text-sm">
                        Click here
                      </span>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg shadow-sm">
                      <div
                        onClick={() =>
                          viewDocument(
                            tenantDetails?.data?.agreementDocument
                              ?.unsignedDocument
                          )
                        }
                        className="text-sm text-green-700 underline cursor-pointer"
                      >
                        View Unsigned Agreement
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="flex justify-center">No Active Tenancy</div>
            <div className="flex justify-center mt-4">
              <Button
                type="submit"
                size="large"
                className=""
                variant="lightGrey"
                showIcon={false}
                onClick={() => {
                  setOpenOnboardTenantModal(true);
                }}
              >
                Add Tenant
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={openAddTenantModal}
        onClose={() => {
          setOpenAddTenantModal(false);
        }}
      >
        <div className="mx-auto w-full h-full p-3 sm:p-8 md:p-16">
          <h2 className="text-nrvPrimaryGreen font-semibold text-2xl">
            Extend Tenant Tenure
          </h2>
          <p className="text-nrvLightGrey text-sm mb-4 mt-4">
            Performing this action will extend the tenancy tenure
          </p>
          <Formik
            initialValues={{
              id: tenantDetails?.data?.finalResult?._id,
              rentEndDate: "",
            }}
            validate={validate}
            onSubmit={(values, formikHelpers) =>
              extendTenancy(values, formikHelpers, dispatch)
            }
          >
            {({ isSubmitting, resetForm, values, errors }) => (
              <Form>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div className="w-full md:flex flex-row gap-3">
                    <CustomDatePicker
                      label="Rent End Date"
                      name="rentEndDate"
                      errorMessage={typeof errors.rentEndDate === 'string' ? errors.rentEndDate : ''}
                    />
                  </div>
                </div>
                <div className="mt-4  mx-auto w-full mt-8 flex gap-4 justify-between">
                  <Button
                    type="button"
                    size="large"
                    className="block w-full"
                    variant="lightGrey"
                    showIcon={false}
                    onClick={() => {
                      resetForm();
                      setOpenAddTenantModal(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="large"
                    className="block w-full"
                    variant="lightGrey"
                    showIcon={false}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Loading..." : "Submit"}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </Modal>

      <Modal
        isOpen={openAssignDateModal}
        onClose={() => {
          setOpenAssignDateModal(false);
        }}
      >
        <div className="mx-auto w-full h-full p-3 sm:p-8 md:p-16">
          <h2 className="text-nrvPrimaryGreen font-semibold text-2xl">
            Assign Rent Start and End Date
          </h2>
          <p className="text-nrvLightGrey text-sm mb-4 mt-4">
            Performing this action will assign a tenancy date frame to this
            tenant.
          </p>
          <Formik
            initialValues={{
              id: tenantDetails?.data?.finalResult?._id,
              rentStartDate: "",
              rentEndDate: "",
            }}
            validate={validateTenancyDateAssignment}
            onSubmit={(values, formikHelpers) =>
              assignDateToTenancy(values, formikHelpers, dispatch)
            }
          >
            {({ isSubmitting, resetForm, values, errors, setFieldValue }) => (
              <Form>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div className="w-full md:flex flex-row gap-3">
                    <CustomDatePicker
                      label="Rent Start Date"
                      name="rentStartDate"
                      errorMessage={typeof errors.rentStartDate === 'string' ? errors.rentStartDate : ''}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div className="w-full md:flex flex-row gap-3">
                    <CustomDatePicker
                      label="Rent End Date"
                      name="rentEndDate"
                      errorMessage={typeof errors.rentEndDate === 'string' ? errors.rentEndDate : ''}
                    />
                                      {/* Replace CustomDatePicker with SelectDate for Rent Start Date */}
                  <div className="w-full md:flex flex-row gap-3">
                    <div className="md:w-1/2 w-full mt-0 md:mt-0">
                      <div
                        onClick={() => setOpenStartDate(true)}
                        className="cursor-pointer"
                      >
                        <FormikInputField
                          name="rentStartDate"
                          value={format(
                            new Date(values.rentStartDate),
                            "dd-MM-yyyy"
                          )}
                          onClick={() => setOpenStartDate(true)}
                          placeholder="DD-MM-YYYY"
                          icon={
                            <CalendarIcon
                              width={25}
                              height={25}
                              fillColor="#807F94"
                            />
                          }
                          isDisabled={false}
                          label="Rent Start Date"
                        />
                      </div>
                      <SelectDate
                        isOpen={openStartDate}
                        onClose={() => setOpenStartDate(false)}
                        value={values.rentStartDate}
                        onChange={(selectedDate: any) => {
                          setFieldValue("rentStartDate", selectedDate);
                          setOpenStartDate(false);
                        }}
                      />
                    </div>

                    <div className="md:w-1/2 w-full mt-0 md:mt-0">
                      <div
                        onClick={() => setOpenEndDate(true)}
                        className="cursor-pointer"
                      >
                        <FormikInputField
                          name="rentEndDate"
                          value={format(
                            new Date(values.rentEndDate),
                            "dd-MM-yyyy"
                          )}
                          onClick={() => setOpenEndDate(true)}
                          label="Rent End Date"
                          placeholder="DD-MM-YYYY"
                          icon={
                            <CalendarIcon
                              width={25}
                              height={25}
                              fillColor="#807F94"
                            />
                          }
                          isDisabled={false}
                        />
                      </div>
                    </div>

                    <SelectDate
                      isOpen={openEndDate}
                      onClose={() => setOpenEndDate(false)}
                      value={values.rentEndDate}
                      onChange={(selectedDate: any) => {
                        setFieldValue("rentEndDate", selectedDate);
                        setOpenEndDate(false);
                      }}
                    />
                  </div>
                  </div>
                </div>
                <div className="mt-4  mx-auto w-full mt-8 flex gap-4 justify-between">
                  <Button
                    type="button"
                    size="large"
                    className="block w-full"
                    variant="lightGrey"
                    showIcon={false}
                    onClick={() => {
                      resetForm();
                      setOpenAddTenantModal(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="large"
                    className="block w-full"
                    variant="lightGrey"
                    showIcon={false}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Loading..." : "Submit"}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </Modal>

      <Modal
        isOpen={openUploadAgreementDocsModal}
        onClose={() => {
          setOpenUploadAgreementDocsModal(false);
        }}
      >
        <div className="mx-auto w-full h-full p-3 sm:p-8 md:p-16">
          <h2 className="text-nrvPrimaryGreen font-semibold text-2xl">
            Upload Agreement Document
          </h2>
          <p className="text-nrvLightGrey text-sm mb-4 mt-4">
            Performing this action will assign a tenancy date frame to this
            tenant.
          </p>
          <Formik
            initialValues={{
              ownerId: tenantDetails?.data?.finalResult?.ownerId,
              propertyId: tenantDetails?.data?.finalResult?.propertyId?._id,
              applicant: tenantDetails?.data?.finalResult?.applicant?._id,
              unsignedDocument: null,
            }}
            validate={(values) => {
              console.log({ values: tenantDetails?.data });

              const errors: any = validateTenancyDateAssignment(values);

              if (!values.unsignedDocument) {
                errors.unsignedDocument =
                  "Please upload at least one document.";
              }

              return errors;
            }}
            onSubmit={(values, formikHelpers) => {
              console.log({ values });
              uploadTenantAgreement(values, formikHelpers, dispatch);
            }}
          >
            {({ isSubmitting, resetForm, values, errors, setFieldValue }) => (
              <Form>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <FileUploader
                    file={values.unsignedDocument} // Single file
                    onFileChange={(newFile) =>
                      setFieldValue("unsignedDocument", newFile)
                    }
                    label="Upload your document"
                  />

                  {typeof errors.unsignedDocument === 'string' && (
                    <div className="text-red-500 text-sm mt-2">
                      {errors.unsignedDocument}
                    </div>
                  )}
                </div>

                <div className="mt-4 mx-auto w-full mt-8 flex gap-4 justify-between">
                  <Button
                    type="button"
                    size="large"
                    className="block w-full"
                    variant="lightGrey"
                    showIcon={false}
                    onClick={() => {
                      resetForm();
                      setOpenUploadAgreementDocsModal(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="large"
                    className="block w-full"
                    variant="lightGrey"
                    showIcon={false}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Loading..." : "Submit"}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </Modal>

      <EndTenancyLeaseModal
        isOpen={openEndTenancyModal}
        onClose={() => setOpenTenancyModal(false)}
        recordId={tenantDetails?.data?.finalResult?._id}
        onSubmit={async (values) => {
          await endTenancy(
            values,
            {
              resetForm: () => {},
              setSubmitting: () => {},
            },
            dispatch,
          );
        }}
      />

      <Modal
        isOpen={openOnboardTenantModal}
        onClose={() => {
          setOpenOnboardTenantModal(false);
        }}
      >
        <div className="mx-auto w-full h-full p-3 sm:p-8 md:p-16">
          <h2 className="text-nrvPrimaryGreen font-semibold text-2xl">
            Onboard A New Tenant
          </h2>
          <p className="text-nrvLightGrey text-sm mb-4 mt-4">
            Performing this action will make this applicant the current occupant
            of this property for the designated time
          </p>
          <Formik
            initialValues={{
              firstName: "",
              lastName: "",
              email: "",
              nin: "",
              rentStartDate: new Date(),
              rentEndDate: new Date(),
              propertyId: data?._id,
              ownerId: user?._id,
              accountType: "tenant",
            }}
            validationSchema={validationSchema}
            onSubmit={(values, formikHelpers) =>
              addTenant(values, formikHelpers, dispatch)
            }
          >
            {({ isSubmitting, resetForm, values, setFieldValue }) => (
              <Form>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div className="w-full md:flex flex-row gap-3">
                    <div className="md:w-1/2 w-full mt-8 md:mt-0">
                      <FormikInputField
                        name="firstName"
                        placeholder="Enter First Name"
                        label="First Name"
                        value={values.firstName}
                      />
                    </div>
                    <div className="md:w-1/2 w-full mt-8 md:mt-0">
                      <FormikInputField
                        name="lastName"
                        placeholder="Last Name"
                        label="Enter Last Name"
                        value={values.lastName}
                      />
                    </div>
                  </div>
                  <div className="w-full md:flex flex-row gap-3">
                    <div className="md:w-1/2 w-full mt-8 md:mt-0">
                      <FormikInputField
                        name="email"
                        placeholder="Tenant Email"
                        label="Email"
                        value={values.email}
                      />
                    </div>
                    <div className="md:w-1/2 w-full mt-8 md:mt-0">
                      <FormikInputField
                        name="nin"
                        placeholder="Tenant NIN"
                        label="National Identification Number"
                        value={values.nin}
                      />
                    </div>
                  </div>

                  {/* Replace CustomDatePicker with SelectDate for Rent Start Date */}
                  <div className="w-full md:flex flex-row gap-3">
                    <div className="md:w-1/2 w-full mt-0 md:mt-0">
                      <div
                        onClick={() => setOpenStartDate(true)}
                        className="cursor-pointer"
                      >
                        <FormikInputField
                          name="rentStartDate"
                          value={format(
                            new Date(values.rentStartDate),
                            "dd-MM-yyyy"
                          )}
                          onClick={() => setOpenStartDate(true)}
                          placeholder="DD-MM-YYYY"
                          icon={
                            <CalendarIcon
                              width={25}
                              height={25}
                              fillColor="#807F94"
                            />
                          }
                          isDisabled={false}
                          label="Rent Start Date"
                        />
                      </div>
                      <SelectDate
                        isOpen={openStartDate}
                        onClose={() => setOpenStartDate(false)}
                        value={values.rentStartDate}
                        onChange={(selectedDate: any) => {
                          setFieldValue("rentStartDate", selectedDate);
                          setOpenStartDate(false);
                        }}
                      />
                    </div>

                    <div className="md:w-1/2 w-full mt-0 md:mt-0">
                      <div
                        onClick={() => setOpenEndDate(true)}
                        className="cursor-pointer"
                      >
                        <FormikInputField
                          name="rentEndDate"
                          value={format(
                            new Date(values.rentEndDate),
                            "dd-MM-yyyy"
                          )}
                          onClick={() => setOpenEndDate(true)}
                          label="Rent End Date"
                          placeholder="DD-MM-YYYY"
                          icon={
                            <CalendarIcon
                              width={25}
                              height={25}
                              fillColor="#807F94"
                            />
                          }
                          isDisabled={false}
                        />
                      </div>
                    </div>

                    <SelectDate
                      isOpen={openEndDate}
                      onClose={() => setOpenEndDate(false)}
                      value={values.rentEndDate}
                      onChange={(selectedDate: any) => {
                        setFieldValue("rentEndDate", selectedDate);
                        setOpenEndDate(false);
                      }}
                    />
                  </div>
                </div>
                <div className="mt-4 mx-auto w-full mt-8 flex gap-4 justify-between">
                  <Button
                    type="button"
                    size="large"
                    className="block w-full"
                    variant="lightGrey"
                    showIcon={false}
                    onClick={() => {
                      resetForm();
                      setOpenAddTenantModal(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="large"
                    className="block w-full"
                    variant="lightGrey"
                    showIcon={false}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Loading..." : "Submit"}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </Modal>

      {viewDocs === true ? (
        <div>
          {pdf === "image" && (
            <>
              <Viewer
                visible={viewerVisible}
                onClose={closeViewer}
                images={[{ src: fileUrl, alt: "Image" }]}
              />
            </>
          )}
          {pdf === "pdf" && (
            <div
              id="overlay"
              className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-40 z-50 flex justify-center items-center"
            >
              <div className="overflow-y-scroll bg-white p-4 relative">
                <button
                  onClick={closeViewer}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full px-4 py-2"
                >
                  X
                </button>
                <div>
                  <iframe
                    src={fileUrl}
                    height="600"
                    width="600"
                    title="PDF Viewer"
                  ></iframe>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default CurrentTenantDashboard;
