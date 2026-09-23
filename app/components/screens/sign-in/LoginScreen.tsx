"use client";

import { useState, useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";

// Components
import Button from "@/app/components/shared/buttons/Button";

const Carousel = dynamic(() => import("./Carousel"), {
  ssr: false,
  loading: () => <div className="w-full h-screen bg-gradient-to-br from-[#03442C] to-[#022419]" />,
});
import LoginForm from "./components/LoginForm";
import LoginHeader from "./components/LoginHeader";
import RememberMeCheckbox from "./components/RememberMeCheckbox";

// Hooks
import { useLoginForm } from "./hooks/useLoginForm";
import { useAuthRedirect } from "./hooks/useAuthRedirect";

// Types
import { LoginFormData } from "./types";

// Constants
import { ROUTES } from "./constants";

// Redux
import { loginUser } from "@/redux/slices/userSlice";

const LoginScreen: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  //const { loading, error, data } = useSelector((state: any) => state.user);
  
  // Custom hooks
  const { formData, errors, handleInputChange, validateForm } = useLoginForm();
  const { redirectUser } = useAuthRedirect();
  
  // Local state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  useEffect(() => {
    localStorage.removeItem("rememberedEmail");
    const reason = new URLSearchParams(window.location.search).get("reason");
    if (reason) {
      toast.info(reason);
      const url = new URL(window.location.href);
      url.searchParams.delete("reason");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);
    
    try {
      const userData = await dispatch(
        loginUser({ ...formData, rememberMe }) as any,
      ).unwrap();
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }
      localStorage.removeItem("rememberedEmail");
      
      // Redirect user based on account type and status
      redirectUser(userData);
      
    } catch (error: any) {
      const errorMessage = error?.message || error || "Login failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, formData, validateForm, rememberMe, redirectUser]);

  // Handle forgot password
  const handleForgotPassword = useCallback(() => {
    router.push(ROUTES.FORGOT_PASSWORD);
  }, [router]);

  // Handle return to home
  const handleReturnHome = useCallback(() => {
    router.push(ROUTES.HOME);
  }, [router]);

  const handleRememberMeChange = useCallback((checked: boolean) => {
    setRememberMe(checked);

    if (!checked) {
      localStorage.removeItem("rememberMe");
      localStorage.removeItem("rememberedEmail");
    }
  }, []);

  return (
    <div className="font-jakarta flex flex-col lg:flex-row lg:justify-center min-h-screen min-h-[100dvh] bg-gray-100 overflow-x-hidden">
      {/* Left side - Carousel (hidden on mobile) */}
      <div className="hidden lg:block lg:shrink-0 lg:w-1/2 lg:max-w-[50%]">
        <Carousel />
      </div>

      {/* Right side - Login Form */}
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

          {/* Header */}
          <LoginHeader />
          
          {/* Login Form */}
          <LoginForm
            formData={formData}
            errors={errors}
            isLoading={isLoading}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
          />
          
          {/* Remember Me Checkbox */}
          <RememberMeCheckbox
            checked={rememberMe}
            onChange={handleRememberMeChange}
          />
          
          {/* Login Button */}
          <Button
            size="large"
            className="block w-full mt-6 font-medium text-[16px]"
            variant="darkPrimary"
            showIcon={false}
            onClick={handleSubmit}
            disabled={isLoading}
            isLoading={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          {/* Forgot Password Link */}
          <div className="text-center mt-4">
            <button
              onClick={handleForgotPassword}
              className="text-sm text-[#645D5D] font-light hover:text-nrvPrimaryGreen transition-colors"
            >
              Forgot Password?{" "}
              <span className="font-medium text-nrvPrimaryGreen">Recover</span>
            </button>
          </div>
          
          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-100 text-gray-500">Or continue with</span>
            </div>
          </div>
          
          {/* Social Login Buttons */}

          
          {/* Return to Home Button */}
          <Button
            size="large"
            className="w-full mt-4"
            variant="light"
            onClick={handleReturnHome}
          >
            Return to Home Page
          </Button>
          
          {/* Sign Up Link */}
          <p className="text-center mt-4 text-sm text-gray-500">
            Are you new here?{" "}
            <Link
              href={ROUTES.SIGN_UP}
              className="font-medium text-nrvPrimaryGreen hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
