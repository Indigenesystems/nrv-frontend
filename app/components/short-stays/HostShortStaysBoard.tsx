"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/components/shared/buttons/Button";
import LoadingPage from "@/app/components/loaders/LoadingPage";
import { toast } from "react-toastify";
import {
  declineShortStayBooking,
  fetchMyShortStayBookings,
  fetchOwnerShortStayListings,
  runShortStayIdentityCheck,
} from "@/lib/shortletApi";
import { getRoomCoverImage } from "@/lib/propertyImages";
import { shortStayAddress, shortStayTitle } from "@/lib/shortStay";
import { formatDateToWords } from "@/helpers/utils";

const listingLabel = (room: any) => {
  if (room?.approved && room?.listRoom) {
    return { text: "Listed", className: "bg-[#E7F6EC] text-[#099137]" };
  }
  if (room?.approvalRequested) {
    return { text: "Awaiting approval", className: "bg-[#FFF4E6] text-[#B54708]" };
  }
  return { text: "Unlisted", className: "bg-gray-100 text-[#475467]" };
};

const bookingLabel = (status: string, identityStatus?: string) => {
  if (identityStatus === "failed") {
    return { text: "Check failed", className: "bg-red-50 text-red-700" };
  }
  const value = String(status || "").replace("_", " ");
  if (status === "confirmed") {
    return { text: "Confirmed", className: "bg-[#E7F6EC] text-[#099137]" };
  }
  if (status === "requested") {
    return { text: "Awaiting guest check", className: "bg-[#FFF4E6] text-[#B54708]" };
  }
  if (status === "pending_payment") {
    return { text: "Awaiting payment", className: "bg-[#E7F2EA] text-[#03442C]" };
  }
  if (status === "declined" || status === "expired" || status === "cancelled") {
    return { text: value, className: "bg-red-50 text-red-700" };
  }
  return { text: value || "Unknown", className: "bg-gray-100 text-[#475467]" };
};

const guestName = (booking: any) =>
  booking.guestName ||
  [booking.bookerId?.firstName, booking.bookerId?.lastName]
    .filter(Boolean)
    .join(" ") ||
  "Guest";

type BoardMode = "all" | "listings" | "bookings" | "checks";

export default function HostShortStaysBoard({
  createHref,
  canRunCheck,
  mode = "all",
}: {
  createHref: string;
  canRunCheck: boolean;
  mode?: BoardMode;
}) {
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const [ownerListings, ownerBookings] = await Promise.all([
        fetchOwnerShortStayListings(),
        fetchMyShortStayBookings("owner"),
      ]);
      setListings(Array.isArray(ownerListings) ? ownerListings : []);
      setBookings(Array.isArray(ownerBookings) ? ownerBookings : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not load short stays.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visibleBookings = useMemo(() => {
    if (mode === "checks") {
      return bookings.filter(
        (item) =>
          item.status === "requested" ||
          item.identityStatus === "pending" ||
          item.identityStatus === "failed",
      );
    }
    return bookings;
  }, [bookings, mode]);

  const stats = useMemo(() => {
    const listed = listings.filter((room) => room?.approved && room?.listRoom).length;
    const pending = listings.filter(
      (room) => room?.approvalRequested && !(room?.approved && room?.listRoom),
    ).length;
    const openRequests = bookings.filter((item) => item.status === "requested").length;
    return { listed, pending, openRequests, total: listings.length };
  }, [listings, bookings]);

  const handleCheck = async (id: string) => {
    try {
      setActingId(id);
      const result = await runShortStayIdentityCheck(id);
      toast.success(
        result?.message ||
          (result?.data?.identityStatus === "passed"
            ? "Guest check passed."
            : "Guest check did not pass."),
      );
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not run guest check.");
    } finally {
      setActingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      setActingId(id);
      await declineShortStayBooking(id);
      toast.success("Request declined.");
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not decline.");
    } finally {
      setActingId(null);
    }
  };

  const showListings = mode === "all" || mode === "listings";
  const showBookings = mode !== "listings";

  return (
    <div className="w-full min-w-0 max-w-full px-3 py-4 font-jakarta sm:p-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-semibold text-[#101828]">
            {mode === "checks"
              ? "Guest checks"
              : mode === "bookings"
                ? "Bookings"
                : "Short stays"}
          </h2>
          <p className="mt-2 text-sm font-light text-[#475467]">
            {canRunCheck
              ? "Run a NIN and phone check before a guest can pay. Failed checks stop payment."
              : "Landlords can list and decline short stay requests. Guest identity checks and shortlet credits are for shortlet managers."}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button
            variant="light"
            className="flex w-full items-center justify-center rounded-md px-6 py-2 sm:w-auto"
            onClick={() => void load()}
          >
            Refresh
          </Button>
          {showListings ? (
            <Button
              variant="darkPrimary"
              className="w-full rounded-md px-6 py-2 sm:w-auto"
              onClick={() => router.push(createHref)}
            >
              + Add Shortlet
            </Button>
          ) : null}
        </div>
      </div>

      {mode !== "bookings" && mode !== "checks" ? (
        <div className="mb-8 grid grid-cols-1 overflow-hidden rounded-lg border border-gray-300 text-center sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total shortlets", value: String(stats.total) },
            { label: "Awaiting approval", value: String(stats.pending) },
            { label: "Listed publicly", value: String(stats.listed) },
            { label: "Open requests", value: String(stats.openRequests) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="space-y-2.5 border-b bg-white p-4 text-start sm:border-b-0 sm:border-r last:border-0"
            >
              <p className="text-sm font-medium text-[#67667A]">{stat.label}</p>
              <p className="text-xl font-medium text-[#03442C]">{stat.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {loading ? (
        <LoadingPage />
      ) : (
        <>
          {showListings ? (
            <>
              <h3 className="mb-4 text-base font-semibold text-[#101828]">
                Your shortlets
              </h3>
              {listings.length === 0 ? (
                <div className="mb-10 flex h-48 flex-col items-center justify-center rounded-lg border border-[#F0F2F5] bg-white">
                  <p className="text-gray-500">No shortlets listed yet.</p>
                  <Button
                    variant="darkPrimary"
                    className="mt-4 rounded-md px-6 py-2"
                    onClick={() => router.push(createHref)}
                  >
                    + Add Shortlet
                  </Button>
                </div>
              ) : (
                <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
                  {listings.map((room) => {
                    const status = listingLabel(room);
                    return (
                      <div
                        key={room._id}
                        className="relative rounded-lg border border-[#F0F2F5] bg-white p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <img
                            src={getRoomCoverImage(room)}
                            alt={shortStayTitle(room)}
                            className="h-14 w-14 rounded-lg object-cover"
                          />
                          <span
                            className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${status.className}`}
                          >
                            {status.text}
                          </span>
                        </div>
                        <div className="mt-4">
                          <h3 className="text-sm font-semibold text-[#101828]">
                            {shortStayTitle(room)}
                          </h3>
                          <p className="mt-1 text-xs font-light text-gray-400">
                            {shortStayAddress(room) || "Nigeria"}
                          </p>
                          <div className="mt-4 flex items-center justify-between border-t pt-3">
                            <p className="text-sm font-medium text-[#03442C]">
                              ₦
                              {Number(
                                room.pricePerNight || room.rentAmount || 0,
                              ).toLocaleString()}
                              <span className="font-normal text-[#67667A]">
                                {" "}
                                / night
                              </span>
                            </p>
                            {room.createdAt ? (
                              <p className="text-xs text-gray-400">
                                Added {formatDateToWords(room.createdAt)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : null}

          {showBookings ? (
            <>
              <h3 className="mb-4 text-base font-semibold text-[#101828]">
                {mode === "checks" ? "Guests waiting for a check" : "Booking requests"}
              </h3>
              {visibleBookings.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-[#F0F2F5] bg-white">
                  <p className="text-gray-500">No booking requests yet.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-[#F0F2F5] bg-white">
                  {visibleBookings.map((booking, index) => {
                    const room = booking.roomId || {};
                    const status = bookingLabel(
                      booking.status,
                      booking.identityStatus,
                    );
                    return (
                      <div
                        key={booking._id}
                        className={`flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between ${
                          index !== visibleBookings.length - 1
                            ? "border-b border-[#F0F2F5]"
                            : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#101828]">
                            {shortStayTitle(room)}
                          </p>
                          <p className="mt-1 text-xs text-[#475467]">
                            {guestName(booking)}
                            {booking.guestPhone ? ` · ${booking.guestPhone}` : ""}
                            {booking.guestNinLast4
                              ? ` · NIN ****${booking.guestNinLast4}`
                              : ""}
                          </p>
                          <p className="mt-1 text-xs text-[#67667A]">
                            Identity: {booking.identityStatus || "pending"}
                            {booking.identitySummary
                              ? ` · ${booking.identitySummary}`
                              : ""}
                          </p>
                          <p className="mt-1 text-sm text-[#67667A]">
                            {new Date(booking.checkIn).toLocaleDateString("en-GB")}{" "}
                            →{" "}
                            {new Date(booking.checkOut).toLocaleDateString("en-GB")}{" "}
                            · {booking.nights} night
                            {Number(booking.nights) === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm font-medium text-[#03442C]">
                            ₦{Number(booking.amountNaira || 0).toLocaleString()}
                          </p>
                          <span
                            className={`rounded-full px-3 py-1.5 text-[10px] font-semibold capitalize ${status.className}`}
                          >
                            {status.text}
                          </span>
                          {booking.status === "requested" ? (
                            <div className="flex gap-2">
                              {canRunCheck ? (
                                <Button
                                  variant="darkPrimary"
                                  className="rounded-md px-4 py-1.5"
                                  disabled={actingId === booking._id}
                                  onClick={() => handleCheck(booking._id)}
                                >
                                  Run check
                                </Button>
                              ) : null}
                              <Button
                                variant="light"
                                className="rounded-md px-4 py-1.5"
                                disabled={actingId === booking._id}
                                onClick={() => handleDecline(booking._id)}
                              >
                                Decline
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
