"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import TenantLayout from "@/app/components/layout/TenantLayout";
import ProtectedRoute from "@/app/components/guard/TenantProtectedRoute";
import { useParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import {
  getMaintenanceById,
  markIssueAsResolved,
} from "@/redux/slices/maintenanceSlice";
import Image from "next/image";
import BackIcon from "@/app/components/shared/icons/BackIcon";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileImage,
  Loader2,
  MapPin,
  Phone,
  UserRound,
  Wrench,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusClasses: Record<string, string> = {
  New: "bg-blue-50 text-blue-700 ring-blue-600/20",
  Acknowledged: "bg-amber-50 text-amber-700 ring-amber-600/20",
  "In Progress": "bg-violet-50 text-violet-700 ring-violet-600/20",
  Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Declined: "bg-red-50 text-red-700 ring-red-600/20",
};

const priorityClasses: Record<string, string> = {
  Low: "bg-gray-100 text-gray-700",
  Medium: "bg-amber-50 text-amber-700",
  High: "bg-orange-50 text-orange-700",
  Emergency: "bg-red-50 text-red-700",
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatScheduledVisit = (dateValue?: string, timeValue?: string) => {
  if (!dateValue) {
    return "Schedule unavailable";
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "Schedule unavailable";
  }
  const formattedDate = new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  if (!timeValue) {
    return formattedDate;
  }
  const [hours, minutes] = timeValue.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return `${formattedDate} at ${timeValue}`;
  }
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${formattedDate} at ${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
};

const SingleMaintainance = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [maintenance, setMaintenance] = useState<any>(null);

  const fetchData = async () => {
    try {
      const response = await dispatch(
        getMaintenanceById({ id } as any) as any,
      );
      setMaintenance(response?.payload?.data ?? null);
    } catch {
      toast.error("Unable to load this maintenance request.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsResolving(true);
      await dispatch(
        markIssueAsResolved({ id, status: "Resolved" } as any) as any,
      ).unwrap();
      setMaintenance((current: any) =>
        current ? { ...current, status: "Resolved" } : current,
      );
      toast.success("Maintenance request marked as resolved.");
      setIsOpen(false);
      await fetchData();
    } catch (error: any) {
      toast.error(
        typeof error === "string"
          ? error
          : error?.message || "Could not resolve this request.",
      );
    } finally {
      setIsResolving(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const room = maintenance?.roomId;
  const listing = room?.propertyId;
  const apartmentName =
    room?.apartmentStyle || room?.apartmentType || room?.description || "Apartment";
  const apartmentAddress = [
    listing?.streetAddress,
    listing?.city,
    listing?.state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <ProtectedRoute>
      <TenantLayout>
        {isLoading ? (
          <div className="mx-auto max-w-5xl animate-pulse space-y-6 px-4 py-8 sm:px-6">
            <div className="h-7 w-64 rounded bg-gray-200" />
            <div className="h-48 rounded-2xl bg-gray-100" />
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="h-72 rounded-2xl bg-gray-100" />
              <div className="h-72 rounded-2xl bg-gray-100" />
            </div>
          </div>
        ) : !maintenance ? (
          <div className="mx-auto max-w-xl px-4 py-16 text-center">
            <Wrench className="mx-auto h-10 w-10 text-gray-300" />
            <h1 className="mt-4 text-lg font-semibold text-gray-900">
              Maintenance request not found
            </h1>
            <button
              type="button"
              onClick={() => router.back()}
              className="mt-5 text-sm font-semibold text-[#03442C]"
            >
              Go back
            </button>
          </div>
        ) : (
          <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="mt-1 rounded-md p-1 text-gray-600 transition hover:bg-gray-100"
                aria-label="Go back"
              >
                <BackIcon />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Maintenance request #{maintenance.maintenanceId ?? "—"}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                    {maintenance.title}
                  </h1>
                  <span
                    className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                      statusClasses[maintenance.status] ??
                      "bg-gray-50 text-gray-700 ring-gray-600/20"
                    }`}
                  >
                    {maintenance.status}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Logged {formatDateTime(maintenance.createdAt)}
                </p>
              </div>
              {maintenance.status !== "Resolved" && (
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className="hidden h-10 items-center gap-2 rounded-xl bg-[#03442C] px-4 text-sm font-semibold text-white transition hover:bg-[#023522] sm:inline-flex"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Mark resolved
                </button>
              )}
            </div>

            <section className="mt-7 rounded-2xl border border-[#03442C]/15 bg-[#F7FAF8] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E9F4E7] text-[#03442C]">
                  <Building2 className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Linked apartment
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-gray-900">
                      {apartmentName}
                    </h2>
                    {room?.roomId != null && (
                      <span className="whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#03442C] shadow-sm">
                        Unit {room.roomId}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 flex items-start gap-1.5 text-sm text-gray-600">
                    <MapPin
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {apartmentAddress || "Address unavailable"}
                  </p>
                </div>
                {room?._id && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/dashboard/tenant/properties/${room._id}`)
                    }
                    className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#03442C]/20 bg-white px-3 py-2 text-sm font-semibold text-[#03442C] transition hover:bg-[#E9F4E7] sm:w-auto"
                    aria-label={`View ${apartmentName}`}
                  >
                    View apartment
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </section>

            {maintenance.assignedTo && (
              <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
                    <Clock3 className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Vendor visit scheduled
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-gray-900">
                      {formatScheduledVisit(
                        maintenance.scheduledDate,
                        maintenance.scheduledTime,
                      )}
                    </h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm text-gray-700">
                        <UserRound
                          className="h-4 w-4 shrink-0 text-[#03442C]"
                          aria-hidden="true"
                        />
                        <span className="font-semibold">
                          {maintenance.assignedTo}
                        </span>
                      </div>
                      <a
                        href={`tel:${maintenance.assigneePhoneNumber}`}
                        className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#03442C]"
                        aria-label={`Call ${maintenance.assignedTo}`}
                      >
                        <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {maintenance.assigneePhoneNumber}
                      </a>
                    </div>
                    {maintenance.extraNoteToTenant && (
                      <div className="mt-3 rounded-xl border border-amber-100 bg-white/80 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Note from landlord
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                          {maintenance.extraNoteToTenant}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-gray-900">
                    Issue details
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      priorityClasses[maintenance.priority] ??
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {maintenance.priority || "Medium"} priority
                  </span>
                </div>
                <div className="mt-5 rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Description
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {maintenance.description}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-medium text-gray-500">Created</p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {formatDateTime(maintenance.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-medium text-gray-500">
                      Last updated
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {formatDateTime(maintenance.updatedAt)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                  <FileImage className="h-4 w-4 text-[#03442C]" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    Evidence photo
                  </h2>
                </div>
                {maintenance.file ? (
                  <a
                    href={maintenance.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block aspect-[4/3] w-full bg-gray-100"
                    aria-label="Open evidence image"
                  >
                    <Image
                      src={maintenance.file}
                      alt={`Evidence for ${maintenance.title}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 360px"
                    />
                  </a>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center text-sm text-gray-500">
                    No evidence photo attached
                  </div>
                )}
              </section>
            </div>

            {maintenance.statusHistory?.length > 0 && (
              <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-base font-semibold text-gray-900">
                  Request activity
                </h2>
                <ol className="mt-5 space-y-4">
                  {[...maintenance.statusHistory]
                    .reverse()
                    .map((entry: any, index: number) => (
                      <li
                        key={`${entry.status}-${entry.changedAt}-${index}`}
                        className="flex gap-3"
                      >
                        <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#03442C]" />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {entry.status}
                          </p>
                          {entry.note && (
                            <p className="mt-0.5 text-sm text-gray-600">
                              {entry.note}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            {formatDateTime(entry.changedAt)}
                          </p>
                        </div>
                      </li>
                    ))}
                </ol>
              </section>
            )}

            {maintenance.status !== "Resolved" && (
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#03442C] px-5 text-sm font-semibold text-white sm:hidden"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Mark issue as resolved
              </button>
            )}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogContent className="max-w-md sm:rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-[#03442C]">
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    Mark issue as resolved?
                  </DialogTitle>
                  <DialogDescription className="text-left text-sm text-gray-600">
                    Confirm that “{maintenance.title}” has been fixed. This will
                    close the maintenance request.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={isResolving}
                    className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={isResolving}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#03442C] px-4 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {isResolving && (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    )}
                    {isResolving ? "Updating…" : "Yes, mark resolved"}
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </main>
        )}
      </TenantLayout>
    </ProtectedRoute>
  );
};

export default SingleMaintainance;
