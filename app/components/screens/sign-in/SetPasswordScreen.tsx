"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { MdOutlineKey } from "react-icons/md";
import Button from "@/app/components/shared/buttons/Button";
import InputField from "@/app/components/shared/input-fields/InputFields";
import { setPasswordAfterInvite } from "@/redux/slices/userSlice";
import {
  getDashboardHomeForRole,
  getStoredSession,
  resolveNrvRole,
  sessionRequiresPasswordChange,
} from "@/lib/authSession";
import { ROUTES } from "./constants";

const Carousel = dynamic(() => import("./Carousel"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gradient-to-br from-[#03442C] to-[#022419]" />
  ),
});

const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";

const SetPasswordScreen = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const session = getStoredSession();
    if (!session?.accessToken) {
      router.replace("/sign-in");
      return;
    }
    if (!sessionRequiresPasswordChange(session)) {
      const role = resolveNrvRole(session.user?.accountType);
      router.replace(role ? getDashboardHomeForRole(role) : ROUTES.HOME);
    }
  }, [router]);

  const validate = useCallback(() => {
    const nextErrors: { newPassword?: string; confirmPassword?: string } = {};
    if (!newPassword.trim()) {
      nextErrors.newPassword = "Password is required";
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = PASSWORD_POLICY_MESSAGE;
    } else if (!/[A-Z]/.test(newPassword)) {
      nextErrors.newPassword = PASSWORD_POLICY_MESSAGE;
    } else if (!/[a-z]/.test(newPassword)) {
      nextErrors.newPassword = PASSWORD_POLICY_MESSAGE;
    } else if (!/\d/.test(newPassword)) {
      nextErrors.newPassword = PASSWORD_POLICY_MESSAGE;
    } else if (!/[^a-zA-Z0-9]/.test(newPassword)) {
      nextErrors.newPassword = PASSWORD_POLICY_MESSAGE;
    }
    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = "Please confirm your password";
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [newPassword, confirmPassword]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) {
        return;
      }
      setIsLoading(true);
      try {
        const userData = await dispatch(
          setPasswordAfterInvite({ newPassword, confirmPassword }) as any,
        ).unwrap();
        toast.success("Password created successfully.");
        const role = resolveNrvRole(userData?.user?.accountType);
        router.replace(role ? getDashboardHomeForRole(role) : ROUTES.HOME);
      } catch (error: any) {
        toast.error(
          error?.message ||
            error ||
            "Could not update password. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [confirmPassword, dispatch, newPassword, router, validate],
  );

  return (
    <div className="font-jakarta flex min-h-screen min-h-[100dvh] flex-col overflow-x-hidden bg-gray-100 lg:flex-row lg:justify-center">
      <div className="hidden lg:block lg:w-1/2 lg:max-w-[50%] lg:shrink-0">
        <Carousel />
      </div>
      <div className="flex w-full flex-1 flex-col justify-center overflow-y-auto p-4 sm:p-6 lg:w-1/2 lg:p-8">
        <div className="mx-auto w-full min-w-0 max-w-md">
          <div className="mb-8 flex justify-center lg:justify-start">
            <Image
              src="/images/nrvlogo.jpg"
              alt="Naija Rent Verify"
              width={160}
              height={48}
              className="h-10 w-auto"
              priority
            />
          </div>
          <h1 className="text-2xl font-semibold text-[#101828]">
            Create a new password
          </h1>
          <p className="mt-2 text-sm text-[#667085]">
            You signed in with a temporary invite code. Choose a new password to
            secure your account before continuing.
          </p>
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <InputField
              label="New password"
              name="newPassword"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrors((prev) => ({ ...prev, newPassword: undefined }));
              }}
              placeholder="Enter a new password"
              inputType="password"
              password={true}
              autoComplete="new-password"
              error={errors.newPassword}
              icon={<MdOutlineKey className="text-gray-400" />}
            />
            <InputField
              label="Confirm password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              placeholder="Confirm your new password"
              inputType="password"
              password={true}
              autoComplete="new-password"
              error={errors.confirmPassword}
              icon={<MdOutlineKey className="text-gray-400" />}
            />
            <Button
              type="submit"
              className="mt-4 w-full"
              disabled={isLoading}
              aria-label="Save new password and continue"
            >
              {isLoading ? "Saving…" : "Save password & continue"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetPasswordScreen;
