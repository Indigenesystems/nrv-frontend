import Button from "@/app/components/shared/buttons/Button";
import CheckBox from "@/app/components/shared/input-fields/CheckBox";
import InputField from "@/app/components/shared/input-fields/InputFields";
import Link from "next/link";
import React, { useState } from "react";
import { FaApple, FaArrowLeft } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { IoPersonCircleSharp } from "react-icons/io5";
import { IoCheckmarkCircleSharp } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { createUser } from "../../../../redux/slices/userSlice";
import SignUppVerifyAccountScreen from "./SignUpVerifyAccountScreen";
import { useRouter } from "next/navigation";
import { IoIosArrowBack } from "react-icons/io";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  nin: string;
  password: string;
  phoneNumber: string;
  homeAddress: string;
  accountType: string;
}

const SignUpMultiForm: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error, data } = useSelector((state: any) => state.user);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    nin: "",
    password: "",
    phoneNumber: "",
    homeAddress: "",
    accountType: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false); // New loading state

  const validateForm = () => {
    let errors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "First Name is required";
    }
    if (!formData.lastName.trim()) {
      errors.lastName = "Last Name is required";
    }
    if (!formData.nin.trim()) {
      errors.nin = "Nin is required";
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Invalid email address";
    }
    if (!formData.password.trim()) {
      errors.password = "Password is required";
    }
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone Number is required";
    }
    if (!formData.homeAddress.trim()) {
      errors.homeAddress = "Home Address is required";
    }
    if (!formData.accountType.trim()) {
      errors.accountType = "Account Type is required";
    }

    setErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handleItemClick = (index: number) => {
    setActiveIndex(index === activeIndex ? null : index);
  };

  const handleAccountType = (text: string) => {
    setFormData((prevData) => ({
      ...prevData,
      accountType: text,
    }));
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
    setIsLoading(true); // Set loading state to true when starting the request
    try {
      await dispatch(createUser(formData) as any).unwrap();
      setCurrentStep(3);
    } catch (error: any) {
      toast.error(error);
    } finally {
      setIsLoading(false); // Set loading state back to false after request completes
    }
  };

  return (
    <div className="container">
      <ToastContainer />
      {currentStep === 1 && (
        <div>
          <div className="max-w-md h-screen">
            <div className="text-3xl text-nrvGreyBlack font-semibold">
              Welcome user 🚀,
            </div>
            <div className="pt-2 text-nrvLightGrey text-md">
              What will you be joining naijarentverify as?
            </div>
            <div
              className={`mt-4 text-sm flex bg-white border border-nrvLightGrey rounded rounded-2xl ${
                activeIndex === 0 ? "bg-gray-100" : ""
              }`}
              onClick={() => {
                handleItemClick(0);
                handleAccountType("landlord");
              }}
            >
              <div className="w-1/5 mx-auto flex items-center justify-center">
                <IoPersonCircleSharp color="#153969" size={40} />
              </div>

              <div className="4/5 p-2">
                <div className="text-nrvGreyBlack text-lg font-semibold">
                  Sign up as a landlord
                </div>
                <div className="text-nrvLightGrey text-sm">
                  Explore our powerful tools for thorough tenant screening.
                </div>
              </div>

              {activeIndex === 0 && (
                <div className="top-0 right-0">
                  <IoCheckmarkCircleSharp color="#153969" size={25} />
                </div>
              )}
            </div>
            <div
              className={`mt-4 text-sm flex bg-white border border-nrvLightGrey rounded rounded-2xl ${
                activeIndex === 1 ? "bg-gray-100" : ""
              }`}
              onClick={() => {
                handleItemClick(1);
                handleAccountType("tenant");
              }}
            >
              <div className="w-1/5 mx-auto flex items-center justify-center">
                <IoPersonCircleSharp color="#153969" size={40} />
              </div>
              <div className="4/5 p-2">
                <div className="text-nrvGreyBlack text-lg font-semibold">
                  Sign up as a tenant
                </div>
                <div className="text-nrvLightGrey text-sm">
                  Explore our powerful tools for thorough tenant screening.
                </div>
              </div>
              {activeIndex === 1 && (
                <div className="top-0 right-0">
                  <IoCheckmarkCircleSharp color="#153969" size={25} />
                </div>
              )}
            </div>
            <div className="w-full justify-center flex gap-3 mt-4">
              <div className="text-sm text-nrvLightGrey">
                Already have an account?
              </div>
              <Link
                href="/sign-in"
                className="text-sm underline font-light text-[#153969]"
              >
                Log in
              </Link>
            </div>
            <div className="mt-80">
              <Button
                size="large"
                className="block w-full"
                variant="bluebg"
                showIcon={false}
                onClick={handleNext}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
      {currentStep === 2 && (
        <div className="max-w-md">
          <div className="text-2xl text-nrvGreyBlack font-semibold flex gap-2">
            <span>
              {" "}
              <IoIosArrowBack
              className="mt-1 hover:cursor-pointer"
                onClick={() => {
                  router.push("/");
                }}
              />{" "}
            </span>{" "}
            Sign up as a landlord 🚀,
          </div>
          <div className="pt-2 text-nrvLightGrey text-md">
            Kindly fill the provided form.
          </div>
          <div className="pt-4">
            <Button
              className="w-full block"
              size="large"
              variant="whitebg"
              showIcon={false}
            >
              <div className="flex gap-1">
                <FaApple color="black" size={22} /> Sign in with Apple
              </div>
            </Button>
          </div>
          <div className="pt-4">
            <Button
              className="w-full block"
              size="large"
              variant="whitebg"
              showIcon={false}
            >
              {" "}
              <div className="flex gap-1">
                <FcGoogle size={22} /> Sign in with Google
              </div>
            </Button>
          </div>
          <div className="flex items-center w-full mt-6">
            <div className="w-5/12 border-b border-nrvLightGrey"></div>
            <div className="w-2/12 text-center text-nrvLightGrey text-sm">
              OR
            </div>
            <div className="w-5/12 border-b border-nrvLightGrey"></div>
          </div>
          <div className="w-full  mt-6 flex gap-3">
            <div className="w-1/2">
              <InputField
                label="First Name"
                placeholder="Enter First Name"
                inputType="text"
                name="firstName"
                onChange={handleInputChange}
                error={errors.firstName}
              />
            </div>
            <div className="w-1/2">
              <InputField
                label="Last Name"
                placeholder="Enter Last Name"
                inputType="text"
                name="lastName"
                onChange={handleInputChange}
                error={errors.lastName}
              />
            </div>
          </div>
          <div className="w-full mt-4 flex gap-3">
            <div className="w-1/2">
              <InputField
                label="Email Address"
                placeholder="Enter Email Address"
                inputType="text"
                name="email"
                onChange={handleInputChange}
                error={errors.email}
              />
            </div>
            <div className="w-1/2">
              <InputField
                label="NIN"
                placeholder="Enter NIN"
                inputType="text"
                name="nin"
                onChange={handleInputChange}
                error={errors.nin}
              />
            </div>
          </div>
          <div className="w-full mt-4">
            <InputField
              label="Home Address"
              placeholder="Enter Home Address"
              inputType="text"
              name="homeAddress"
              onChange={handleInputChange}
              error={errors.homeAddress}
            />
          </div>
          <div className="w-full mt-4 flex gap-3">
            <div className="w-1/2">
              <InputField
                label="Phone Number"
                placeholder="Enter Phone Number"
                inputType="text"
                name="phoneNumber"
                onChange={handleInputChange}
                error={errors.phoneNumber}
              />
            </div>
            <div className="w-1/2">
              <InputField
                label="Password"
                placeholder="Enter Password"
                inputType="password"
                name="password"
                onChange={handleInputChange}
                error={errors.password}
              />
            </div>
          </div>
          <div className="text-xs text-nrvGreyBlack mt-3">AT LEAST : </div>
          <div className="grid:col-3 gap-2 mt-1">
            <Button
              size="small"
              className="rounded-3xl mt-2 mr-2"
              variant="whitebg"
              showIcon={false}
            >
              8 characters
            </Button>
            <Button
              size="small"
              className="rounded-3xl mt-2 mr-2"
              variant="whitebg"
              showIcon={false}
            >
              An uppercase letter
            </Button>
            <Button
              size="small"
              className="rounded-3xl mt-2 mr-2"
              variant="whitebg"
              showIcon={false}
            >
              A lowercase letter
            </Button>
            <Button
              size="small"
              className="rounded-3xl mt-2 mr-2"
              variant="whitebg"
              showIcon={false}
            >
              A special character
            </Button>
            <Button
              size="small"
              className="rounded-3xl mt-2 mr-2"
              variant="whitebg"
              showIcon={false}
            >
              A number
            </Button>
          </div>
          <div className="w-full mt-8">
            <CheckBox label="I agree to the terms of use and privacy policy" />
          </div>
          <div className="mt-4">
            <Button
              onClick={handleSubmit}
              size="large"
              className="block w-full"
              variant="bluebg"
              showIcon={false}
              disabled={isLoading} // Disable button while loading
            >
              {isLoading ? "Loading..." : "Continue"}{" "}
              {/* Show loading text if loading */}
            </Button>
          </div>
        </div>
      )}
      {currentStep === 3 && (
        <div>
          <SignUppVerifyAccountScreen />
        </div>
      )}
    </div>
  );
};

export default SignUpMultiForm;
