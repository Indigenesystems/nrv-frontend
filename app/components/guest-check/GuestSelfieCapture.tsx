"use client";

import { useEffect, useRef, useState } from "react";

type GuestSelfieCaptureProps = {
  onCapture: (dataUrl: string) => void;
  value?: string;
};

export default function GuestSelfieCapture({
  onCapture,
  value,
}: GuestSelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 720, height: 720 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setError("Camera access is required for a live selfie.");
      }
    };
    if (!value) {
      void start();
    }
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [value]);

  const capture = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    onCapture(dataUrl);
  };

  if (value) {
    return (
      <div className="space-y-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Captured selfie"
          className="w-full max-w-xs rounded-xl mx-auto"
        />
        <button
          type="button"
          className="w-full rounded-full border border-gray-200 py-2.5 text-sm"
          onClick={() => onCapture("")}
        >
          Retake
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full max-w-xs rounded-xl bg-black mx-auto aspect-square object-cover"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={capture}
        className="w-full rounded-full bg-[#03442C] py-2.5 text-sm font-semibold text-white"
      >
        Capture selfie
      </button>
    </div>
  );
}
