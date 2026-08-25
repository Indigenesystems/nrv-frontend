"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { useParams, usePathname, useRouter } from "next/navigation";
import { format, startOfToday } from "date-fns";
import {
  getApplicationsById,
  updateApplicationStatus,
} from "@/redux/slices/propertySlice";
import { toast } from "react-toastify";
import Image from "next/image";
import { Form, Formik, FormikHelpers } from "formik";
import { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import {
  assignDateTenancyTenure,
  endTenancyTenure,
  extendTenancyTenure,
} from "@/redux/slices/userSlice";
import { ApplicationStatus, formatLeaseCalendarDate, getFileExtension, normalizeAmenities, toLeaseCalendarDateIso } from "@/helpers/utils";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Label } from "@/components/ui/label";
import BackIcon from "../../shared/icons/BackIcon";
import Modal from "../../shared/modals/Modal";
import EndTenancyLeaseModal from "../../shared/EndTenancyLeaseModal";
import {
  Bath,
  BedDouble,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Home,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import VerificationRequestModal, {
  type VerificationRequestContext,
} from "@/app/components/shared/VerificationRequestModal";
import {
  formatEndTenancySummary,
  getApplicationCurrentResidence,
  getApplicationEmployer,
  getApplicationJobTitle,
  getApplicationMonthlyIncome,
} from "@/lib/applicationDisplay";

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
    <p className="text-[11px] font-medium uppercase tracking-wide text-[#667085]">
      {label}
    </p>
    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{value}</p>
  </div>
);

const formatDisplayDate = (value?: string) => {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return format(date, "dd MMM yyyy");
};

const TenantScreen = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { id }: any = useParams();

  const handleBack = () => {
    if (pathname?.includes("/landlord/tenants/")) {
      router.push("/dashboard/landlord/tenants");
    } else {
      router.push("/dashboard/landlord/properties/renters");
    }
  };
  // Keep application in local state — property slice `data` is shared with
  // metrics/count thunks and gets overwritten, which broke status updates.
  const applicationFromStore = useSelector(
    (state: any) => state?.property?.data?.data,
  );
  const [application, setApplication] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openAssignDateModal, setOpenAssignDateModal] = useState(false);
  const [openUploadAgreementDocsModal, setOpenUploadAgreementDocsModal] =
    useState(false);

  const [openEndTenancyModal, setOpenEndTenancyModal] = useState(false);
  const [viewDocs, setViewDocs] = useState<boolean>(false);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [tenantDetails, setTenantDetails] = useState<any>({});
  const [viewerVisible, setViewerVisible] = useState<boolean>(true);
  const [isVisible, setIsVisible] = useState(false);
  const [pdf, setPdf] = useState<any>(null);
  const [openExtendLeaseModal, setOpenExtendLeaseModal] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    null | "Accepted" | "Rejected"
  >(null);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [postAcceptPrompt, setPostAcceptPrompt] = useState(false);

  const statusStyles: Record<ApplicationStatus, { bg: string; text: string }> =
    {
      [ApplicationStatus.NEW]: { bg: "bg-[#FFF4E5]", text: "text-[#D97706]" },
      [ApplicationStatus.ACCEPTED]: {
        bg: "bg-[#E5F6FD]",
        text: "text-[#0369A1]",
      },
      [ApplicationStatus.ACTIVE_LEASE]: {
        bg: "bg-[#E9F4E7]",
        text: "text-[#099137]",
      },
      [ApplicationStatus.EXPIRED]: {
        bg: "bg-[#FEE2E2]",
        text: "text-[#B91C1C]",
      },
      [ApplicationStatus.ENDED]: { bg: "bg-[#F3F4F6]", text: "text-[#4B5563]" },
      [ApplicationStatus.REJECTED]: {
        bg: "bg-[#FEE2E2]",
        text: "text-[#B91C1C]",
      },
    };

  const status = application?.status as ApplicationStatus;
  const style = statusStyles[status];

  const refreshApplication = async () => {
    if (!id || id === "undefined") {
      return null;
    }
    const result = await dispatch(getApplicationsById({ id } as any) as any);
    const payload = result?.payload;
    const next =
      payload?.data && payload?.data?._id
        ? payload.data
        : payload?._id
          ? payload
          : null;
    if (next) {
      setApplication(next);
    }
    return next;
  };

  const endTenancy: AddTenantFunction = async (
    values,
    { resetForm, setSubmitting },
  ) => {
    try {
      await dispatch(
        endTenancyTenure({
          id: id || values?.id,
          reason: values?.reason,
          comment: values?.comment,
        }) as any,
      ).unwrap();
      setApplication((prev: any) =>
        prev
          ? {
              ...prev,
              status: ApplicationStatus.ENDED,
              rentEndDate: new Date().toISOString(),
              endTenancyReason: values?.reason,
              endTenancyComment: values?.comment,
            }
          : prev,
      );
      toast.success("Lease ended successfully. It’s now under Past Leases.");
      resetForm();
      await refreshApplication();
    } catch (err: any) {
      const message =
        err?.message ||
        err?.payload ||
        (typeof err === "string" ? err : "Failed to end lease. Please try again.");
      toast.error(message);
    } finally {
      setSubmitting(false);
      setOpenEndTenancyModal(false);
      await refreshApplication();
    }
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
    return formatLeaseCalendarDate(dateString) || "Not set";
  };

  const extendTenancy: AddTenantFunction = async (
    values,
    { resetForm, setSubmitting },
    dispatch
  ) => {
    try {
      await dispatch(extendTenancyTenure({ ...values, id: id || values?.id }) as any).unwrap();
      toast.success("Lease extended successfully.");
      resetForm();
    } catch (err: any) {
      const message =
        err?.message ||
        err?.payload ||
        (typeof err === "string" ? err : "Failed to extend lease. Please try again.");
      toast.error(message);
    } finally {
      setSubmitting(false);
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

  type AddTenantFunction = (
    values: any,
    formikHelpers: Pick<FormikHelpers<any>, "resetForm" | "setSubmitting">,
    dispatch: ThunkDispatch<any, any, AnyAction>
  ) => Promise<void>;

  const assignDateToTenancy: AddTenantFunction = async (
    values,
    { resetForm, setSubmitting },
  ) => {
    const applicationId = String(values?.id || id || "");
    if (!applicationId || applicationId === "undefined") {
      toast.error("Missing application id. Please refresh and try again.");
      setSubmitting(false);
      return;
    }

    const toIso = (value: unknown) => toLeaseCalendarDateIso(value);

    try {
      const result = (await dispatch(
        assignDateTenancyTenure({
          id: applicationId,
          rentStartDate: toIso(values.rentStartDate),
          rentEndDate: toIso(values.rentEndDate),
        } as any) as any,
      )) as any;

      if (result.error) {
        if (result.error.message === "Rejected") {
          toast.error(
            result.payload || "Failed to activate lease. Please try again.",
          );
        } else {
          toast.error("Failed to activate lease. Please try again.");
        }
        return;
      }

      const rentStartDate = toIso(values.rentStartDate);
      const rentEndDate = toIso(values.rentEndDate);
      const updatedFromApi =
        result.payload && typeof result.payload === "object"
          ? result.payload
          : null;

      // Optimistic UI update — keep populated applicant/property fields intact.
      setApplication((prev: any) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          status:
            updatedFromApi?.status || ApplicationStatus.ACTIVE_LEASE,
          rentStartDate: updatedFromApi?.rentStartDate || rentStartDate,
          rentEndDate: updatedFromApi?.rentEndDate || rentEndDate,
          updatedAt: new Date().toISOString(),
        };
      });

      toast.success("Active lease activated");
      resetForm();
      setOpenAssignDateModal(false);
      setPostAcceptPrompt(false);
      await refreshApplication();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "An unexpected error occurred.",
      );
    } finally {
      setSubmitting(false);
      setOpenAssignDateModal(false);
    }
  };

  const buildVerificationContext = (): VerificationRequestContext => {
    const applicant = application?.applicant;
    const room = application?.propertyId;
    const listing = room?.propertyId;
    const applicationId = application?._id ? String(application._id) : "";
    const roomId = room?._id ? String(room._id) : "";
    const propertyId = listing?._id
      ? String(listing._id)
      : typeof listing === "string"
        ? listing
        : "";
    const unitPart =
      room?.roomId != null ? `Unit #${room.roomId}` : room?.description || "Unit";
    const addressPart = [listing?.streetAddress, listing?.city, listing?.state]
      .filter(Boolean)
      .join(", ");
    const propertyLabel = [unitPart, addressPart].filter(Boolean).join(" · ");

    let landlordDisplayName = "";
    try {
      const stored = localStorage.getItem("nrv-user");
      if (stored) {
        const user = JSON.parse(stored)?.user;
        landlordDisplayName =
          `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
      }
    } catch {
      // ignore malformed local storage
    }

    return {
      firstName: applicant?.firstName,
      lastName: applicant?.lastName,
      email: applicant?.email,
      landlordDisplayName,
      applicationId: applicationId || undefined,
      roomId: roomId || undefined,
      propertyId: propertyId || undefined,
      propertyLabel: propertyLabel || undefined,
    };
  };

  const handleApplicationStatus = async (nextStatus: "Accepted" | "Rejected") => {
    const applicationId = String(id || application?._id || "");
    if (!applicationId || applicationId === "undefined") {
      toast.error("Missing application id. Please refresh and try again.");
      return;
    }

    const payload = {
      id: applicationId,
      status: nextStatus,
    };
    try {
      setStatusActionLoading(true);
      setIsLoading(true);
      await dispatch(updateApplicationStatus(payload) as any).unwrap();
      setApplication((prev: any) =>
        prev ? { ...prev, status: nextStatus } : prev,
      );
      setConfirmAction(null);
      if (nextStatus === "Accepted") {
        toast.success("Application accepted");
        setPostAcceptPrompt(true);
      } else {
        toast.success("Application declined");
      }
      await refreshApplication();
    } catch (error: any) {
      const message =
        typeof error === "string"
          ? error
          : error?.message || "Could not update application status.";
      toast.error(message);
      await refreshApplication();
    } finally {
      setStatusActionLoading(false);
      setIsLoading(false);
    }
  };

  const handleVerifyTenant = () => {
    setVerifyModalOpen(true);
  };

  useEffect(() => {
    if (!id || id === "undefined") {
      router.replace("/dashboard/landlord/properties/renters");
      return;
    }
    setApplication(null);
    void refreshApplication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dispatch, router]);

  useEffect(() => {
    // Only hydrate from Redux when we don't already have this application locally.
    // Avoids stale shared-slice data overwriting an optimistic status update.
    if (application) {
      return;
    }
    if (
      applicationFromStore?._id &&
      String(applicationFromStore._id) === String(id) &&
      applicationFromStore?.status
    ) {
      setApplication(applicationFromStore);
    }
  }, [applicationFromStore, id, application]);

  if (!id || id === "undefined") {
    return null;
  }

  if (!application) return <div className="p-4">Loading lease details...</div>;

  const room = application?.propertyId;
  const listing = room?.propertyId;
  const applicant = application?.applicant;
  const tenantInitials =
    `${applicant?.firstName?.[0] ?? ""}${applicant?.lastName?.[0] ?? ""}`.toUpperCase() ||
    "?";
  const isLeaseActive =
    application?.status === "Active_lease" ||
    application?.status === ApplicationStatus.ACTIVE_LEASE;
  const isLeaseExpired =
    application?.status === "Expired" ||
    application?.status === ApplicationStatus.EXPIRED;
  const isLeaseEnded =
    application?.status === "Ended" ||
    application?.status === ApplicationStatus.ENDED ||
    isLeaseExpired;
  const leaseEndReached = (() => {
    if (!application?.rentEndDate) {
      return false;
    }
    const end = new Date(application.rentEndDate);
    if (Number.isNaN(end.getTime())) {
      return false;
    }
    const today = startOfToday();
    return end.getTime() < today.getTime();
  })();
  const showLeaseActionPrompt =
    (isLeaseActive && leaseEndReached) || isLeaseExpired;
  const isAccepted = application?.status === "Accepted";
  const isRejected = application?.status === "Rejected";
  const canReviewApplication =
    !isAccepted && !isLeaseActive && !isLeaseEnded && !isRejected;
  const canRequestVerification = !isRejected;
  const monthlyIncome = getApplicationMonthlyIncome(application);
  const statusLabel =
    status === ApplicationStatus.ACTIVE_LEASE
      ? "Active Lease"
      : status === ApplicationStatus.EXPIRED || application?.status === "Expired"
        ? "Expired Lease"
        : status === ApplicationStatus.ENDED || application?.status === "Ended"
          ? "Ended Lease"
          : status;

  return (
    <div className="mx-4 sm:mx-5 my-4 max-w-6xl">
      <div className="flex items-center gap-3 text-sm mb-5">
        <button
          type="button"
          className="text-nrvGreyBlack"
          onClick={handleBack}
          aria-label="Go back"
        >
          <BackIcon />
        </button>
        <span className="text-nrvGreyBlack font-medium">Tenant Profile</span>
      </div>

      <div className="flex flex-col gap-5">
        {/* Property summary */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row">
            <div className="relative h-48 w-full shrink-0 sm:h-auto sm:w-56">
              {listing?.file ? (
                <Image
                  fill
                  src={listing.file}
                  alt="property"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                  <Building2 className="h-10 w-10 text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between gap-4 p-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`${style?.bg} ${style?.text} rounded-full px-3 py-1 text-xs font-medium`}
                  >
                    {statusLabel}
                  </span>
                  {room?.roomId != null && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      Unit #{room.roomId}
                    </span>
                  )}
                </div>
                <h1 className="mt-3 text-lg font-semibold text-gray-900 sm:text-xl">
                  {room?.description || "Property unit"}
                </h1>
                <p className="mt-1 flex items-start gap-1.5 text-sm text-[#101928]">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  {[listing?.streetAddress, listing?.city, listing?.state]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-[#475467]">
                  <Calendar className="h-4 w-4" />
                  Applied {formatDisplayDate(application?.createdAt)}
                </div>
                {application?.updatedAt && (
                  <div className="flex items-center gap-1.5 text-[#475467]">
                    <CheckCircle2 className="h-4 w-4" />
                    Updated {formatDisplayDate(application?.updatedAt)}
                  </div>
                )}
                {room?.rentAmount != null && (
                  <div className="font-semibold text-nrvPrimaryGreen">
                    ₦{Number(room.rentAmount).toLocaleString()}/yr
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tenant + application */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-1">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#E9F4E7] text-lg font-bold text-[#03442C]">
                {tenantInitials}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-[#03442C]">
                  {applicant?.firstName} {applicant?.lastName}
                </h2>
                <div className="mt-2 space-y-1.5 text-sm text-gray-600">
                  <p className="flex items-center gap-2 break-all">
                    <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                    {applicant?.email || "—"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                    {applicant?.phoneNumber || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-gray-100 pt-5">
              {canReviewApplication && (
                <div className="rounded-xl border border-[#03442C]/15 bg-[#03442C]/[0.04] px-3 py-2.5 text-xs leading-relaxed text-gray-700">
                  <p className="font-semibold text-[#03442C]">Recommended next steps</p>
                  <ol className="mt-1.5 list-decimal space-y-0.5 pl-4">
                    <li>Request verification to screen this applicant</li>
                    <li>Accept or decline the application</li>
                  </ol>
                </div>
              )}
              {isAccepted && (
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs leading-relaxed text-sky-900">
                  <p className="font-semibold">Application accepted</p>
                  <p className="mt-1">
                    Set a lease period to activate tenancy. You can still request
                    verification if you haven&apos;t screened them yet.
                  </p>
                </div>
              )}
              {isRejected && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-relaxed text-red-800">
                  This application was declined. Verification is no longer available
                  for this lead.
                </div>
              )}

              {canRequestVerification && canReviewApplication && (
                <Button
                  className="w-full bg-[#03442C] text-white hover:bg-[#023522]"
                  disabled={isLoading || statusActionLoading}
                  onClick={handleVerifyTenant}
                  aria-label="Request verification for this applicant"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" aria-hidden />
                  Request verification
                </Button>
              )}

              {canReviewApplication && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="bg-[#03442C] text-white hover:bg-[#023522]"
                    disabled={isLoading || statusActionLoading}
                    onClick={() => setConfirmAction("Accepted")}
                    aria-label="Accept this application"
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" aria-hidden />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-300 bg-white text-red-600 hover:bg-red-50"
                    disabled={isLoading || statusActionLoading}
                    onClick={() => setConfirmAction("Rejected")}
                    aria-label="Decline this application"
                  >
                    <XCircle className="mr-1.5 h-4 w-4" aria-hidden />
                    Decline
                  </Button>
                </div>
              )}

              {isAccepted && (
                <>
                  <Button
                    className="w-full bg-[#03442C] text-white hover:bg-[#023522]"
                    disabled={isLoading || statusActionLoading}
                    onClick={() => {
                      setPostAcceptPrompt(false);
                      setOpenAssignDateModal(true);
                    }}
                    aria-label="Set lease period for this applicant"
                  >
                    <Calendar className="mr-2 h-4 w-4" aria-hidden />
                    Set lease period
                  </Button>
                  {canRequestVerification && (
                    <Button
                      variant="outline"
                      className="w-full border-[#03442C]/30 text-[#03442C] hover:bg-[#E9F4E7]"
                      disabled={isLoading || statusActionLoading}
                      onClick={handleVerifyTenant}
                      aria-label="Request verification for this applicant"
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" aria-hidden />
                      Request verification
                    </Button>
                  )}
                </>
              )}

              {canRequestVerification &&
                !canReviewApplication &&
                !isAccepted &&
                !isRejected && (
                  <Button
                    className="w-full bg-[#03442C] text-white hover:bg-[#023522]"
                    disabled={isLoading || statusActionLoading}
                    onClick={handleVerifyTenant}
                    aria-label="Request verification for this applicant"
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" aria-hidden />
                    Request verification
                  </Button>
                )}
              {showLeaseActionPrompt && (
                <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm font-semibold text-amber-950">
                    This lease has reached its end date
                  </p>
                  <p className="text-xs leading-5 text-amber-900/90">
                    Renew the lease with a new end date, or end tenancy and leave
                    a comment about the tenant.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      className="w-full bg-[#03442C] text-white hover:bg-[#023522]"
                      onClick={() => setOpenExtendLeaseModal(true)}
                      aria-label="Renew or extend this lease"
                    >
                      Renew / extend lease
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-amber-300 text-amber-950 hover:bg-amber-100"
                      onClick={() => setOpenEndTenancyModal(true)}
                      aria-label="End tenancy and leave a comment"
                    >
                      End tenancy & comment
                    </Button>
                  </div>
                </div>
              )}
              {isLeaseActive && !showLeaseActionPrompt && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setOpenExtendLeaseModal(true)}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-3 text-left text-sm transition hover:bg-gray-50"
                  >
                    <span className="font-medium text-nrvGreyBlack">
                      Renew / extend lease
                    </span>
                    <span className="text-nrvPrimaryGreen">Click here</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenEndTenancyModal(true)}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-3 text-left text-sm transition hover:bg-gray-50"
                  >
                    <span className="font-medium text-nrvGreyBlack">
                      End tenancy lease
                    </span>
                    <span className="text-nrvPrimaryGreen">Click here</span>
                  </button>
                </div>
              )}
              {isLeaseEnded && !showLeaseActionPrompt && (
                <div className="space-y-2">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                    <p>
                      This lease ended
                      {application?.rentEndDate
                        ? ` on ${formatDisplayDate(application.rentEndDate)}`
                        : "."}
                    </p>
                    {formatEndTenancySummary(application) && (
                      <p className="mt-2 text-xs text-gray-600">
                        <span className="font-semibold text-gray-800">Reason: </span>
                        {formatEndTenancySummary(application)}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-[#03442C]/30 text-[#03442C] hover:bg-[#E9F4E7]"
                    onClick={() =>
                      router.push("/dashboard/landlord/tenants?tab=ended")
                    }
                    aria-label="View past leases"
                  >
                    View in Past Leases
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <Briefcase className="h-5 w-5 text-nrvPrimaryGreen" />
                Employment & Income
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailItem
                  label="Job Title"
                  value={getApplicationJobTitle(application) || "—"}
                />
                <DetailItem
                  label="Employer"
                  value={getApplicationEmployer(application) || "—"}
                />
                <DetailItem
                  label="Monthly Income"
                  value={
                    monthlyIncome != null
                      ? `₦${Number(monthlyIncome).toLocaleString()}`
                      : "—"
                  }
                />
                <DetailItem
                  label="Current Residence"
                  value={getApplicationCurrentResidence(application) || "—"}
                />
              </div>
              {application?.reasonForLiving && (
                <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#667085]">
                    Reason for Moving
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {application.reasonForLiving}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <Building2 className="h-5 w-5 text-nrvPrimaryGreen" />
                Unit Details
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <DetailItem
                  label="Apartment Type"
                  value={
                    room?.apartmentType ||
                    room?.apartmentStyle ||
                    room?.name ||
                    "—"
                  }
                />
                <DetailItem
                  label="Style"
                  value={room?.apartmentStyle || "—"}
                />
                <DetailItem
                  label="Bedrooms"
                  value={
                    room?.noOfRooms != null ? (
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="h-4 w-4" />
                        {room.noOfRooms}
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />
                <DetailItem
                  label="Bathrooms"
                  value={
                    room?.noOfBaths != null ? (
                      <span className="inline-flex items-center gap-1">
                        <Bath className="h-4 w-4" />
                        {room.noOfBaths}
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />
                <DetailItem
                  label="Lease Terms"
                  value={room?.leaseTerms || "—"}
                />
                <DetailItem
                  label="Payment Option"
                  value={room?.paymentOption || "—"}
                />
              </div>
              {normalizeAmenities(room?.otherAmentities).length > 0 && (
                <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#667085]">
                    Amenities
                  </p>
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-gray-900">
                    {normalizeAmenities(room?.otherAmentities).map(
                      (amenity, i) => (
                        <li key={`${amenity}-${i}`}>{amenity}</li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <Home className="h-5 w-5 text-nrvPrimaryGreen" />
                Lease Period
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Lease Start Date
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {application?.rentStartDate
                      ? formatDateToWords(application.rentStartDate)
                      : "Not set"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Lease End Date
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {application?.rentEndDate
                      ? formatDateToWords(application.rentEndDate)
                      : "Not set"}
                  </p>
                </div>
                {isLeaseEnded && formatEndTenancySummary(application) && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                      Reason tenancy ended
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {formatEndTenancySummary(application)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <VerificationRequestModal
        open={verifyModalOpen}
        onOpenChange={setVerifyModalOpen}
        context={buildVerificationContext()}
      />

      <Dialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open && !statusActionLoading) {
            setConfirmAction(null);
          }
        }}
      >
        <DialogContent className="max-w-md bg-white sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#03442C]">
              {confirmAction === "Accepted"
                ? "Accept this application?"
                : "Decline this application?"}
            </DialogTitle>
            <DialogDescription className="text-left text-sm text-gray-600">
              {confirmAction === "Accepted" ? (
                <>
                  You&apos;re accepting{" "}
                  <strong>
                    {applicant?.firstName} {applicant?.lastName}
                  </strong>
                  . After accepting, you can set the lease period to activate
                  tenancy.
                </>
              ) : (
                <>
                  This will mark the application from{" "}
                  <strong>
                    {applicant?.firstName} {applicant?.lastName}
                  </strong>{" "}
                  as declined. This action can&apos;t be undone from here.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              disabled={statusActionLoading}
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={statusActionLoading || !confirmAction}
              onClick={() => {
                if (confirmAction) {
                  handleApplicationStatus(confirmAction);
                }
              }}
              className={
                confirmAction === "Rejected"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-[#03442C] text-white hover:bg-[#023522]"
              }
            >
              {statusActionLoading
                ? "Updating…"
                : confirmAction === "Accepted"
                  ? "Yes, accept"
                  : "Yes, decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={postAcceptPrompt}
        onOpenChange={(open) => {
          if (!open) {
            setPostAcceptPrompt(false);
          }
        }}
      >
        <DialogContent className="max-w-md bg-white sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#03442C]">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
              Application accepted
            </DialogTitle>
            <DialogDescription className="text-left text-sm text-gray-600">
              Next, set a lease start and end date to activate this tenancy. You
              can also request verification anytime from this profile.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button
              type="button"
              className="w-full bg-[#03442C] text-white hover:bg-[#023522]"
              onClick={() => {
                setPostAcceptPrompt(false);
                setOpenAssignDateModal(true);
              }}
            >
              Set lease period
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full border-[#03442C]/30 text-[#03442C]"
              onClick={() => {
                setPostAcceptPrompt(false);
                setVerifyModalOpen(true);
              }}
            >
              <ShieldCheck className="mr-2 h-4 w-4" aria-hidden />
              Request verification first
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-gray-600"
              onClick={() => setPostAcceptPrompt(false)}
            >
              Do this later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              id: application?._id || id,
              rentStartDate: null,
              rentEndDate: null,
            }}
            enableReinitialize
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
        onClose={() => setOpenEndTenancyModal(false)}
        recordId={id}
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
        isOpen={openExtendLeaseModal}
        onClose={() => setOpenExtendLeaseModal(false)}
      >
        <div className="mx-auto h-full w-full p-3 sm:p-8 md:p-16">
          <h2 className="text-2xl font-semibold text-nrvPrimaryGreen">
            Renew / extend lease
          </h2>
          <p className="mb-4 mt-4 text-sm text-nrvLightGrey">
            Choose a new lease end date. The current end date is{" "}
            {application?.rentEndDate
              ? formatDateToWords(application.rentEndDate)
              : "not set"}
            .
          </p>

          <Formik
            initialValues={{
              id: application?._id || id,
              rentEndDate: null as Date | null,
            }}
            enableReinitialize
            validate={(values) => {
              const errors: { rentEndDate?: string } = {};
              if (!values.rentEndDate) {
                errors.rentEndDate = "New lease end date is required.";
                return errors;
              }
              const nextEnd = new Date(values.rentEndDate);
              const currentEnd = application?.rentEndDate
                ? new Date(application.rentEndDate)
                : null;
              if (currentEnd && !Number.isNaN(currentEnd.getTime())) {
                if (nextEnd.getTime() <= currentEnd.getTime()) {
                  errors.rentEndDate =
                    "New end date must be later than the current lease end date.";
                }
              } else if (nextEnd.getTime() <= startOfToday().getTime()) {
                errors.rentEndDate = "New end date must be in the future.";
              }
              return errors;
            }}
            onSubmit={async (values, formikHelpers) => {
              try {
                await dispatch(
                  extendTenancyTenure({
                    id: String(values.id || id),
                    rentEndDate: toLeaseCalendarDateIso(values.rentEndDate),
                  } as any) as any,
                ).unwrap();
                toast.success("Lease extended successfully.");
                formikHelpers.resetForm();
                setOpenExtendLeaseModal(false);
                await refreshApplication();
              } catch (err: any) {
                toast.error(
                  err?.message ||
                    err ||
                    "Failed to extend lease. Please try again.",
                );
              } finally {
                formikHelpers.setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, resetForm, values, errors, setFieldValue }) => (
              <Form>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Label>New lease end date</Label>
                  <div className="mt-2 h-11 w-full rounded-sm border border-[#E0E0E6] px-2">
                    <DatePicker
                      value={values.rentEndDate}
                      onChange={(newValue) =>
                        setFieldValue("rentEndDate", newValue)
                      }
                      minDate={
                        application?.rentEndDate
                          ? new Date(
                              new Date(application.rentEndDate).getTime() +
                                24 * 60 * 60 * 1000,
                            )
                          : startOfToday()
                      }
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
                      }}
                    />
                  </div>
                  {errors.rentEndDate && (
                    <p className="mt-1 text-xs text-red-600">
                      {String(errors.rentEndDate)}
                    </p>
                  )}
                </LocalizationProvider>

                <div className="mt-8 flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="block w-full"
                    onClick={() => {
                      resetForm();
                      setOpenExtendLeaseModal(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="block w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving…" : "Save new end date"}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </Modal>

    </div>
  );
};

export default TenantScreen;
