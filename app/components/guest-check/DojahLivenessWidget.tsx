"use client";

import { useEffect } from "react";
import { DOJAH_APP_ID, DOJAH_WIDGET_ID } from "@/lib/dojahWidget";

type DojahWidgetConfig = {
  appId?: string;
  publicKey?: string;
  widgetId?: string;
  type?: string;
  referenceId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type DojahLivenessWidgetProps = {
  widget: DojahWidgetConfig;
  onSuccess: (payload?: { referenceId?: string }) => void;
  onError: (message: string) => void;
};

declare global {
  interface Window {
    Connect?: new (options: Record<string, unknown>) => {
      setup: () => void;
      open: () => void;
    };
  }
}

const SCRIPT_SRC = "https://widget.dojah.io/widget.js";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const loadScript = async () => {
  const existing = document.querySelector(
    `script[src="${SCRIPT_SRC}"]`,
  ) as HTMLScriptElement | null;
  if (!existing) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = false;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Could not load the liveness camera."));
      document.body.appendChild(script);
    });
  }
  for (let i = 0; i < 20; i += 1) {
    if (typeof window.Connect === "function") {
      return;
    }
    await wait(100);
  }
  throw new Error("Liveness camera is not available.");
};

const listeners: {
  onSuccess: (payload?: { referenceId?: string }) => void;
  onError: (message: string) => void;
} = {
  onSuccess: () => undefined,
  onError: () => undefined,
};

let connectBusy = false;

export default function DojahLivenessWidget({
  widget,
  onSuccess,
  onError,
}: DojahLivenessWidgetProps) {
  listeners.onSuccess = onSuccess;
  listeners.onError = onError;

  const appId = widget.appId || DOJAH_APP_ID;
  const publicKey = widget.publicKey;
  const widgetId = widget.widgetId || DOJAH_WIDGET_ID;
  const type = widgetId ? "custom" : widget.type || "liveness";
  const referenceId = widget.referenceId;
  const firstName = widget.firstName;
  const lastName = widget.lastName;
  const email = widget.email;

  useEffect(() => {
    if (!appId || !publicKey || !referenceId) {
      listeners.onError("Liveness is not configured.");
      return;
    }

    let cancelled = false;
    let succeeded = false;

    const open = async () => {
      try {
        await loadScript();
        if (cancelled || connectBusy) {
          return;
        }
        if (typeof window.Connect !== "function") {
          throw new Error("Liveness camera is not available.");
        }
        connectBusy = true;
        const options: Record<string, unknown> = {
          app_id: appId,
          p_key: publicKey,
          type,
          reference_id: referenceId,
          onSuccess: (response: { reference_id?: string } | undefined) => {
            succeeded = true;
            connectBusy = false;
            listeners.onSuccess({
              referenceId: response?.reference_id || referenceId,
            });
          },
          onError: () => undefined,
          onClose: () => {
            connectBusy = false;
            if (!succeeded) {
              listeners.onError(
                "The live camera check was closed before it finished. Please try again.",
              );
            }
          },
        };
        if (widgetId) {
          options.config = { widget_id: widgetId };
        }
        if (firstName || lastName || email) {
          options.user_data = {
            first_name: firstName || "Guest",
            last_name: lastName || "Check",
            residence_country: "NG",
            ...(email ? { email } : {}),
          };
        }
        const connect = new window.Connect(options);
        connect.setup();
        connect.open();
      } catch (err: any) {
        connectBusy = false;
        if (!cancelled) {
          listeners.onError(err?.message || "Could not start liveness.");
        }
      }
    };

    void open();
    return () => {
      cancelled = true;
    };
  }, [appId, publicKey, widgetId, type, referenceId, firstName, lastName, email]);

  return (
    <p className="text-sm text-gray-600">
      Finish every step in the Dojah window, including the camera. Do not close
      it until you see a confirmation.
    </p>
  );
}
