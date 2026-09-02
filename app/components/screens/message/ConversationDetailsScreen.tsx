import { useState, useEffect, useRef } from "react";
import { AiOutlineCheck } from "react-icons/ai";
import ImageLightbox from "@/app/components/shared/ImageLightbox";

interface Message {
  _id: string;
  content: string;
  createdAt: string;
  sender: { _id?: string } | string;
  files?: string[];
}

interface User {
  user?: {
    _id: string;
  };
}

interface ConversationDetailsScreenProps {
  messages: Message[];
}

const isImageUrl = (url: string): boolean => {
  if (!url) {
    return false;
  }
  if (/\.(jpeg|jpg|png|gif|webp|bmp|heic)(\?|$)/i.test(url)) {
    return true;
  }
  // Cloudinary image delivery URLs often omit a file extension
  if (/\/image\/upload\//i.test(url) || /res\.cloudinary\.com/i.test(url)) {
    return !/\.pdf(\?|$)/i.test(url) && !/\/raw\/upload\//i.test(url);
  }
  return false;
};

const isPdfUrl = (url: string): boolean =>
  /\.pdf(\?|$)/i.test(url) || /\/raw\/upload\//i.test(url);

const ConversationDetailsScreen: React.FC<ConversationDetailsScreenProps> = ({
  messages,
}) => {
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const user: User | null = JSON.parse(
    localStorage.getItem("nrv-user") as string
  );

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const isNewDay = (current: string, previous: string | null): boolean => {
    if (!previous) return true;
    const currentDate = new Date(current).toDateString();
    const previousDate = new Date(previous).toDateString();
    return currentDate !== previousDate;
  };

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages.length, messages[messages.length - 1]?._id]);

  let lastDate: string | null = null;

  const handleImageClick = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  return (
    <div>
      {messages &&
        messages.map((message) => {
          const senderId = String(
            (message.sender as { _id?: string })?._id ?? message.sender ?? "",
          );
          const isSender = senderId === String(user?.user?._id ?? "");
          const showDateHeader = isNewDay(message.createdAt, lastDate);
          lastDate = message.createdAt;
          const text = String(message.content || "").trim();
          const hasFiles = Boolean(message.files?.length);

          return (
            <div key={message._id}>
              {showDateHeader && (
                <div className="my-4 text-center text-sm text-gray-500">
                  {new Date(message.createdAt).toLocaleDateString([], {
                    weekday: "long",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              )}

              <div
                className={`mb-3 flex ${
                  isSender ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`w-fit max-w-xs rounded-lg p-3 shadow-sm ${
                    isSender
                      ? "bg-[#E9F4E7] text-[#111B21]"
                      : "bg-white text-[#111B21]"
                  }`}
                  style={{
                    borderRadius: isSender
                      ? "8px 8px 0 8px"
                      : "8px 8px 8px 0",
                  }}
                >
                  {text ? (
                    <p className="whitespace-pre-wrap text-xs">{text}</p>
                  ) : null}

                  {hasFiles && (
                    <div className={`grid gap-2 ${text ? "mt-2" : ""}`}>
                      {message.files!.map((file, index) => {
                        const showAsImage = isImageUrl(file);
                        const showAsPdf = isPdfUrl(file);

                        return (
                          <div
                            key={index}
                            className="flex flex-col items-start"
                          >
                            {showAsImage && (
                              <button
                                type="button"
                                className="block overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03442C]/40"
                                onClick={() => handleImageClick(file)}
                                aria-label="View full size image"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={file}
                                  alt={`attachment-${index}`}
                                  className="h-40 w-60 cursor-zoom-in object-cover transition hover:opacity-95"
                                />
                              </button>
                            )}

                            {showAsPdf && (
                              <>
                                <a
                                  href={file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-[#027EB5] underline"
                                >
                                  Open PDF
                                </a>
                                <iframe
                                  src={file}
                                  title={`PDF-${index}`}
                                  className="mt-2 h-32 w-60 rounded-lg border"
                                />
                              </>
                            )}

                            {!showAsImage && !showAsPdf && (
                              <a
                                href={file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-[#027EB5] underline"
                              >
                                Open attachment
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[10px] text-[#667781]">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {isSender && (
                      <span className="ml-2 flex items-center text-[10px] text-[#53BDEB]">
                        <AiOutlineCheck />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      <div ref={messageEndRef} />

      <ImageLightbox
        src={previewImage}
        alt="Message attachment"
        onClose={closePreview}
      />
    </div>
  );
};

export default ConversationDetailsScreen;
