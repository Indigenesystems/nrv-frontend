"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { formatLeaseCalendarDate } from "@/helpers/utils";
import { API_URL } from "@/config/constant";
import { Button } from "@/components/ui/button";
import DataTable, { BaseRow } from "@/app/components/shared/tables/DataTable";
import { updateApplicationStatus } from "@/redux/slices/propertySlice";
import { apiService } from "@/lib/api";
import { formatEndTenancySummary, getApplicationCurrentResidence, getApplicationEmployer, getApplicationJobTitle } from "@/lib/applicationDisplay";
import { Users, Wallet, TrendingUp, TrendingDown } from "lucide-react";

type TenantManagementMetrics = {
  retentionRate: number;
  retentionRateChange: number;
  rentCollectionRate: number;
  rentCollectionRateChange: number;
};

const formatLeaseDate = (value: unknown) => {
  if (!value) {
    return "—";
  }
  const formatted = formatLeaseCalendarDate(value);
  return formatted || "—";
};

const formatTrend = (change: number | null) => {
  if (change === null) {
    return null;
  }
  return {
    trend: change >= 0 ? "up" : "down",
    label: `${Math.abs(change)}%`,
  };
};

const buildMetricCards = (metrics: TenantManagementMetrics | null) => {
  if (!metrics) {
    return [];
  }

  return [
    {
      title: "Retention Rate",
      value: `${metrics.retentionRate}%`,
      change: formatTrend(metrics.retentionRateChange),
      comparison: "active tenants vs ended leases",
    },
    {
      title: "Overall Rent Collection Status",
      value: `${metrics.rentCollectionRate}%`,
      change: formatTrend(metrics.rentCollectionRateChange),
      comparison: "leases currently within rent period",
    },
  ];
};

const InfoCard = ({ title, data = [], files = [], fileUrl }: any) => (
  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
      <div className="w-1.5 h-4 bg-green-600 rounded-full"></div>
      <div className="font-semibold text-base text-gray-900">{title}</div>
    </div>
    <div className="space-y-3">
      {data.map(([label, value]: any, idx: number) => (
        <div key={idx} className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
          <span className="font-medium text-gray-500">{label}:</span>
          <span className="text-gray-900 text-right font-medium">{value}</span>
        </div>
      ))}
      {files.map(([label, url]: any, idx: number) => (
        <div key={idx} className="flex justify-between items-center text-sm pt-1">
          <span className="font-medium text-gray-500">{label}:</span>
          <a
            href={url}
            className="inline-flex items-center gap-1 text-green-600 font-medium hover:text-green-700 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      ))}
      {fileUrl && (
        <div className="pt-3 mt-2 border-t border-gray-50">
          <a
            href={fileUrl}
            className="inline-flex w-full items-center justify-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Proof
          </a>
        </div>
      )}
    </div>
  </div>
);

const LandlordsTenantsScreen = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [tenantMetrics, setTenantMetrics] =
    useState<TenantManagementMetrics | null>(null);

  const [user, setUser] = useState<any>({});
  const [application, setApplication] = useState<any>([]);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get("tab") === "ended" ? "ended" : "Active_lease",
  );

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
      <div className="flex gap-2">
        <p
          className="text-xs text-[#2B892B] font-medium cursor-pointer"
          onClick={() => {
            if (leaseId) {
              router.push(`/dashboard/landlord/tenants/${leaseId}`);
            }
          }}
        >
          View lease details
        </p>
      </div>
    );
  };

  const handleTabClick = (status: string) => {
    setActiveTab(status);
    router.replace(
      status === "ended"
        ? "/dashboard/landlord/tenants?tab=ended"
        : "/dashboard/landlord/tenants",
    );
  };

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "ended") {
      setActiveTab("ended");
    } else if (!tab) {
      setActiveTab("Active_lease");
    }
  }, [searchParams]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("nrv-user") as any);
    const currentUser = stored?.user;
    setUser(currentUser);

    const loadMetrics = async () => {
      if (!currentUser?._id) {
        setMetricsLoading(false);
        return;
      }

      setMetricsLoading(true);
      try {
        const res: any = await apiService.get(
          `/properties/landlord-tenant-metrics?id=${encodeURIComponent(currentUser._id)}`,
        );
        setTenantMetrics(res?.data?.data ?? res?.data ?? null);
      } catch {
        setTenantMetrics(null);
      } finally {
        setMetricsLoading(false);
      }
    };

    loadMetrics();
  }, []);

  const metricCards = buildMetricCards(tenantMetrics);

  return (
    <div>
      {currentStep === 1 && (
        <div>
          <div className="space-y-12 p-4 font-jakarta">
            {/* Header */}
            <div className="flex items-center justify-between w-full gap-5 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold">
                  Tenant Management
                </h2>
                <p className="text-gray-500 text-sm mt-2 font-lighter">
                  View and manage your tenant directory.
                </p>
              </div>
              
            </div>
            <div className="grid md:grid-cols-2 grid-cols-1 gap-6 mb-8">
              {metricsLoading
                ? [1, 2].map((item) => (
                    <div
                      key={item}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-4 w-28 rounded bg-gray-200" />
                        <div className="h-10 w-10 rounded-full bg-gray-100" />
                      </div>
                      <div className="h-8 w-20 rounded bg-gray-200 mb-4" />
                      <div className="h-3 w-full max-w-[180px] rounded bg-gray-100 mt-auto" />
                    </div>
                  ))
                : metricCards.map((card, i) => (
                    <div
                      key={card.title}
                      className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-6 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col group relative overflow-hidden"
                    >
                      {/* Decorative background gradient */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-50/50 to-transparent rounded-bl-full -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <p className="text-gray-500 text-sm font-medium">{card.title}</p>
                        <div className="p-2.5 bg-green-50 text-green-700 rounded-xl group-hover:bg-green-100 transition-colors duration-300">
                          {i === 0 ? <Users className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-2 relative z-10 tracking-tight">
                        {card.value}
                      </h3>
                      <div className="mt-auto relative z-10 pt-4 border-t border-gray-50">
                        {card.change ? (
                          <div className="flex items-center flex-wrap gap-2">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
                                card.change.trend === "up"
                                  ? "bg-green-50 text-green-700 border border-green-100"
                                  : "bg-red-50 text-red-700 border border-red-100"
                              }`}
                            >
                              {card.change.trend === "up" ? (
                                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                              ) : (
                                <TrendingDown className="w-3.5 h-3.5 mr-1" />
                              )}
                              {card.change.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {card.comparison}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                            {card.comparison}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
            </div>

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
                Active Leases/Tenants{" "}
              </Button>
              <Button
                className={`${
                  activeTab === "ended"
                    ? "bg-green-700 text-white"
                    : "bg-white text-gray-800 border"
                }`}
                onClick={() => handleTabClick("ended")}
              >
                Past Leases{" "}
                <span className="ml-2 font-semibold"></span>
              </Button>
            </div>

            {/* Section Title */}
            <div className="flex-col items-center gap-4 mt-2">
              <h4 className="text-lg font-semibold">
                {activeTab === "ended" ? "Past Leases" : "Tenants"}
              </h4>
              <span className="text-gray-400 text-sm">
                {activeTab === "ended"
                  ? "Ended leases appear here — open a row to view details"
                  : "View and manage Tenants"}
              </span>
            </div>
          </div>

          <DataTable
            rowActions={handleRowAction}
            key={activeTab}
            endpoint={`${API_URL}/properties/applications/${
              JSON.parse(localStorage.getItem("nrv-user") as any)?.user?._id
            }`}
            status={activeTab}
            columns={[
              {
                key: "applicant",
                label: "Tenant",
                render: (val) => (
                  <div>
                    <div className="text-[#101828] font-medium text-[13px]">
                      {[val?.firstName, val?.lastName]
                        .filter(Boolean)
                        .join(" ") ||
                        val?.fullName ||
                        "—"}
                    </div>
                    {val?.email && (
                      <div className="text-[#667085] font-light text-[12px]">
                        {val.email}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: "propertyId",
                label: "Apartment Name & Address",
                render: (val) => (
                  <div>
                    <div className="text-[#101828] font-medium text-[13px]">
                      {val?.apartmentStyle || val?.description || "N/A"}
                    </div>
                    <div className="text-[#667085] font-light">
                      {[
                        val?.propertyId?.streetAddress,
                        val?.propertyId?.state,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </div>
                  </div>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (val) => (
                  <span
                    className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      val === "Ended" ||
                      val === "ended" ||
                      val === "Expired" ||
                      val === "expired"
                        ? "bg-red-100 text-red-700"
                        : "bg-[#E9F4E7] text-[#045D23]"
                    }`}
                  >
                    {val === "Active_lease"
                      ? "Active Lease"
                      : val === "Ended" || val === "ended"
                        ? "Ended"
                        : val === "Expired" || val === "expired"
                          ? "Expired"
                          : val || "—"}
                  </span>
                ),
              },
              {
                key: "rentStartDate",
                label: "Lease Start Date",
                render: (val) => <span>{formatLeaseDate(val)}</span>,
              },
              {
                key: "rentEndDate",
                label: "Lease End Date",
                render: (val) => <span>{formatLeaseDate(val)}</span>,
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
                    {
                      key: "tenancyComments",
                      label: "Comments",
                      render: (val: unknown) => {
                        const count = Array.isArray(val) ? val.length : 0;
                        return (
                          <span className="text-sm text-gray-700">
                            {count}
                          </span>
                        );
                      },
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
            <span className="text-nrvGreyBlack">Applicant Profile</span>
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
                <div className="text-sm text-gray-500 break-all">
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
                <div className="flex gap-2 mt-3 justify-center flex-wrap">
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
    </div>
  );
};

export default LandlordsTenantsScreen;
