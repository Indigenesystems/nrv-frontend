"use client";

import React, { useState, useEffect, useMemo } from "react";
import EmptyState from "../../../components/screens/empty-state/EmptyState";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { getRentedApartmentsForTenant } from "../../../../redux/slices/propertySlice";
import { apiClient } from "@/lib/api";
import UserAvatar from "@/app/components/shared/UserAvatar";
import ImageLightbox from "@/app/components/shared/ImageLightbox";
import { Search } from "lucide-react";

type ChatRow = {
  partnerId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  file?: string | null;
  lastMessage?: string;
  lastMessageAt?: string | Date | null;
};

const getOwnerId = (item: any): string | null => {
  const owner = item?.ownerId;
  if (!owner) {
    return null;
  }
  if (typeof owner === "string") {
    return owner;
  }
  return owner?._id ? String(owner._id) : null;
};

const getDisplayName = (row: ChatRow) => {
  const name = `${row.firstName || ""} ${row.lastName || ""}`.trim();
  return name || row.email || "Landlord";
};

const formatChatTime = (value?: string | Date | null) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return new Intl.DateTimeFormat("en-NG", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
  }).format(date);
};

const RentersListScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [page] = useState(1);
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const dispatch = useDispatch();
  const router = useRouter();

  const fetchCombinedData = async () => {
    const stored = JSON.parse(localStorage.getItem("nrv-user") as any);
    const tenantId = stored?.user?._id;
    if (!tenantId) {
      setChats([]);
      setIsLoading(false);
      return;
    }

    try {
      const [rentedResponse, partnersResponse] = await Promise.all([
        dispatch(
          getRentedApartmentsForTenant({
            id: tenantId,
            page,
          }) as any,
        ),
        apiClient.get(`/messages/partners/${tenantId}`).catch(() => null),
      ]);

      const rentedRows = rentedResponse?.payload?.data || [];
      const partnerRows = partnersResponse?.data?.data || [];
      const uniqueChats = new Map<string, ChatRow>();

      rentedRows.forEach((item: any) => {
        const partnerId = getOwnerId(item);
        if (!partnerId) {
          return;
        }
        const owner =
          typeof item?.ownerId === "object" && item?.ownerId
            ? item.ownerId
            : {};
        const existing = uniqueChats.get(partnerId);
        uniqueChats.set(partnerId, {
          partnerId,
          firstName: owner?.firstName || existing?.firstName,
          lastName: owner?.lastName || existing?.lastName,
          email: owner?.email || existing?.email,
          file: owner?.file || existing?.file || null,
          lastMessage: existing?.lastMessage,
          lastMessageAt: existing?.lastMessageAt,
        });
      });

      partnerRows.forEach((partner: any) => {
        const partnerId = String(partner?.partnerId || "");
        if (!partnerId) {
          return;
        }
        const user = partner?.partner || {};
        const existing = uniqueChats.get(partnerId);
        uniqueChats.set(partnerId, {
          partnerId,
          firstName: user?.firstName || existing?.firstName,
          lastName: user?.lastName || existing?.lastName,
          email: user?.email || existing?.email,
          file: user?.file || existing?.file || null,
          lastMessage: partner?.lastMessage || existing?.lastMessage,
          lastMessageAt: partner?.lastMessageAt || existing?.lastMessageAt,
        });
      });

      const sorted = Array.from(uniqueChats.values()).sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });

      setChats(sorted);
    } catch (error) {
      console.error("Error fetching tenant conversations:", error);
      setChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCombinedData();
  }, [page]);

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return chats;
    }
    return chats.filter((chat) => {
      const name = getDisplayName(chat).toLowerCase();
      const email = String(chat.email || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [chats, search]);

  return (
    <div className="-mx-2 -mt-3 mb-0 flex h-[calc(100dvh-3.75rem)] max-h-[calc(100dvh-3.75rem)] w-auto flex-col overflow-hidden bg-[#F0F2F5] sm:-mx-4 md:mx-auto md:mt-0 md:h-[calc(100dvh-6.5rem)] md:max-h-[calc(100dvh-6.5rem)] md:max-w-3xl md:rounded-2xl md:border md:border-gray-200 md:shadow-sm lg:h-[calc(100dvh-5.5rem)] lg:max-h-[calc(100dvh-5.5rem)]">
      <div className="shrink-0 border-b border-[#E9EDEF] bg-[#008069] px-4 py-3 text-white">
        <h1 className="text-lg font-semibold tracking-tight">Messages</h1>
        <p className="mt-0.5 text-xs text-white/80">
          Chat with your landlord
        </p>
      </div>

      <div className="shrink-0 border-b border-[#E9EDEF] bg-white px-3 py-2.5">
        <label className="relative block" htmlFor="tenant-messages-search">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#54656F]"
            aria-hidden
          />
          <input
            id="tenant-messages-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email"
            className="h-10 w-full rounded-lg bg-[#F0F2F5] py-2 pl-10 pr-3 text-sm text-[#111B21] outline-none placeholder:text-[#667781] focus:ring-2 focus:ring-[#008069]/25"
            aria-label="Search conversations"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white">
        {isLoading ? (
          <div className="divide-y divide-[#F0F2F5]">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-3">
                <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3.5 w-1/2 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length < 1 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
            <EmptyState />
            <p className="mt-2 text-sm font-medium text-[#111B21]">
              {search.trim()
                ? "No matching conversations"
                : "No conversations yet"}
            </p>
            <p className="mt-1 max-w-xs text-xs text-[#667781]">
              {search.trim()
                ? "Try another name or email."
                : "Start a chat from a rented apartment when available."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#F0F2F5]" role="list">
            {filteredChats.map((chat) => {
              const displayName = getDisplayName(chat);
              const preview =
                chat.lastMessage?.trim() || "Tap to start chatting";
              const timeLabel = formatChatTime(chat.lastMessageAt);

              return (
                <li key={chat.partnerId}>
                  <div className="flex w-full items-center gap-3 px-3 py-3 transition hover:bg-[#F5F6F6]">
                    <button
                      type="button"
                      className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-[#008069]/40"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (chat.file) {
                          setPreviewImage(String(chat.file));
                        } else {
                          router.push(
                            `/dashboard/tenant/messages/${chat.partnerId}`,
                          );
                        }
                      }}
                      aria-label={
                        chat.file
                          ? `View ${displayName}'s profile photo`
                          : `Open chat with ${displayName}`
                      }
                    >
                      <UserAvatar
                        src={chat.file}
                        name={displayName}
                        size="md"
                        className={`!h-12 !w-12 !text-sm ${chat.file ? "cursor-zoom-in" : ""}`}
                      />
                    </button>
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left focus:outline-none"
                      onClick={() =>
                        router.push(
                          `/dashboard/tenant/messages/${chat.partnerId}`,
                        )
                      }
                      aria-label={`Open chat with ${displayName}`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[15px] font-semibold text-[#111B21]">
                          {displayName}
                        </p>
                        {timeLabel ? (
                          <span className="shrink-0 text-[11px] text-[#667781]">
                            {timeLabel}
                          </span>
                        ) : null}
                      </div>
                      {chat.email ? (
                        <p className="mt-0.5 truncate text-xs text-[#008069]">
                          {chat.email}
                        </p>
                      ) : null}
                      <p className="mt-0.5 truncate text-[13px] text-[#667781]">
                        {preview}
                      </p>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ImageLightbox
        src={previewImage}
        alt="Profile photo"
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default RentersListScreen;
