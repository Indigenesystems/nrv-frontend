"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Formik, Form } from "formik";
import * as yup from "yup";
import dynamic from "next/dynamic";
import { createUser } from "../../../../redux/slices/userSlice";
import SignUppVerifyAccountScreen from "./SignUpVerifyAccountScreen";
import Button from "@/app/components/shared/buttons/Button";
import CheckBox from "@/app/components/shared/input-fields/CheckBox";
import InputField from "@/app/components/shared/input-fields/InputFields";
import { CheckCircle, Smile, User } from "lucide-react";
import { toast } from "react-toastify";
import AccountSideBar from "./AccountSideBar";
import AccountTypeBadge from "./AccountTypeBadge";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const Carousel = dynamic(() => import("../sign-in/Carousel"), {
  ssr: false,
  loading: () => <div className="w-full h-screen bg-gradient-to-br from-[#03442C] to-[#022419]" />,
});

const validationSchema = yup.object({
  firstName: yup.string().required("First Name is required"),
  lastName: yup.string().required("Last Name is required"),
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is required"),
  nin: yup.string().optional(),
  phoneNumber: yup.string().required("Phone Number is required"),
  accountType: yup.string().required("Account Type is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character"
    )
    .matches(/\d/, "Password must contain at least one number"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
});

const SignUpMultiForm = () => {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [prefillPhone, setPrefillPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false); // Checkbox state
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const router = useRouter();
  const handleSubmit = async (values: any) => {
    if (!isChecked) {
      toast.error("You must agree to the Terms of Use and Privacy Policy");
      return;
    }
    const { confirmPassword, ...payload } = values;
    if (payload.accountType === "tenant") {
      delete payload.nin;
    }
    setIsLoading(true);
    try {
      await dispatch(
        createUser({
          ...payload,
          file: profilePhoto || undefined,
        }) as any,
      ).unwrap();
      localStorage.setItem("stepToLoad", JSON.stringify(3));
      setCurrentStep(3);
      setIsLoading(false);
    } catch (error: any) {
      toast.error(error);
      setIsLoading(false);
    }
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile photo must be under 5MB.");
      return;
    }
    setProfilePhoto(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    const roleParam = searchParams.get("role");
    const phoneParam = searchParams.get("phone");

    if (roleParam === "landlord" || roleParam === "tenant") {
      setSelectedRole(roleParam);
      if (phoneParam) setPrefillPhone(phoneParam);
      setCurrentStep(2);
      return;
    }

    const stepFromStorage = localStorage.getItem("stepToLoad");
    if (stepFromStorage) {
      try {
        const parsedStep = JSON.parse(stepFromStorage);
        setCurrentStep(parsedStep);
      } catch (error) {
        console.error("Error parsing stepToLoad from localStorage:", error);
        setCurrentStep(1);
      }
    } else {
      setCurrentStep(1);
    }
  }, [searchParams]);

  return (
    <div className="font-jakarta">
      {currentStep === 1 && (
        <div className="flex flex-col md:flex-row w-full min-h-screen min-h-[100dvh] md:min-h-screen overflow-x-hidden">
          <div className="hidden md:block md:w-1/2 md:shrink-0 md:max-w-[50%]">
            <Carousel />
          </div>
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center flex-1 min-h-0 bg-gray-50 p-4 sm:p-6 overflow-y-auto">
            <div className="max-w-md w-full min-w-0">
              <div className="md:hidden flex justify-center w-full mb-6 min-w-0">
                <Link
                  href="/"
                  className="inline-flex max-w-full items-center gap-2"
                >
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
              <h1 className="text-xl sm:text-2xl font-bold text-black">
                Create an Account!
              </h1>
              <p className="text-gray-500 mt-2 text-[15px] sm:text-base leading-relaxed">
                Welcome to NaijaRentVerify! Choose your role to get started.
              </p>
              {selectedRole && (
                <div className="mt-4">
                  <AccountTypeBadge accountType={selectedRole} />
                </div>
              )}
              <div className="mt-6 space-y-4">
                {[
                  {
                    role: "landlord",
                    icon: <Smile className="text-green-600" />,
                    text: "Sign Up as a Property Owner/Landlord",
                    description:
                      "Sign up as a Property owner and get to explore our powerful tools for thorough tenant screening, List, manage, and grow your rental properties with ease.",
                  },
                  {
                    role: "tenant",
                    icon: <User className="text-gray-500" />,
                    text: "Sign Up as a Tenant",
                    description:
                      "Find and secure your dream home with genuine listings.",
                  },
                ].map(({ role, icon, text, description }) => (
                  <div
                    key={role}
                    className="border rounded-xl cursor-pointer"
                    onClick={() => setSelectedRole(role)}
                  >
                    <div
                      className={`flex justify-between gap-2 p-4 rounded-t-xl min-w-0 ${
                        selectedRole === role
                          ? "bg-[#E9F4E7]"
                          : "border-gray-300"
                      }`}
                    >
                      <div className="flex gap-2 min-w-0 flex-1 items-start">
                        {icon}
                        <span className="font-medium text-[#045D23] text-sm sm:text-base break-words">
                          {text}
                        </span>
                      </div>
                      {selectedRole === role && (
                        <CheckCircle className="text-green-600" />
                      )}
                    </div>
                    <p className="text-[#03442C] border-t border p-4 font-light text-[13px] sm:text-[14px] leading-6 break-words">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
              <Button
                size="large"
                className="block w-full mt-6 font-medium text-[16px]"
                variant={selectedRole === null ? "light" : "darkPrimary"}
                onClick={() => setCurrentStep(2)}
                disabled={!selectedRole}
              >
                Continue
              </Button>

              <Button
                size="large"
                className="w-full mt-4"
                variant="light"
                onClick={() => router.push("/")}
              >
                Return to Home Page
              </Button>
            </div>
          </div>
        </div>
      )}
      {currentStep === 2 && (
        <div className="flex w-full h-screen overflow-hidden">
          <div className="hidden lg:block w-1/2 bg-[#E9F4E7]">
            <AccountSideBar accountType={selectedRole} />
          </div>
          <div className="w-full lg:w-1/2 bg-white p-12 pb-20 overflow-y-auto">
            <div className="max-w-md mx-auto ">
              <h1 className="text-2xl font-bold text-green-600 lg:hidden my-10">
                NaijaRentVerify
              </h1>
              <AccountTypeBadge accountType={selectedRole} className="mb-4" />
              <h2 className="text-3xl font-bold mb-2">Create Your Account</h2>
              <div className="mb-6 flex flex-col items-center gap-3">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-[#03442C]/40 bg-[#E9F4E7]">
                  {profilePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profilePreview}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#03442C]">
                      <User className="h-8 w-8" aria-hidden />
                    </div>
                  )}
                </div>
                <label className="cursor-pointer text-sm font-medium text-[#03442C] underline-offset-2 hover:underline">
                  Upload profile photo
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleProfilePhotoChange}
                    aria-label="Upload profile photo"
                  />
                </label>
                <p className="text-xs text-gray-500">Optional · JPG or PNG · max 5MB</p>
              </div>
              <Formik
                enableReinitialize
                initialValues={{
                  firstName: "",
                  lastName: "",
                  email: "",
                  phoneNumber: prefillPhone,
                  nin: "",
                  password: "",
                  confirmPassword: "",
                  accountType: selectedRole,
                }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ handleChange, handleBlur, values, errors }) => {
                  const formFields = [
                    "firstName",
                    "lastName",
                    "email",
                    "phoneNumber",
                    ...(selectedRole === "landlord" ? (["nin"] as const) : []),
                    "password",
                    "confirmPassword",
                  ] as const;

                  return (
                  <Form className="space-y-4">
                    {formFields.map((name) => (
                      <InputField
                        key={name}
                        placeholder="Start Typing..."
                        name={name}
                        label={name
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                        inputType={
                          name.includes("password")
                            ? "password"
                            : name.includes("phoneNumber")
                            ? "phone"
                            : name.includes("nin")
                            ? "nin"
                            : name.includes("email")
                            ? "email"
                            : "text"
                        }
                        value={(values as any)[name]}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={(errors as any)[name]}
                        password={
                          name.includes("password") ||
                          name.includes("confirmPassword")
                        }
                      />
                    ))}
                    {/* Terms and Conditions Checkbox */}
                    <CheckBox
                      label={
                        <>
                          I agree to the{" "}
                          <Link
                            href="/legal"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-green-800 underline hover:text-green-900"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Terms of Use
                          </Link>{" "}
                          and{" "}
                          <Link
                            href="/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-green-800 underline hover:text-green-900"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Privacy Policy
                          </Link>
                        </>
                      }
                      checked={isChecked}
                      onChange={() => setIsChecked(!isChecked)}
                    />
                    <p className="text-gray-600 text-sm lg:hidden">
                      Already have an account?{" "}
                      <a
                        href="/sign-in"
                        className="font-semibold text-green-900"
                      >
                        Log in here.
                      </a>
                    </p>
                    {/* Submit Button */}
                    <Button
                      variant="darkPrimary"
                      type="submit"
                      size="large"
                      className="block w-full mt-6 font-medium text-[16px]"
                      isLoading={isLoading}
                      disabled={!isChecked} // Disable if not checked
                    >
                      Continue
                    </Button>
                    <Button
                      size="large"
                      className="w-full mt-4"
                      variant="light"
                      onClick={() => router.push("/")}
                    >
                      Return to Home Page
                    </Button>
                  </Form>
                  );
                }}
              </Formik>
            </div>
          </div>
        </div>
      )}
      {currentStep === 3 && (
        <SignUppVerifyAccountScreen accountType={selectedRole} />
      )}
    </div>
  );
};

export default SignUpMultiForm;
