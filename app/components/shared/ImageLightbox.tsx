"use client";

type ImageLightboxProps = {
  src: string | null;
  alt?: string;
  onClose: () => void;
};

const ImageLightbox = ({ src, alt = "Image preview", onClose }: ImageLightboxProps) => {
  if (!src) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="button"
      tabIndex={0}
      aria-label="Close image preview"
      onKeyDown={(event) => {
        if (
          event.key === "Escape" ||
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <button
        type="button"
        className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/25"
        onClick={onClose}
        aria-label="Close"
      >
        Close
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
};

export default ImageLightbox;
