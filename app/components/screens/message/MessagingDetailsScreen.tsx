import React, { useState, useEffect, useRef, useCallback, useId } from "react";
import EmptyState from "../empty-state/EmptyState";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { getConversation, sendMessage } from "@/redux/slices/messageSlice";
import { useParams } from "next/navigation";
import { FaPlusCircle, FaTimesCircle } from "react-icons/fa";
import { IoArrowBack, IoSend } from "react-icons/io5";
import ConversationDetailsScreen from "./ConversationDetailsScreen";
import { apiClient } from "@/lib/api";
import { toast } from "react-toastify";
import UserAvatar from "@/app/components/shared/UserAvatar";
import ImageLightbox from "@/app/components/shared/ImageLightbox";

const POLL_INTERVAL_MS = 4000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 4;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

type PartnerProfile = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  file?: string | null;
};

const MessagingDetailsScreen = ({ source }: { source?: string }) => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [conversation, setConversation] = useState<any[]>([]);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(
    null,
  );
  const [messageContent, setMessageContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const { id } = useParams();
  const partnerId = Array.isArray(id) ? id[0] : id;
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const fetchConversationRef = useRef<
    (options?: { silent?: boolean }) => Promise<void>
  >(async () => {});
  const fileInputId = useId();
  const isLandlordView = source === "recipent" || source === "recipient";

  const dispatch = useDispatch();
  const router = useRouter();

  const resolvePartnerFromMessages = useCallback(
    (messages: any[], userId: string): PartnerProfile | null => {
      if (!messages?.length || !userId) {
        return null;
      }
      const first = messages[0];
      const sender = first?.sender;
      const recipient = first?.recipient;
      const senderId = String(sender?._id ?? sender ?? "");
      if (senderId === userId) {
        return recipient ?? null;
      }
      return sender ?? null;
    },
    [],
  );

  const fetchPartnerProfile = useCallback(async () => {
    if (!partnerId) {
      return;
    }
    try {
      const response = await apiClient.get(`/users/${partnerId}`);
      const user = response?.data?.data ?? response?.data;
      if (user?._id) {
        setPartnerProfile(user);
      }
    } catch {
      // Partner profile is optional — header falls back to conversation data.
    }
  }, [partnerId]);

  const fetchConversation = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!partnerId) {
        if (!options?.silent) {
          setIsInitialLoading(false);
        }
        return;
      }

      let userId = currentUserId;
      if (!userId) {
        const stored = JSON.parse(localStorage.getItem("nrv-user") as string);
        userId = stored?.user?._id ?? "";
        if (userId) {
          setCurrentUserId(userId);
        }
      }

      if (!userId) {
        if (!options?.silent) {
          setIsInitialLoading(false);
        }
        return;
      }

      try {
        const response = await dispatch(
          getConversation({
            senderId: userId,
            recipientId: partnerId,
          }) as any,
        );
        const nextMessages = Array.isArray(response?.payload?.data)
          ? response.payload.data
          : [];
        setConversation((prev) => {
          const prevLastId = prev[prev.length - 1]?._id;
          const nextLastId = nextMessages[nextMessages.length - 1]?._id;
          if (
            prev.length === nextMessages.length &&
            prevLastId === nextLastId
          ) {
            return prev;
          }
          return nextMessages;
        });

        const partnerFromMessages = resolvePartnerFromMessages(
          nextMessages,
          userId,
        );
        if (partnerFromMessages) {
          setPartnerProfile(partnerFromMessages);
        }
      } catch (error) {
        console.error("Error fetching conversation:", error);
      } finally {
        if (!options?.silent) {
          setIsInitialLoading(false);
        }
      }
    },
    [currentUserId, dispatch, partnerId, resolvePartnerFromMessages],
  );

  fetchConversationRef.current = fetchConversation;

  useEffect(() => {
    void fetchPartnerProfile();
    void fetchConversation();
  }, [fetchConversation, fetchPartnerProfile]);

  useEffect(() => {
    const poll = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      void fetchConversationRef.current({ silent: true });
    };
    const intervalId = window.setInterval(poll, POLL_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        poll();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [partnerId]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [conversation.length]);

  const handleSendMessage = async () => {
    if (!messageContent.trim() && files.length === 0) {
      return;
    }
    if (!partnerId) {
      return;
    }

    const stored = JSON.parse(localStorage.getItem("nrv-user") as string);
    const senderId = stored?.user?._id;
    if (!senderId) {
      return;
    }

    const formData = new FormData();
    formData.append("sender", senderId);
    formData.append("recipient", partnerId);
    // Text is optional — image-only messages are allowed
    formData.append("content", messageContent.trim());

    files.forEach((file) => {
      formData.append("file", file);
    });

    try {
      setIsSending(true);
      await dispatch(sendMessage(formData) as any).unwrap();
      setMessageContent("");
      setFiles([]);
      await fetchConversation({ silent: true });
    } catch (error: any) {
      const message =
        typeof error === "string"
          ? error
          : error?.message || "Error sending message";
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleComposerKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
      ? Array.from(event.target.files)
      : [];
    const imageFiles = selectedFiles.filter((file) =>
      ALLOWED_IMAGE_TYPES.includes(file.type),
    );

    if (imageFiles.length !== selectedFiles.length) {
      toast.error("Only JPG, PNG, GIF, or WEBP images are supported.");
    }

    const validFiles = imageFiles.filter(
      (file) => file.size <= MAX_IMAGE_BYTES,
    );
    if (validFiles.length !== imageFiles.length) {
      toast.error("Each image must be 5 MB or smaller.");
    }

    if (validFiles.length + files.length > MAX_IMAGES) {
      toast.error(`You can upload a maximum of ${MAX_IMAGES} images.`);
      event.target.value = "";
      return;
    }

    if (validFiles.length > 0) {
      setFiles((prevFiles) => [...prevFiles, ...validFiles]);
    }
    event.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const partner =
    partnerProfile ??
    resolvePartnerFromMessages(conversation, currentUserId) ??
    null;

  const partnerName =
    [partner?.firstName, partner?.lastName].filter(Boolean).join(" ") ||
    partner?.email ||
    "Conversation";
  const partnerEmail = partner?.email?.trim() || "";

  const renderFilePreviews = () => {
    if (files.length === 0) {
      return null;
    }

    return (
      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {files.map((file, index) => {
          return (
            <div
              key={`${file.name}-${index}`}
              className="relative flex flex-col items-center gap-1"
            >
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="absolute -right-1 -top-1 z-10 rounded-full bg-white text-red-500"
                aria-label={`Remove ${file.name}`}
              >
                <FaTimesCircle size={18} />
              </button>
              <button
                type="button"
                className="overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03442C]/40"
                onClick={() =>
                  setPreviewAvatar(URL.createObjectURL(file))
                }
                aria-label={`Preview ${file.name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt={`preview-${index}`}
                  className="h-16 w-16 cursor-zoom-in object-cover"
                />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const canSend =
    !isSending && (Boolean(messageContent.trim()) || files.length > 0);

  const renderComposer = () => (
    <div className="shrink-0 border-t border-[#E9EDEF] bg-[#F0F2F5] px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-4 md:pb-3">
      {renderFilePreviews()}
      <div className="flex items-end gap-2 md:gap-3">
        <button
          type="button"
          className="shrink-0 p-1 text-[#03442C]"
          onClick={() => document.getElementById(fileInputId)?.click()}
          aria-label="Attach image"
        >
          <FaPlusCircle size={22} />
        </button>
        <input
          id={fileInputId}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <textarea
          rows={1}
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-3xl border-0 bg-white px-4 py-2.5 text-base text-[#111B21] shadow-sm outline-none touch-manipulation focus:ring-2 focus:ring-[#03442C]/25 md:text-sm"
          placeholder={
            files.length > 0
              ? "Add a caption (optional)…"
              : "Type a message or attach an image…"
          }
          value={messageContent}
          onChange={(event) => setMessageContent(event.target.value)}
          onKeyDown={handleComposerKeyDown}
        />
        <button
          type="button"
          className="shrink-0 rounded-full bg-[#03442C] p-2.5 text-white disabled:opacity-50"
          onClick={() => void handleSendMessage()}
          disabled={!canSend}
          aria-label="Send message"
        >
          <IoSend size={18} />
        </button>
      </div>
    </div>
  );

  if (isInitialLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
        <div className="flex items-center gap-4 border-b pb-4">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`h-16 animate-pulse rounded-2xl bg-gray-100 ${
                  index % 2 === 0 ? "w-2/3" : "w-1/2 bg-emerald-50"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasMessages = conversation.length > 0;

  return (
    <div className="-mx-2 -mt-3 mb-0 flex h-[calc(100lvh-3.75rem)] max-h-[calc(100lvh-3.75rem)] w-auto flex-col overflow-hidden bg-[#ECE5DD] sm:-mx-4 md:mx-auto md:mt-0 md:h-[calc(100dvh-6.5rem)] md:max-h-[calc(100dvh-6.5rem)] md:max-w-3xl md:rounded-2xl md:border md:border-gray-200 md:shadow-sm lg:h-[calc(100dvh-5.5rem)] lg:max-h-[calc(100dvh-5.5rem)]">
      <div className="flex shrink-0 items-center gap-3 border-b border-[#03442C]/30 bg-[#03442C] px-3 py-2.5 text-white md:px-4">
        <button
          type="button"
          className="shrink-0 rounded-full p-1 hover:bg-white/10"
          onClick={() => router.back()}
          aria-label="Go back"
        >
          <IoArrowBack size={22} />
        </button>
        <button
          type="button"
          className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-white/40"
          onClick={() => {
            if (partner?.file) {
              setPreviewAvatar(String(partner.file));
            }
          }}
          aria-label={
            partner?.file
              ? `View ${partnerName}'s profile photo`
              : partnerName
          }
          disabled={!partner?.file}
        >
          <UserAvatar
            src={partner?.file}
            name={partnerName}
            size="md"
            light
            className={`!h-10 !w-10 ${partner?.file ? "cursor-zoom-in" : ""}`}
          />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{partnerName}</p>
          <p className="truncate text-xs text-white/80">
            {partnerEmail ||
              (isLandlordView
                ? "Tenant conversation"
                : "Landlord conversation")}
          </p>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-3 py-4 md:px-4"
      >
        {hasMessages ? (
          <ConversationDetailsScreen messages={conversation} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center">
            <EmptyState />
            <p className="mt-2 text-sm text-[#111B21]">No messages yet</p>
            <p className="mt-1 max-w-xs text-xs text-[#667781]">
              Send a text or photo to start the conversation. New messages
              appear here automatically.
            </p>
          </div>
        )}
      </div>

      {renderComposer()}

      <ImageLightbox
        src={previewAvatar}
        alt={`${partnerName} profile photo`}
        onClose={() => setPreviewAvatar(null)}
      />
    </div>
  );
};

export default MessagingDetailsScreen;
