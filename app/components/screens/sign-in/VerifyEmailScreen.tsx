"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Button from "@/app/components/shared/buttons/Button";
import InputField from "@/app/components/shared/input-fields/InputFields";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { verifyEmail, PASSWORD_RESET_CONTEXT_KEY } from "@/redux/slices/userSlice";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { MdOutlineMail } from "react-icons/md";

const Carousel = dynamic(() => import("./Carousel"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gradient-to-br from-[#03442C] to-[#022419]" />
  ),
});

interface FormData {
  email: string;
}

const VerifyEmailScreen: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const validateForm = () => {
    const nextErrors: { [key: string]: string } = {};

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = "Invalid email address";
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
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await dispatch(verifyEmail(formData) as any).unwrap();
      sessionStorage.setItem(
        PASSWORD_RESET_CONTEXT_KEY,
        JSON.stringify({
          email: formData.email.trim(),
          expiresAt: response?.expiresAt,
        }),
      );
      toast.success(response?.message || "Password reset code sent");
      setFormData({ email: "" });
      router.push("/reset-password");
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
            Forgot your password?
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-500 font-light leading-relaxed">
            Enter the email linked to your account and we&apos;ll send you a reset
            code that stays valid for 1 hour.
          </p>

          <div className="mt-6">
            <InputField
              label="Email Address"
              placeholder="Enter your email address"
              inputType="email"
              value={formData.email}
              name="email"
              onChange={handleInputChange}
              error={errors.email}
              autoComplete="off"
              icon={<MdOutlineMail size={20} color="#999999" />}
            />
          </div>

          <Button
            size="large"
            className="block w-full mt-6 font-medium text-[16px]"
            variant="darkPrimary"
            showIcon={false}
            onClick={handleSubmit}
            disabled={isLoading}
            isLoading={isLoading}
          >
            {isLoading ? "Sending..." : "Send reset code"}
          </Button>

          <p className="text-center mt-4 text-sm text-gray-500">
            Remember your password?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-nrvPrimaryGreen hover:underline"
            >
              Sign in
            </Link>
          </p>

          <p className="text-center mt-3 text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-nrvPrimaryGreen hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailScreen;
