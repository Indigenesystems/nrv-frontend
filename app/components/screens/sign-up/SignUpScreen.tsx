"use client";

import Button from "@/app/components/shared/buttons/Button";
import InputField from "@/app/components/shared/input-fields/InputFields";
import Link from "next/link";
import { useState } from "react";
import { FaApple } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import Carousel from "../sign-in/Carousel";
import SignUpMultiForm from "./SignUpMultiForm";

const SignUpScreen = () => {
  return (
    <div className="flex justify-center">
      <Carousel />
      <div className="w-full sm:w-1/2 p-8 justify-center">
        <SignUpMultiForm />
      </div>
    </div>
  );
};

export default SignUpScreen;
