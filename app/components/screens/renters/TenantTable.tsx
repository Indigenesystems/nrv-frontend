"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  createUploadAgreement,
  getApplicationsByLandlordId,
  inviteApplicant,
  updateApplicationStatus,
} from "../../../../redux/slices/propertySlice";
import { toast } from "react-toastify";
import { formatDateToWords, getFileExtension } from "@/helpers/utils";
import { RefreshCcw } from "lucide-react";
import DataTable, { BaseRow } from "../../shared/tables/DataTable";
import { API_URL } from "@/config/constant";
import { Button } from "@/components/ui/button";
import { FormikHelpers } from "formik";
import { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import { assignDateTenancyTenure, createUserByLandlord, endTenancyTenure, extendTenancyTenure } from "@/redux/slices/userSlice";
import EndTenancyLeaseModal from "../../shared/EndTenancyLeaseModal";
import { apiService } from "@/lib/api";
import {
  formatEndTenancySummary,
  getApplicationCurrentResidence,
  getApplicationEmployer,
  getApplicationJobTitle,
} from "@/lib/applicationDisplay";

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

const TenantTable = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);

  const [user, setUser] = useState<any>({});
  const [application, setApplication] = useState<any>([]);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>("Active_lease");
  const [openEndTenancyModal, setOpenTenancyModal] = useState(false);
  const [endTenancyRecordId, setEndTenancyRecordId] = useState<string | null>(null);
  const [tableRefreshKey, setTableRefreshKey] = useState(0);
  const [dashboardCounts, setDashboardCounts] = useState<{
    totalActiveTenants?: number;
    totalProperties?: number;
    totalNew?: number;
    totalAccepted?: number;
  }>({});
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
      setTableRefreshKey((key) => key + 1);
      setActiveTab("ended");
    } catch (error: any) {
      toast.error(
        error?.message ||
          error?.payload ||
          "Failed to end tenancy lease. Please try again.",
      );
    } finally {
      setSubmitting(false);
      setOpenTenancyModal(false);
      setEndTenancyRecordId(null);
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

  const handleRowAction = (row: BaseRow) => {
    const leaseId = row._id ?? row.id;
    return (
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <p
          className="text-xs text-[#2B892B] font-medium cursor-pointer"
          onClick={() =>
            router.push(`/dashboard/tenant/properties/applications/${row._id}`)
          }
        >
          view
        </p>
        {activeTab === "Active_lease" && leaseId ? (
          <button
            type="button"
            className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
            onClick={() => {
              setEndTenancyRecordId(String(leaseId));
              setOpenTenancyModal(true);
            }}
          >
            End tenancy lease
          </button>
        ) : null}
      </div>
    );
  };

  const handleTabClick = (status: string) => {
    setActiveTab(status);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("nrv-user") as any);
    setUser(user?.user);
    const landlordId = user?.user?._id;
    if (!landlordId) {
      return;
    }
    apiService
      .get(`/properties/application-count?id=${encodeURIComponent(landlordId)}`)
      .then((res: any) => {
        setDashboardCounts(res?.data ?? {});
      })
      .catch(() => setDashboardCounts({}));
  }, [tableRefreshKey]);

  return (
    <div>
      {currentStep === 1 && (
        <div>
          <div className="space-y-12 p-4 font-jakarta">
            {/* Header */}
            <div className="flex items-center justify-between w-full">
              <div>
                <h2 className="text-xl font-semibold">Tenant Management</h2>
                <p className="text-gray-500 text-sm mt-2 font-lighter">
                  {" "}
                  View & Manage Tenant Directoy
                </p>
              </div>
              
            </div>
            {
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 border">
                {[
                  {
                    title: "Total Active Leases",
                    value: String(dashboardCounts.totalActiveTenants ?? 0),
                    change: "—",
                    trend: "up",
                    comparison: "current active tenancy leases",
                  },
                  {
                    title: "Total Leads & Applicants",
                    value: String(
                      (dashboardCounts.totalNew ?? 0) +
                        (dashboardCounts.totalAccepted ?? 0),
                    ),
                    change: "—",
                    trend: "up",
                    comparison: "new and accepted applications",
                  },
                  {
                    title: "Total Properties",
                    value: String(dashboardCounts.totalProperties ?? 0),
                    change: "—",
                    trend: "up",
                    comparison: "properties on your account",
                  },
                ].map((card, i) => (
                  <div key={i} className="border-r last:border-none px-4">
                    <p className="text-gray-500 text-sm">{card.title}</p>
                    <h3 className="text-xl font-semibold text-green-900">
                      {card.value}
                    </h3>
                    <p
                      className={`text-xs mt-1 ${
                        card.trend === "up" ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {card.trend === "up" ? "↑" : "↓"} {card.change}{" "}
                      {card.comparison}
                    </p>
                  </div>
                ))}
              </div>
            }

            <div className="flex gap-3 flex-wrap">
              <Button
                variant="default"
                className={`${
                  activeTab === "Active_lease"
                    ? "bg-green-700 text-white"
                    : "bg-white text-gray-800 border"
                }`}
                onClick={() => handleTabClick("Active_lease")}
              >
                Active Tenants{" "}
                <span className="ml-2 font-semibold">
                  {/* {maintenance?.summary?.New} */}
                </span>
              </Button>
              <Button
                className={`${
                  activeTab === "ended"
                    ? "bg-green-700 text-white"
                    : "bg-white text-gray-800 border"
                }`}
                onClick={() => handleTabClick("ended")}
              >
                Past Tenants <span className="ml-2 font-semibold"></span>
              </Button>
            </div>

            {/* Section Title */}
            <div className="flex-col items-center gap-4 mt-2">
              <h4 className="text-lg font-semibold">Manage Tenants</h4>
              <span className="text-gray-400 text-sm">
                View and manage all your tenants
              </span>
            </div>
          </div>

          <DataTable
             searchTerm = {false}
            rowActions={handleRowAction}
            key={`${activeTab}-${tableRefreshKey}`}
            endpoint={`${API_URL}/properties/tenant/landlord-onboarded/${
              JSON.parse(localStorage.getItem("nrv-user") as any).user._id
            }`}
            status={activeTab}
            columns={[
              {
                key: "applicant",
                label: "Tenant Name",
                render: (val) => (
                  <div>
                    <div className="text-[#101828] font-medium text-[13px]">
                      {val?.firstName} {val?.lastName}
                    </div>
                  </div>
                ),
              },
              {
                key: "propertyId",
                label: "Apartment Name & Address",
                render: (val) => (
                  <div>
                    <div className="text-[#101828] font-medium text-[13px]">
                      {val?.apartmentStyle || "N/A"}
                    </div>
                    <div className="text-[#667085] font-light">
                      {val?.propertyId?.streetAddress}, {val?.propertyId?.state}
                      , Nigeria
                    </div>
                  </div>
                ),
              },
              {
                key: "leaseDuration",
                label: "Lease Duration",
                render: (_val, row) => {
                  const start = row?.rentStartDate
                    ? new Date(row.rentStartDate)
                    : null;
                  const end = row?.rentEndDate
                    ? new Date(row.rentEndDate)
                    : null;

                  if (!start || !end) {
                    return (
                      <span className="text-[#D92D20] italic underline cursor-pointer">
                        Lease hasn&lsquo;t started, click here to start lease
                      </span>
                    );
                  }

                  const durationInYears =
                    end.getFullYear() - start.getFullYear();
                  const formattedStart = start.toLocaleDateString("en-GB");
                  const formattedEnd = end.toLocaleDateString("en-GB");

                  return `${durationInYears} year${
                    durationInYears > 1 ? "s" : ""
                  } (${formattedStart} – ${formattedEnd})`;
                },
              },
              {
                key: "propertyId",
                label: "Rent Amount",
                render: (val) => (
                  <span>
                    {val?.rentAmount ? val?.rentAmount.toLocaleString() : null}
                  </span>
                ),
              },
              {
                key: "createdAt",
                label: "Applied Date & Time",
                render: (val) => <span>{formatDateToWords(val)}</span>,
              },
              ...(activeTab === "ended"
                ? [
                    {
                      key: "endTenancyReason",
                      label: "End Reason",
                      render: (_val: unknown, row: BaseRow) => (
                        <span className="text-sm text-gray-700">
                          {formatEndTenancySummary(row) || "—"}
                        </span>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      )}
      {currentStep === 2 && (
        <div className="mx-2 my-4">
          {/* Breadcrumb and Back Button */}
          <div className="flex items-center gap-3 text-sm mb-3">
            <button
              className="text-nrvGreyBlack"
              onClick={() => setCurrentStep(1)}
            >
              <svg
                width="22"
                height="12"
                viewBox="0 0 22 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 6.75C21.4142 6.75 21.75 6.41421 21.75 6C21.75 5.58579 21.4142 5.25 21 5.25V6.75ZM0.469669 5.46967C0.176777 5.76256 0.176777 6.23744 0.469669 6.53033L5.24264 11.3033C5.53553 11.5962 6.01041 11.5962 6.3033 11.3033C6.59619 11.0104 6.59619 10.5355 6.3033 10.2426L2.06066 6L6.3033 1.75736C6.59619 1.46447 6.59619 0.989593 6.3033 0.696699C6.01041 0.403806 5.53553 0.403806 5.24264 0.696699L0.469669 5.46967ZM21 5.25L1 5.25V6.75L21 6.75V5.25Z"
                  fill="#333333"
                />
              </svg>
            </button>
            <span className="text-nrvGreyBlack">Tenant Details</span>
          </div>

          {/* Grid Layout */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Left Panel */}
            <div className="w-full md:w-1/3 bg-white rounded-md p-4">
              {/* Property Card */}
              <div className="mb-4">
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
              </div>

              {/* Applicant Info */}
              <div className="text-center">
                <img
                  src={application?.applicant?.photoUrl}
                  alt="Profile"
                  className="w-16 h-16 mx-auto rounded-full"
                />
                <div className="text-green-700 text-xs font-medium mt-1">
                  Account Confirmed
                </div>
                <div className="text-md font-semibold mt-1">
                  {application?.applicant?.fullName}
                </div>
                <div className="text-sm text-gray-500">
                  {application?.applicant?.email}
                </div>

                {/* NIN */}
                <div className="mt-4 bg-gray-100 p-2 rounded flex justify-between items-center">
                  <span>3456 **** *****</span>
                  <button className="text-sm text-green-600">Show NIN</button>
                </div>

                {/* Phone + Actions */}
                <div className="mt-4 text-sm text-gray-700">
                  {application?.applicant?.phoneNumber}
                </div>
                <div className="flex gap-2 mt-3 justify-center">
                  <Button className="bg-nrvPrimaryGreen text-white text-xs px-4 py-2">
                    Send Message
                  </Button>
                  <Button className="bg-nrvGreyMediumBg text-xs px-4 py-2">
                    Send Offer
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personal Info */}
              <InfoCard
                title="Personal Information"
                data={[
                  ["Marital Status", application?.applicant?.maritalStatus],
                  ["Gender", application?.applicant?.gender],
                  ["Date of Birth", application?.applicant?.dob],
                ]}
              />

              {/* Employment Details */}
              <InfoCard
                title="Employment Details"
                data={[
                  ["Employer", getApplicationEmployer(application) || "—"],
                  ["Job Title", getApplicationJobTitle(application) || "—"],
                  [
                    "Current Residence",
                    getApplicationCurrentResidence(application) || "—",
                  ],
                ]}
              />

              {/* Rental History */}
              <InfoCard
                title="Recent Rental History"
                data={[
                  ["Previous Address", application?.rental?.previousAddress],
                  ["Reason for Moving", application?.rental?.reasonForMoving],
                  [
                    "Landlord Reference",
                    application?.rental?.landlordReference,
                  ],
                ]}
              />

              {/* Background Check */}
              <InfoCard
                title="Background Check Status"
                data={[
                  [
                    "Criminal Record",
                    application?.criminalRecord ? "Yes" : "Clear",
                  ],
                  ["Credit Score", application?.creditScore],
                  ["Interview Notes", application?.interviewNotes],
                ]}
              />

              {/* Rental Payment History */}
              <InfoCard
                title="Rental Payment History"
                data={[["Timelines", "100% On-Time Payments"]]}
                fileUrl={application?.documents?.proofOfPayment}
              />

              {/* Identification */}
              <InfoCard
                title="Identification"
                files={[
                  ["Government ID", application?.documents?.govtID],
                  ["Selfie", application?.documents?.selfie],
                ]}
              />

              {/* Submitted Docs */}
              <InfoCard
                title="Submitted Documents"
                files={[
                  ["Proof of Income", application?.documents?.bankStatement],
                  ["Reference Letter", application?.documents?.referenceLetter],
                ]}
              />
            </div>
          </div>
        </div>
      )}
      <EndTenancyLeaseModal
        isOpen={openEndTenancyModal}
        onClose={() => {
          setOpenTenancyModal(false);
          setEndTenancyRecordId(null);
        }}
        recordId={endTenancyRecordId ?? undefined}
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

export default TenantTable;
