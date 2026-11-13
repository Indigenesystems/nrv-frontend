"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  createShortStayBooking,
  fetchShortStayAvailability,
  fetchShortStayRoom,
} from "@/lib/shortletApi";
import { getRoomCoverImage } from "@/lib/propertyImages";
import {
  shortStayAddress,
  shortStayGallery,
  shortStayHeadline,
  shortStayTitle,
} from "@/lib/shortStay";
import { normalizeAmenities } from "@/helpers/utils";
import { getStoredSession } from "@/lib/authSession";

const SAMPLE_NIGHTS = 7;

const toIso = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromIso = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const nightsBetween = (checkIn: string, checkOut: string) => {
  if (!checkIn || !checkOut) return 0;
  const start = fromIso(checkIn).getTime();
  const end = fromIso(checkOut).getTime();
  return Math.round((end - start) / (24 * 60 * 60 * 1000));
};

const formatLong = (value: string) =>
  fromIso(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const AMENITY_ICONS: Record<string, string> = {
  "parking space": "🚗",
  "wi-fi/internet": "📶",
  wifi: "📶",
  "gym/fitness centre": "🏋️",
  "outdoor living area": "🌿",
  security: "🔒",
  spa: "🧖",
  "power backup": "🔋",
  "swimming pool": "🏊",
  "major appliances": "🧺",
  "smart technology": "📱",
  elevator: "🛗",
  kitchen: "🍴",
  tv: "📺",
  "air conditioning": "❄️",
  washer: "🫧",
  "dedicated workspace": "💻",
};

const amenityIcon = (label: string) =>
  AMENITY_ICONS[label.trim().toLowerCase()] || "•";

const amenityKey = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/wifi|wi fi|internet/g, "wifi")
    .replace(/parking.*/, "parking")
    .trim();

const inferAmenities = (room: any) => {
  const listed = normalizeAmenities(room?.otherAmentities);
  const text = `${room?.description || ""} ${listed.join(" ")}`.toLowerCase();
  const extras = [
    text.includes("kitchen") ? "Kitchen" : "",
    text.includes("workspace") || text.includes("work trip")
      ? "Dedicated workspace"
      : "",
    text.includes("tv") ? "TV" : "",
    text.includes(" ac") || text.includes("air") ? "Air conditioning" : "",
    text.includes("washing") || text.includes("washer") ? "Washer" : "",
  ].filter(Boolean);
  const merged: string[] = [];
  const seen = new Set<string>();
  for (const item of [...listed, ...extras]) {
    const key = amenityKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
};

const inferTags = (room: any) => {
  const tags = [room?.apartmentType, room?.apartmentStyle].filter(Boolean);
  const city = room?.city || room?.propertyId?.city;
  if (city) tags.push(city);
  return Array.from(new Set(tags.map((tag) => String(tag))));
};

const hostFromRoom = (room: any) => {
  const owner = room?.propertyId?.createdBy;
  if (!owner || typeof owner !== "object") {
    return { name: "Host", photo: "", place: "" };
  }
  const name = [owner.firstName, owner.lastName].filter(Boolean).join(" ") || "Host";
  return {
    name,
    photo: typeof owner.file === "string" ? owner.file : "",
    place: owner.homeAddress || room?.city || "",
  };
};

function MonthGrid({
  year,
  month,
  checkIn,
  checkOut,
  minDate,
  blocked,
  onPick,
}: {
  year: number;
  month: number;
  checkIn: string;
  checkOut: string;
  minDate: string;
  blocked: { start: string; end: string }[];
  onPick: (iso: string) => void;
}) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = first.getDay();
  const cells = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const inRange = (iso: string) =>
    checkIn && checkOut && iso >= checkIn && iso < checkOut;
  const isBlocked = (iso: string) =>
    iso < minDate ||
    blocked.some((span) => iso >= span.start && iso < span.end);

  return (
    <div>
      <p className="mb-3 text-center text-sm font-semibold text-[#222]">
        {first.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-7 text-center text-[11px] text-[#6A6A6A]">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 text-center text-[13px]">
        {cells.map((day, index) => {
          if (!day) return <span key={`e-${index}`} />;
          const iso = toIso(new Date(year, month, day));
          const selected = iso === checkIn || iso === checkOut;
          const ranged = inRange(iso);
          const disabled = isBlocked(iso);
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onPick(iso)}
              className={`mx-auto my-0.5 flex h-8 w-8 items-center justify-center rounded-full ${
                selected
                  ? "bg-[#222] text-white"
                  : ranged
                    ? "bg-[#F2F2F2]"
                    : "hover:bg-[#F2F2F2]"
              } ${disabled ? "text-[#D1D1D1]" : "text-[#222]"}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BookingCard({
  nightly,
  nights,
  total,
  checkIn,
  checkOut,
  guests,
  maxGuests,
  submitting,
  minimumNights,
  onCheckIn,
  onCheckOut,
  onGuests,
  guest,
  onGuest,
  onReserve,
}: {
  nightly: number;
  nights: number;
  total: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  maxGuests: number;
  submitting: boolean;
  minimumNights: number;
  onCheckIn: (value: string) => void;
  onCheckOut: (value: string) => void;
  onGuests: (value: number) => void;
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nin: string;
  };
  onGuest: (field: string, value: string) => void;
  onReserve: () => void;
}) {
  const displayNights = nights > 0 ? nights : SAMPLE_NIGHTS;
  const displayTotal = nights > 0 ? total : nightly * SAMPLE_NIGHTS;
  return (
    <div className="rounded-2xl border border-[#EBEBEB] bg-white p-5 shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
      <p className="text-[22px] font-semibold leading-7 text-[#222]">
        ₦{displayTotal.toLocaleString()}{" "}
        <span className="text-sm font-normal text-[#6A6A6A]">
          for {displayNights} nights
        </span>
      </p>
      <div className="mt-4 overflow-hidden rounded-xl border border-[#B0B0B0] text-[11px] uppercase tracking-wide text-[#6A6A6A]">
        <div className="grid grid-cols-2">
          <label className="border-r border-[#B0B0B0] px-3 py-2">
            Check-in
            <input
              type="date"
              value={checkIn}
              onChange={(event) => onCheckIn(event.target.value)}
              className="mt-1 block w-full bg-transparent text-[13px] font-medium normal-case tracking-normal text-[#222] outline-none"
            />
          </label>
          <label className="px-3 py-2">
            Checkout
            <input
              type="date"
              value={checkOut}
              onChange={(event) => onCheckOut(event.target.value)}
              className="mt-1 block w-full bg-transparent text-[13px] font-medium normal-case tracking-normal text-[#222] outline-none"
            />
          </label>
        </div>
        <label className="block border-t border-[#B0B0B0] px-3 py-2">
          Guests
          <select
            value={guests}
            onChange={(event) => onGuests(Number(event.target.value))}
            className="mt-1 block w-full bg-transparent text-[13px] font-medium normal-case tracking-normal text-[#222] outline-none"
          >
            {Array.from({ length: maxGuests }, (_, index) => index + 1).map(
              (count) => (
                <option key={count} value={count}>
                  {count} guest{count === 1 ? "" : "s"}
                </option>
              ),
            )}
          </select>
        </label>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2">
        <input
          value={guest.firstName}
          onChange={(event) => onGuest("firstName", event.target.value)}
          placeholder="First name"
          className="rounded-lg border border-[#B0B0B0] px-3 py-2 text-sm text-[#222] outline-none"
        />
        <input
          value={guest.lastName}
          onChange={(event) => onGuest("lastName", event.target.value)}
          placeholder="Last name"
          className="rounded-lg border border-[#B0B0B0] px-3 py-2 text-sm text-[#222] outline-none"
        />
        <input
          type="email"
          value={guest.email}
          onChange={(event) => onGuest("email", event.target.value)}
          placeholder="Email"
          className="rounded-lg border border-[#B0B0B0] px-3 py-2 text-sm text-[#222] outline-none"
        />
        <input
          value={guest.phone}
          onChange={(event) => onGuest("phone", event.target.value)}
          placeholder="Phone"
          className="rounded-lg border border-[#B0B0B0] px-3 py-2 text-sm text-[#222] outline-none"
        />
        <input
          value={guest.nin}
          onChange={(event) => onGuest("nin", event.target.value.replace(/\D/g, "").slice(0, 11))}
          placeholder="NIN (11 digits)"
          inputMode="numeric"
          className="rounded-lg border border-[#B0B0B0] px-3 py-2 text-sm text-[#222] outline-none"
        />
      </div>
      <button
        type="button"
        disabled={submitting || nights < minimumNights}
        onClick={onReserve}
        className="mt-4 w-full rounded-lg bg-[#03442C] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Sending request" : "Reserve"}
      </button>
      <p className="mt-3 text-center text-[12px] text-[#6A6A6A]">
        You will not be charged until the host confirms your identity.
      </p>
    </div>
  );
}

export default function ShortStayDetail({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [room, setRoom] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [blocked, setBlocked] = useState<{ start: string; end: string }[]>([]);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [guest, setGuest] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nin: "",
  });
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchShortStayRoom(roomId);
        setRoom(data);
        setPhotos(shortStayGallery(data));
        const minNights = Math.max(1, Number(data?.minimumNights) || 1);
        const start = new Date();
        const nights = Math.max(SAMPLE_NIGHTS, minNights);
        setCheckIn(toIso(start));
        setCheckOut(toIso(addDays(start, nights)));
        const availability = await fetchShortStayAvailability(roomId);
        const holds = Array.isArray(availability?.blocked)
          ? availability.blocked
          : [];
        setBlocked(
          holds.map((hold: any) => ({
            start: toIso(new Date(hold.checkIn)),
            end: toIso(new Date(hold.checkOut)),
          })),
        );
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Short stay not found.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [roomId]);

  useEffect(() => {
    const session = getStoredSession();
    const user = session?.user as
      | {
          firstName?: string;
          lastName?: string;
          email?: string;
          phoneNumber?: string;
          nin?: string;
        }
      | undefined;
    if (!user) {
      return;
    }
    setGuest((prev) => ({
      firstName: prev.firstName || String(user.firstName || ""),
      lastName: prev.lastName || String(user.lastName || ""),
      email: prev.email || String(user.email || ""),
      phone: prev.phone || String(user.phoneNumber || ""),
      nin: prev.nin || String(user.nin || "").replace(/\D/g, "").slice(0, 11),
    }));
  }, []);

  const nights = useMemo(
    () => nightsBetween(checkIn, checkOut),
    [checkIn, checkOut],
  );
  const nightly = Number(room?.pricePerNight || room?.rentAmount || 0);
  const total = nights > 0 ? nights * nightly : 0;
  const minimumNights = Math.max(1, Number(room?.minimumNights) || 1);
  const bedrooms = Math.max(1, Number(room?.noOfRooms) || 1);
  const baths = Number(room?.noOfBaths) || 1;
  const maxGuests = Math.max(2, bedrooms * 2);
  const amenities = inferAmenities(room);
  const tags = inferTags(room);
  const host = hostFromRoom(room);
  const place = shortStayAddress(room);
  const city = room?.city || room?.propertyId?.city || "Nigeria";
  const mapQuery = encodeURIComponent(
    [city, room?.state || room?.propertyId?.state, "Nigeria"]
      .filter(Boolean)
      .join(", "),
  );

  const pickDay = (iso: string) => {
    if (!checkIn || (checkIn && checkOut) || iso <= checkIn) {
      setCheckIn(iso);
      setCheckOut("");
      return;
    }
    setCheckOut(iso);
  };

  const handleRequest = async () => {
    if (nights < minimumNights) {
      toast.error(`This stay requires at least ${minimumNights} nights.`);
      return;
    }
    const nin = guest.nin.replace(/\D/g, "");
    if (
      !guest.firstName.trim() ||
      !guest.lastName.trim() ||
      !guest.email.trim() ||
      !guest.phone.trim() ||
      nin.length !== 11
    ) {
      toast.error("Enter your name, email, phone, and 11-digit NIN.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createShortStayBooking({
        roomId,
        checkIn,
        checkOut,
        firstName: guest.firstName.trim(),
        lastName: guest.lastName.trim(),
        guestEmail: guest.email.trim(),
        guestPhone: guest.phone.trim(),
        guestNin: nin,
      });
      toast.success(
        result?.message ||
          "Request sent. The host will run a guest identity check before payment.",
      );
      const session = getStoredSession();
      if (session?.accessToken) {
        router.push("/dashboard/tenant/short-stays");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Could not send this request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied.");
    } catch {
      toast.error("Could not copy this link.");
    }
  };

  if (loading) {
    return <p className="px-4 py-16 text-center text-gray-500">Loading stay.</p>;
  }
  if (!room) {
    return (
      <p className="px-4 py-16 text-center text-gray-500">
        This short stay is not available.
      </p>
    );
  }

  const cover = photos[0] || getRoomCoverImage(room);
  const mosaic = photos.length ? photos : [cover];
  const extraPhotos = Math.max(0, mosaic.length - 5);
  const bookingProps = {
    nightly,
    nights,
    total,
    checkIn,
    checkOut,
    guests,
    maxGuests,
    submitting,
    minimumNights,
    onCheckIn: setCheckIn,
    onCheckOut: setCheckOut,
    onGuests: setGuests,
    guest,
    onGuest: (field: string, value: string) =>
      setGuest((prev) => ({ ...prev, [field]: value })),
    onReserve: handleRequest,
  };

  return (
    <section className="bg-white pb-24 text-[#222]">
      <div className="sticky top-24 z-20 hidden border-b border-[#EBEBEB] bg-white/95 backdrop-blur md:block">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-6">
          <nav className="flex gap-6 text-[13px] text-[#6A6A6A]">
            {[
              ["photos", "Photos"],
              ["amenities", "Amenities"],
              ["reviews", "Reviews"],
              ["location", "Location"],
            ].map(([id, label]) => (
              <a key={id} href={`#${id}`} className="py-3 hover:text-[#222]">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[13px] font-semibold">
                ₦{nightly.toLocaleString()}{" "}
                <span className="font-normal text-[#6A6A6A]">night</span>
              </p>
              <p className="text-[11px] text-[#6A6A6A]">★ 0 · 0 reviews</p>
            </div>
            <button
              type="button"
              onClick={handleRequest}
              disabled={submitting || nights < minimumNights}
              className="rounded-lg bg-[#03442C] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Reserve
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1120px] px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h1 className="text-[26px] font-semibold leading-8">
            {shortStayHeadline(room)}
          </h1>
          <button
            type="button"
            onClick={copyLink}
            className="shrink-0 text-[13px] underline underline-offset-2"
          >
            Share
          </button>
        </div>

        <div id="photos" className="relative overflow-hidden rounded-2xl">
          {mosaic.length === 1 ? (
            <button type="button" onClick={() => setGalleryOpen(true)} className="block w-full">
              <img
                src={mosaic[0]}
                alt={shortStayHeadline(room)}
                onError={() => setPhotos((current) => current.filter((url) => url !== mosaic[0]))}
                className="h-[360px] w-full object-cover sm:h-[420px]"
              />
            </button>
          ) : mosaic.length === 2 ? (
            <div className="grid h-[360px] grid-cols-2 gap-2 sm:h-[420px]">
              {mosaic.slice(0, 2).map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => setGalleryOpen(true)}
                  className="overflow-hidden"
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <div className="grid h-[360px] grid-cols-4 grid-rows-2 gap-2 sm:h-[420px]">
              <button
                type="button"
                onClick={() => setGalleryOpen(true)}
                className="col-span-2 row-span-2 overflow-hidden"
              >
                <img src={mosaic[0]} alt="" className="h-full w-full object-cover" />
              </button>
              {(mosaic.length === 3
                ? [mosaic[1], mosaic[1], mosaic[2], mosaic[2]]
                : mosaic.slice(1, 5)
              ).map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => setGalleryOpen(true)}
                  className="overflow-hidden"
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {mosaic.length > 1 ? (
            <button
              type="button"
              onClick={() => setGalleryOpen(true)}
              className="absolute bottom-4 right-4 rounded-lg border border-[#222] bg-white px-3 py-1.5 text-[13px] font-medium"
            >
              Show all photos{extraPhotos ? ` (${mosaic.length})` : ""}
            </button>
          ) : null}
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <div className="border-b border-[#EBEBEB] pb-6">
              <h2 className="text-lg font-semibold">
                Entire {shortStayTitle(room)} in{" "}
                {room?.state || room?.propertyId?.state
                  ? city === (room?.state || room?.propertyId?.state)
                    ? city
                    : `${city}, ${room?.state || room?.propertyId?.state}`
                  : city}
              </h2>
              <p className="mt-1 text-sm text-[#6A6A6A]">
                {maxGuests} guests · {bedrooms}{" "}
                {bedrooms === 1 ? "bedroom" : "bedrooms"} · {bedrooms}{" "}
                {bedrooms === 1 ? "bed" : "beds"} · {baths}{" "}
                {baths === 1 ? "bath" : "baths"}
              </p>
              <p className="mt-2 text-sm text-[#6A6A6A]">★ No reviews yet</p>
            </div>

            <div className="border-b border-[#EBEBEB] py-6">
              <h3 className="text-lg font-semibold">About this place</h3>
              <p className="mt-3 text-sm leading-6 text-[#222]">
                {room.description || place || "A furnished short stay ready for your dates."}
              </p>
            </div>

            {tags.length ? (
              <div className="border-b border-[#EBEBEB] py-6">
                <h3 className="text-lg font-semibold">Tags</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#DDDDDD] px-3 py-1.5 text-[13px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div id="amenities" className="border-b border-[#EBEBEB] py-6">
              <h3 className="text-lg font-semibold">What this place offers</h3>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {amenities.slice(0, 8).map((item) => (
                  <p key={item} className="flex items-center gap-3 text-sm">
                    <span className="w-5 text-center">{amenityIcon(item)}</span>
                    {item}
                  </p>
                ))}
              </div>
              {amenities.length > 8 ? (
                <p className="mt-4 text-[13px] text-[#6A6A6A]">
                  Show all {amenities.length} amenities
                </p>
              ) : amenities.length ? (
                <p className="mt-4 text-[13px] text-[#6A6A6A]">
                  Show all {amenities.length} amenities
                </p>
              ) : (
                <p className="mt-3 text-sm text-[#6A6A6A]">
                  Amenities will appear when the owner adds them.
                </p>
              )}
            </div>

            <div className="border-b border-[#EBEBEB] py-6">
              <h3 className="text-lg font-semibold">
                {nights > 0 ? `${nights} nights` : `${SAMPLE_NIGHTS} nights`}
              </h3>
              <p className="mt-1 text-sm text-[#6A6A6A]">
                {checkIn && checkOut
                  ? `${formatLong(checkIn)} – ${formatLong(checkOut)}`
                  : "Select check-in and checkout dates"}
              </p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() =>
                    setMonthCursor(
                      new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1),
                    )
                  }
                  className="px-2 py-1"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setMonthCursor(
                      new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1),
                    )
                  }
                  className="px-2 py-1"
                >
                  ›
                </button>
              </div>
              <div className="mt-2 grid gap-8 sm:grid-cols-2">
                <MonthGrid
                  year={monthCursor.getFullYear()}
                  month={monthCursor.getMonth()}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  minDate={toIso(new Date())}
                  blocked={blocked}
                  onPick={pickDay}
                />
                <MonthGrid
                  year={
                    monthCursor.getMonth() === 11
                      ? monthCursor.getFullYear() + 1
                      : monthCursor.getFullYear()
                  }
                  month={(monthCursor.getMonth() + 1) % 12}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  minDate={toIso(new Date())}
                  blocked={blocked}
                  onPick={pickDay}
                />
              </div>
            </div>

            <div id="reviews" className="border-b border-[#EBEBEB] py-8">
              <h3 className="text-lg font-semibold">No reviews yet</h3>
              <p className="mt-2 text-sm text-[#6A6A6A]">
                Guests who stay here will be able to leave a review after checkout.
              </p>
            </div>

            <div className="border-b border-[#EBEBEB] py-8">
              <h3 className="text-lg font-semibold">Meet your Host</h3>
              <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex w-full max-w-[280px] flex-col items-center rounded-3xl px-8 py-8 text-center shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
                  {host.photo ? (
                    <img
                      src={host.photo}
                      alt={host.name}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#E7F2EA] text-2xl font-semibold text-[#03442C]">
                      {host.name.slice(0, 1)}
                    </div>
                  )}
                  <p className="mt-4 text-2xl font-semibold">{host.name}</p>
                  <p className="text-sm text-[#6A6A6A]">Host</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Host details</p>
                  <p className="mt-2 text-sm text-[#6A6A6A]">Response rate: 100%</p>
                  <p className="text-sm text-[#6A6A6A]">Responds within a day</p>
                  <p className="mt-4 text-sm text-[#6A6A6A]">
                    Speaks: English
                  </p>
                  <p className="text-sm text-[#6A6A6A]">
                    Lives in: {host.place || city}
                  </p>
                  <p className="mt-4 max-w-md text-[12px] leading-5 text-[#6A6A6A]">
                    To protect your payment, never transfer money or communicate
                    outside NaijaRentVerify.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-[#EBEBEB] py-8">
              <h3 className="text-lg font-semibold">Things to know</h3>
              <div className="mt-5 grid gap-8 text-sm sm:grid-cols-3">
                <div>
                  <p className="font-semibold">House rules</p>
                  <p className="mt-2 text-[#6A6A6A]">
                    Minimum stay {minimumNights}{" "}
                    {minimumNights === 1 ? "night" : "nights"}
                  </p>
                  <p className="mt-1 text-[#6A6A6A]">{maxGuests} guests maximum</p>
                  {room.houseRules ? (
                    <p className="mt-1 text-[#6A6A6A]">{room.houseRules}</p>
                  ) : null}
                </div>
                <div>
                  <p className="font-semibold">Health & safety</p>
                  <p className="mt-2 text-[#6A6A6A]">
                    Follow local safety guidance during your stay.
                  </p>
                  <p className="mt-1 text-[#6A6A6A]">
                    Carbon monoxide and smoke alarms are not confirmed.
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Cancellation policy</p>
                  <p className="mt-2 text-[#6A6A6A]">
                    You are not charged until the owner accepts this request.
                  </p>
                </div>
              </div>
            </div>

            <div id="location" className="py-8">
              <h3 className="text-lg font-semibold">Location</h3>
              <p className="mt-1 text-sm text-[#6A6A6A]">{place || city}</p>
              <div className="pointer-events-none mt-4 h-[280px] overflow-hidden rounded-2xl">
                <iframe
                  title="Stay location"
                  src={`https://www.google.com/maps?q=${mapQuery}&z=13&output=embed`}
                  className="h-full w-full border-0"
                  loading="lazy"
                  tabIndex={-1}
                />
              </div>
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-40">
              <BookingCard {...bookingProps} />
              <button
                type="button"
                onClick={() => toast.success("Thanks. Our team will review this listing.")}
                className="mt-4 w-full text-center text-[12px] text-[#6A6A6A] underline"
              >
                Report this listing
              </button>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#EBEBEB] bg-white px-4 py-3 lg:hidden">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              ₦{(nights > 0 ? total : nightly * SAMPLE_NIGHTS).toLocaleString()}{" "}
              <span className="font-normal text-[#6A6A6A]">
                for {nights > 0 ? nights : SAMPLE_NIGHTS} nights
              </span>
            </p>
          </div>
          <button
            type="button"
            disabled={submitting || nights < minimumNights}
            onClick={handleRequest}
            className="rounded-lg bg-[#03442C] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Reserve
          </button>
        </div>
      </div>

      {galleryOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
          <div className="mx-auto max-w-[900px] px-4 py-6">
            <button
              type="button"
              onClick={() => setGalleryOpen(false)}
              className="text-sm font-medium"
            >
              Close
            </button>
            <div className="mt-4 grid gap-3">
              {mosaic.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt={shortStayHeadline(room)}
                  className="w-full rounded-xl object-cover"
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
