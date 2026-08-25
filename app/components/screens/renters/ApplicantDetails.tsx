"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import {
  createUploadAgreement,
  getApplicationsById,
  updateApplicationStatus,
} from "@/redux/slices/propertySlice";
import { toast } from "react-toastify";
import Image from "next/image";
import { format, startOfToday } from "date-fns";
import { Form, Formik, FormikHelpers } from "formik";
import CustomDatePicker from "../../shared/CustomDatePicker";
import Modal from "../../shared/modals/Modal";
import EndTenancyLeaseModal from "../../shared/EndTenancyLeaseModal";
import { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import {
  assignDateTenancyTenure,
  endTenancyTenure,
  extendTenancyTenure,
} from "@/redux/slices/userSlice";
import { getFileExtension } from "@/helpers/utils";
import { formatEndTenancySummary } from "@/lib/applicationDisplay";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Label } from "@/components/ui/label";
import BackIcon from "../../shared/icons/BackIcon";

const InfoCard = ({ title, data = [], files = [], fileUrl }: any) => (
  <div className="bg-white p-4 rounded-md">
    <div className="font-semibold text-md text-nrvGreyBlack mb-2">{title}</div>
    {data.map(([label, value]: any, idx: number) => (
      <div key={idx} className="text-sm mb-2">
        <span className="font-medium text-nrvGreyBlack">{label}:</span> {value}
      </div>
    ))}
    {files.map(([label, url]: any, idx: number) => (
      <div key={idx} className="text-sm mb-2">
        <span className="font-medium text-nrvGreyBlack">{label}:</span>{" "}
        <a
          href={url}
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          View
        </a>
      </div>
    ))}
    {fileUrl && (
      <div className="text-sm">
        <a
          href={fileUrl}
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Download Proof
        </a>
      </div>
    )}
  </div>
);

const ApplicationDetails = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { id }: any = useParams();
  const [showNIN, setShowNIN] = useState(false);
  const application = useSelector((state: any) => state?.property?.data?.data);
  const [isLoading, setIsLoading] = useState(false);
  const [openAssignDateModal, setOpenAssignDateModal] = useState(false);
  const [openUploadAgreementDocsModal, setOpenUploadAgreementDocsModal] =
    useState(false);

  const [openEndTenancyModal, setOpenTenancyModal] = useState(false);
  const [unsignedDocument, setUnsignedDocuments] = useState<File[]>([]);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [tenantDetails, setTenantDetails] = useState<any>({});
  const [viewerVisible, setViewerVisible] = useState<boolean>(true);
  const [isVisible, setIsVisible] = useState(false);
  const [pdf, setPdf] = useState<any>(null);
  const [openAddTenantModal, setOpenAddTenantModal] = useState(false);
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const handleVerifyTenant = () => {
    const sp = new URLSearchParams();
    const applicant = application?.applicant;
    if (applicant?.firstName) sp.set("firstName", applicant.firstName);
    if (applicant?.lastName) sp.set("lastName", applicant.lastName);
    if (applicant?.email) sp.set("email", applicant.email);
    if (applicant?.nin) sp.set("nin", applicant.nin);
    router.push(
      `/dashboard/landlord/properties/verification/request${
        sp.toString() ? `?${sp.toString()}` : ""
      }`
    );
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

  const formatDateToWords = (dateString: any) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })?.format(date);
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

  type AddTenantFunction = (
    values: any,
    formikHelpers: Pick<FormikHelpers<any>, "resetForm" | "setSubmitting">,
    dispatch: ThunkDispatch<any, any, AnyAction>
  ) => Promise<void>;

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
    //  setViewDocs(true);
    setViewerVisible(true); // Ensure viewer is visible when a document is viewed
  };

  const closeViewer = () => {
    setViewerVisible(false);
    //  setViewDocs(false);
    setFileUrl(""); // Reset fileUrl
    setPdf(""); // Reset pdf state
  };

  const endTenancy: AddTenantFunction = async (
    values,
    { resetForm, setSubmitting },
    dispatch
  ) => {
    try {
      await dispatch(
        endTenancyTenure({
          id: values.id,
          reason: values.reason,
          comment: values.comment,
        }) as any,
      ).unwrap();
      toast.success("Tenancy lease ended successfully");
      resetForm();
      router.push("/dashboard/landlord/tenants?tab=ended");
    } catch (error: any) {
      toast.error(
        error?.message ||
          error?.payload ||
          error?.response?.data?.message ||
          "Failed to end tenancy lease. Please try again.",
      );
    } finally {
      setSubmitting(false);
      setOpenTenancyModal(false);
    }
  };
  const handleSubmit = async (status: any) => {
    const payload = {
      id: application?._id,
      status: status,
    };
    try {
      setIsLoading(true);
      await dispatch(updateApplicationStatus(payload) as any).unwrap();
      toast.success("Application accepted");
      router.push("/dashboard/landlord/properties/renters");
    } catch (error: any) {
      toast.error(error);
    }
  };

  const handleAppApproval = async (status: any) => {
    const payload = {
      id: application?._id,
      status: status,
    };
    try {
      setIsLoading(true);
      await dispatch(updateApplicationStatus(payload) as any).unwrap();
      toast.success("Application accepted");
      router.push("/dashboard/landlord/properties/renters");
    } catch (error: any) {
      toast.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const formData = { id: id };
    if (id) {
      dispatch(getApplicationsById(formData as any) as any);
    }
  }, [id, dispatch]);

  if (!application) return <div className="p-4">Loading lease details...</div>;

  return (
    <div className="mx-5 my-4">
      {/* Breadcrumb and Back Button */}
      <div className="flex items-center justify-between gap-5 mb-4">
        <div className="flex items-center gap-3 text-sm">
          <BackIcon />
          <span className="text-nrvGreyBlack">Applicant Profile</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="w-full md:w-full bg-white rounded-md">
          <div className="border rounded-lg flex flex-col sm:flex-row overflow-hidden">
            {/* <div className="h-[168px] aspect-square" ></div> */}
            <Image
              height={168}
              width={168}
              src={application?.propertyId?.propertyId?.file}
              alt="property"
              className="object-cover aspect-square h-full hidden md:block"
            />
            <div className="px-5 py-3">
              <div className="bg-[#E9F4E7] text-[#099137] w-fit text-xs py-1 px-4 rounded-full">
                Application Status:{" "}
                {application?.status === "Active_lease" ? "Active Lease" : application?.status }
              </div>
              <div className="text-[20px] font-semibold mt-1">
                {application?.propertyId?.description}
              </div>
              <p>
                {application?.propertyId?.propertyId?.streetAddress},{" "}
                {application?.propertyId?.propertyId?.city},{" "}
                {application?.propertyId?.propertyId?.state}
              </p>
              <p className="text-sm text-[#807F94] mt-1">
                Applied on{" "}
                {application?.createdAt
                  ? format(new Date(application?.createdAt), "do, MMM yyyy")
                  : ""}
              </p>
            </div>
          </div>

          {/* <div className="mb-4">
            <img
              src={application?.propertyId?.propertyId?.file}
              alt="Property"
              className="rounded-md w-full h-40 object-cover"
            />
            <div className="text-sm text-green-600 font-medium mt-2">
              Tenant Status: Active
            </div>
            <div className="text-md font-semibold mt-1">
              {application?.propertyTitle}
            </div>
            <div className="text-sm text-gray-500">
              {application?.propertyLocation}
            </div>
            <div className="text-xs mt-1">
              Applied on: {application?.appliedDate}
            </div>
          </div> */}

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full text-center mt-5 border rounded-lg">
              <div className="flex flex-col items-center">
                <p className="text-[24px] text-[#03442C] font-semibold mt-3">
                  {application?.applicant?.firstName}{" "}
                  {application?.applicant?.lastName}
                </p>
                <p className="text-lg text-gray-500">
                  {application?.applicant?.email}
                </p>

                <p className=" text-gray-700">
                  {application?.applicant?.phoneNumber}
                </p>
              </div>

              <div className="mt-4 bg-[#E9F4E7] p-4 text-[24px] font-semibold rounded flex justify-between items-center">
                <span>
                  {showNIN ? application?.applicant?.nin : "**********"}
                </span>
                <button
                  onClick={() => setShowNIN(!showNIN)}
                  className="underline text-lg text-green-600"
                >
                  {!showNIN ? "Show NIN" : "Hide NIN"}
                </button>
              </div>

              {!(
                application?.status == "active" ||
                application?.status == "Accepted" ||
                application?.status == "Active_lease"
              ) && (
                <div className="flex gap-2 mt-5 justify-center px-4">
                  <Button
                    className="bg-nrvPrimaryGreen hover:bg-nrvPrimaryGreen/80 text-white text-xs px-4 py-2 w-full"
                    disabled={isLoading}
                    onClick={handleVerifyTenant}
                  >
                    Verify Tenant
                  </Button>
                  <Button
                    className="bg-white hover:bg-black/10 border border-red-500 text-red-500 text-xs px-4 py-2 w-full"
                    onClick={() => handleAppApproval("Rejected")}
                  >
                    Reject
                  </Button>
                </div>
              )}
              <div className="mt-8">
                {
                  
                    application?.status == "Accepted" && (
                    <Button
                      className="bg-nrvPrimaryGreen hover:bg-nrvPrimaryGreen/80 text-white text-xs px-4 py-2 w-full"
                      disabled={isLoading}
                      onClick={() => setOpenAssignDateModal(true)}
                    >
                      Set Lease Period
                    </Button>
                  )}
              </div>
            </div>
            <div className="w-full p-4 border rounded-lg mt-4">
              <div className="flex">
                <p className="text-lg font-semibold">Employment Details</p>
              </div>
              <div className="flex gap-4">
                <div className="w-full mt-4 text-sm text-start">
                  <p className="text-[#475467]">Employer</p>
                  <p className="font-semibold">
                    {application?.currentEmployer ?? "N/A"}
                  </p>
                </div>

                <div className="w-full mt-4 text-sm flex flex-col  text-start">
                  <p className=" text-[#475467]">Salary</p>
                  <p className="font-semibold">{`₦${application?.monthlyIncome?.toLocaleString()}`}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 border rounded-lg  mt-5">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold">Lease Period</p>
            </div>
            <div className="mt-4 flex gap-4">
              <div className="w-full text-sm flex items-center gap-2 justify-between border rounded-md p-2">
                <div>
                  <p className="text-sm font-semibold">Lease Start Date</p>
                  <p>
                    {application?.rentStartDate
                      ? formatDateToWords(
                          application?.rentStartDate?.slice(0, 10)
                        )
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="w-full text-sm flex items-center gap-2 justify-between border rounded-md p-2">
                <div>
                  <p className="text-sm font-semibold">Lease End Date</p>
                  <p>
                    {application?.rentStartDate
                      ? formatDateToWords(application?.rentEndDate.slice(0, 10))
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {(application?.status === "Ended" ||
            application?.status === "ended" ||
            application?.status === "Expired" ||
            application?.status === "expired") &&
            formatEndTenancySummary(application) && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                  Reason tenancy ended
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatEndTenancySummary(application)}
                </p>
              </div>
            )}
          {(application?.status === "Active_lease" ||
            application?.status === "active" ||
            application?.status === "Expired" ||
            application?.status === "expired" ||
            String(application?.status || "").toLowerCase() === "active_lease") && (
            <div className="mt-4">
              <Button
                type="button"
                className="w-full border border-red-200 bg-white text-red-700 hover:bg-red-50"
                onClick={() => setOpenTenancyModal(true)}
              >
                End tenancy lease
              </Button>
            </div>
          )}
        </div>

        <div className="w-full md:w-full grid grid-cols-1 md:grid-cols-1 gap-4 h-fit"></div>
      </div>

      <Modal
        isOpen={openAssignDateModal}
        onClose={() => setOpenAssignDateModal(false)}
      >
        <div className="mx-auto h-full w-full p-3 sm:p-8 md:p-16">
          <h2 className="text-nrvPrimaryGreen font-semibold text-2xl">
            Assign Rent Start and End Date
          </h2>
          <p className="text-nrvLightGrey text-sm mb-4 mt-4">
            Performing this action will assign a tenancy date frame to this
            tenant.
          </p>

          <Formik
            initialValues={{
              id: tenantDetails?.data?.finalResult?._id || id,
              rentStartDate: null,
              rentEndDate: null,
            }}
            validate={validateTenancyDateAssignment}
            onSubmit={(values, formikHelpers) =>
              assignDateToTenancy(values, formikHelpers, dispatch)
            }
          >
            {({ isSubmitting, resetForm, values, errors, setFieldValue }) => (
              <Form>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <div>
                    <Label>Lease Start Date</Label>

                    <div className="w-full h-11 rounded-sm border border-[#E0E0E6] mt-2 px-2">
                      <DatePicker
                        value={values.rentStartDate}
                        onChange={(newValue) =>
                          setFieldValue("rentStartDate", newValue)
                        }
                        minDate={startOfToday()}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                            variant: "standard",
                            InputProps: { disableUnderline: true },
                            sx: {
                              fontSize: "12px",
                              backgroundColor: "white",
                              border: "red",
                              boxShadow: "none",
                              "& input": {
                                color: "#807F94",
                                padding: "8px 4px",
                              },
                            },
                          },
                          day: {
                            sx: {
                              backgroundColor: "#F5F5F5",
                              "&.Mui-selected": {
                                backgroundColor: "#007443",
                                color: "#ffffff",
                              },
                              "&.MuiPickersDay-today": {
                                border: "1px solid #3B82F6",
                                backgroundColor: "#007443",
                              },
                              "&.MuiPickersDay-today.Mui-selected": {
                                backgroundColor: "#007443",
                                color: "#fff",
                              },
                              "&:hover": {
                                backgroundColor: "#007443",
                                color: "#ffffff",
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                  <div className="pt-4">
                    <Label>Lease End Date</Label>
                    <div className="w-full h-11 rounded-sm border border-[#E0E0E6] mt-2 px-2">
                      <DatePicker
                        value={values.rentEndDate}
                        onChange={(newValue) =>
                          setFieldValue("rentEndDate", newValue)
                        }
                        minDate={values.rentStartDate || startOfToday()}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                            variant: "standard",
                            InputProps: { disableUnderline: true },
                            sx: {
                              fontSize: "12px",
                              backgroundColor: "white",
                              boxShadow: "none",
                              "& input": {
                                color: "#807F94",
                                padding: "8px 4px",
                              },
                            },
                          },
                          day: {
                            sx: {
                              backgroundColor: "#F5F5F5",
                              "&.Mui-selected": {
                                backgroundColor: "#007443",
                                color: "#ffffff",
                              },
                              "&.MuiPickersDay-today": {
                                border: "1px solid #3B82F6",
                                backgroundColor: "#007443",
                              },
                              "&.MuiPickersDay-today.Mui-selected": {
                                backgroundColor: "#007443",
                                color: "#fff",
                              },
                              "&:hover": {
                                backgroundColor: "#007443",
                                color: "#ffffff",
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </LocalizationProvider>

                <div className="mt-8 flex gap-4 justify-between w-full">
                  <Button
                    type="button"
                    className="block w-full"
                    onClick={() => {
                      resetForm();
                      setOpenAssignDateModal(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="block w-full"
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
        recordId={application?._id}
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
    </div>
  );
};

export default ApplicationDetails;
