"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import Button from "@/app/components/shared/buttons/Button";
import InputField from "@/app/components/shared/input-fields/InputFields";
import { useDispatch } from "react-redux";
import {
  PASSWORD_RESET_CONTEXT_KEY,
  resetPassword,
} from "@/redux/slices/userSlice";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Clock3 } from "lucide-react";
import { MdOutlineKey, MdOutlineMail } from "react-icons/md";

const Carousel = dynamic(() => import("./Carousel"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gradient-to-br from-[#03442C] to-[#022419]" />
  ),
});

interface FormData {
  token: string;
  newPassword: string;
}

interface PasswordResetContext {
  email?: string;
  expiresAt?: string;
}

const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";

const formatRemainingTime = (expiresAt?: string) => {
  if (!expiresAt) {
    return null;
  }
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 0) {
    return "This code has expired. Request a new reset code.";
  }
  const totalMinutes = Math.ceil(remainingMs / 60000);
  if (totalMinutes >= 60) {
    return "Valid for about 1 hour.";
  }
  return `Valid for about ${totalMinutes} minute${totalMinutes === 1 ? "" : "s"}.`;
};

const ResetPasswordScreen: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    token: "",
    newPassword: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resetContext, setResetContext] = useState<PasswordResetContext>({});
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = sessionStorage.getItem(PASSWORD_RESET_CONTEXT_KEY);
    if (stored) {
      try {
        setResetContext(JSON.parse(stored) as PasswordResetContext);
      } catch {
        setResetContext({});
      }
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const expiryMessage = useMemo(
    () => formatRemainingTime(resetContext.expiresAt),
    [resetContext.expiresAt, now],
  );

  const isExpired = Boolean(
    resetContext.expiresAt &&
      new Date(resetContext.expiresAt).getTime() <= Date.now(),
  );

  const validateForm = () => {
    const nextErrors: { [key: string]: string } = {};

    const token = formData.token.trim();
    if (!token) {
      nextErrors.token = "Confirmation code is required";
    } else if (!/^\d{6}$/.test(token)) {
      nextErrors.token = "Reset code must be 6 digits";
    }

    const password = formData.newPassword;
    if (!password.trim()) {
      nextErrors.password = "Password is required";
    } else if (password.length < 8) {
      nextErrors.password = PASSWORD_POLICY_MESSAGE;
    } else if (!/[A-Z]/.test(password)) {
      nextErrors.password = PASSWORD_POLICY_MESSAGE;
    } else if (!/[a-z]/.test(password)) {
      nextErrors.password = PASSWORD_POLICY_MESSAGE;
    } else if (!/\d/.test(password)) {
      nextErrors.password = PASSWORD_POLICY_MESSAGE;
    } else if (!/[^a-zA-Z0-9]/.test(password)) {
      nextErrors.password = PASSWORD_POLICY_MESSAGE;
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  const handleSubmit = async () => {
    if (isExpired) {
      toast.error("Your reset code has expired. Please request a new one.");
      router.push("/forgot-password");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await dispatch(
        resetPassword({
          token: formData.token.trim(),
          newPassword: formData.newPassword,
        }) as any,
      ).unwrap();
      sessionStorage.removeItem(PASSWORD_RESET_CONTEXT_KEY);
      toast.success("Password reset successfully");
      router.push("/sign-in");
    } catch (error: any) {
      toast.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="font-jakarta flex flex-col lg:flex-row min-h-screen min-h-[100dvh] bg-gray-100 overflow-x-hidden">
      <div className="hidden lg:block lg:shrink-0 lg:w-1/2 lg:max-w-[50%]">
        <Carousel />
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center flex-1 min-h-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-md mx-auto w-full min-w-0">
          <div className="lg:hidden flex justify-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/images/nrvlogo.jpg"
                alt=""
                width={200}
                height={50}
                className="h-9 sm:h-10 w-auto max-w-[min(120px,40vw)] object-contain"
              />
              <span className="text-base font-semibold tracking-tight text-[#03442C] sm:text-lg">
                NaijaRentVerify
              </span>
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            Reset your password
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-500 font-light leading-relaxed">
            Enter the 6-digit code we sent to your email and choose a new
            password.
          </p>

          {expiryMessage && (
            <div
              className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
                isExpired
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{expiryMessage}</p>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <InputField
              label="Confirmation Code"
              placeholder="Enter your 6-digit code"
              inputType="text"
              name="token"
              value={formData.token}
              onChange={handleInputChange}
              error={errors.token}
              autoComplete="one-time-code"
              icon={<MdOutlineMail size={20} color="#999999" />}
            />

            <InputField
              label="New Password"
              placeholder="Enter a new password"
              inputType="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              error={errors.password}
              password={true}
              autoComplete="new-password"
              icon={<MdOutlineKey size={20} color="#999999" />}
            />
          </div>

          <Button
            size="large"
            className="block w-full mt-6 font-medium text-[16px]"
            variant="darkPrimary"
            showIcon={false}
            onClick={handleSubmit}
            disabled={isLoading || isExpired}
            isLoading={isLoading}
          >
            {isExpired ? "Code expired" : isLoading ? "Resetting..." : "Reset password"}
          </Button>

          {isExpired && (
            <Link
              href="/forgot-password"
              className="mt-4 block text-center text-sm font-semibold text-[#03442C] hover:underline"
            >
              Request a new reset code
            </Link>
          )}

          <p className="text-center mt-4 text-sm text-gray-500">
            Back to{" "}
            <Link
              href="/sign-in"
              className="font-medium text-nrvPrimaryGreen hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
