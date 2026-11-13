import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resendVerificationOtp, verifyAccount } from "@/redux/slices/userSlice";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import OtpInput from "react-otp-input";
import { IoReload } from "react-icons/io5";
import Button from "../../shared/buttons/Button";
import VerifyAccountSideBar from "./VerifyAccountSideBar";
import AddPropertySideBar from "./AddPropertySideBar";
import MultiStepForm from "./MultiStepForm";
import AccountTypeBadge from "./AccountTypeBadge";

type VerifyMode = "signup" | "login";

interface SignUpVerifyAccountProps {
  mode?: VerifyMode;
  accountType?: string | null;
}

const resolveVerifyEmail = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem("emailToVerify");
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return (
      parsed?.data?.email ||
      parsed?.user?.email ||
      parsed?.email ||
      null
    );
  } catch {
    return null;
  }
};

const SignUpVerifyAccount: React.FC<SignUpVerifyAccountProps> = ({
  mode = "signup",
  accountType: accountTypeProp,
}) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const { error } = useSelector((state: any) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<any>(null);
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);

  useEffect(() => {
    setVerifyEmail(resolveVerifyEmail());
  }, []);

  const handleSubmit = async () => {
    if (otp.length !== 6) {
      return;
    }

    const email = verifyEmail ?? resolveVerifyEmail();
    if (!email) {
      toast.error("Missing email for verification. Please sign up again.");
      return;
    }

    const payload = {
      email,
      confirmationCode: otp,
    };

    setIsLoading(true);
    try {
      const response = await dispatch(verifyAccount(payload) as any).unwrap();
      localStorage.removeItem("stepToLoad");
      setIsLoading(false);

      if (mode === "login") {
        toast.success("Account confirmed. Redirecting...");
        const accountType = response?.user?.accountType;
        if (accountType === "tenant") {
          router.push("/dashboard/tenant");
        } else if (accountType === "landlord") {
          router.push("/dashboard/landlord");
        } else if (accountType === "shortlet_manager") {
          router.push("/dashboard/manager");
        } else {
          router.push("/");
        }
        return;
      }

      const accountType = response?.user?.accountType;
      if (accountType === "tenant") {
        toast.success("Account verified. Welcome to NaijaRentVerify!");
        router.push("/dashboard/tenant");
        return;
      }
      if (accountType === "shortlet_manager") {
        toast.success("Account verified. Welcome to NaijaRentVerify!");
        router.push("/dashboard/manager");
        return;
      }

      setData(response);
      setStep(2);
    } catch (err: any) {
      setIsLoading(false);
      toast.error(err);
    }
  };

  const handleResend = async () => {
    const email = verifyEmail ?? resolveVerifyEmail();
    if (!email) {
      toast.error("Missing email. Please sign up again.");
      return;
    }

    setIsResending(true);
    try {
      const message = await dispatch(
        resendVerificationOtp({ email }) as any,
      ).unwrap();
      toast.success(message);
    } catch (err: any) {
      toast.error(err);
    } finally {
      setIsResending(false);
    }
  };

  const emailDisplay = useMemo(() => verifyEmail ?? "your email", [verifyEmail]);
  const resolvedAccountType =
    data?.user?.accountType ?? accountTypeProp ?? null;

  return (
    <main className=" bg-white">
      <div className="w-full bg-white">
        {step === 1 ? (
          <div className="w-full flex">
            <div className="hidden lg:block w-1/2 bg-[#E9F4E7]">
              <VerifyAccountSideBar accountType={resolvedAccountType ?? accountTypeProp} />
            </div>
            <div className="w-full lg:w-1/2 flex flex-col justify-center p-5">
              <div className="max-w-md mx-auto">
                <h1 className="text-4xl font-bold text-green-600 my-10">
                  NaijaRentVerify
                </h1>
                <AccountTypeBadge
                  accountType={resolvedAccountType ?? accountTypeProp}
                  className="mb-4"
                />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Verify Your Email Address
                </h2>
                <p className="mt-2 text-gray-600">
                  We&apos;ve sent a 6-digit verification code to{" "}
                  <strong className="text-gray-900">{emailDisplay}</strong> and
                  by SMS to the phone number you used to sign up.
                </p>
                <p className="mt-1 text-gray-600">
                  Enter the code below to activate your account.
                </p>

                <div className="mt-4 text-left text-gray-700">
                  <p className="font-semibold">Instructions:</p>
                  <ul className="list-disc list-inside text-sm">
                    <li className="mt-4">Open your email inbox (and spam folder).</li>
                    <li className="mt-4">
                      Check the SMS sent to your phone number.
                    </li>
                    <li className="mt-4">
                      Look for an email from NaijaRentVerify.
                    </li>
                    <li className="mt-4">
                      Copy the One-time PIN (OTP) and paste it here.
                    </li>
                  </ul>
                </div>

                <div className="mt-8 flex justify-center">
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    numInputs={6}
                    renderSeparator={<span> </span>}
                    renderInput={(props) => (
                      <input
                        {...props}
                        className="otp-input outline-none border-1 border-gray-300"
                        style={{
                          fontSize: "16px",
                          height: "50px",
                          textAlign: "center",
                          width: "54px",
                          border: "1px rgba(208, 213, 221, 1) solid",
                          marginRight: "8px",
                          marginLeft: "8px",
                          borderRadius: "9px",
                        }}
                      />
                    )}
                  />
                </div>

                <p className="mt-4 text-sm text-gray-500 text-center">
                  Did not receive the verification code?
                </p>
                <div className="mt-2 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="flex items-center gap-1.5 text-green-700 font-medium hover:text-green-800 disabled:opacity-60"
                    aria-label="Resend verification code"
                  >
                    <IoReload className={`text-lg ${isResending ? "animate-spin" : ""}`} />
                    {isResending ? "Sending code…" : "Resend OTP"}
                  </button>
                </div>

                {error && (
                  <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
                )}

                <Button
                  size="large"
                  className="block w-full mt-6 font-medium text-[16px]"
                  variant="darkPrimary"
                  showIcon={false}
                  onClick={handleSubmit}
                  disabled={otp.length !== 6 || isLoading}
                  isLoading={isLoading}
                >
                  Continue
                </Button>

                <p className="mt-4 text-gray-500 italic text-center font-light">
                  <a
                    href="mailto:info@naijarentverify.com"
                    className="text-green-800 hover:underline not-italic"
                  >
                    Contact Support
                  </a>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {data.user.accountType === "landlord" && (
              <div className="flex min-h-screen w-full lg:h-screen lg:overflow-hidden">
                <div className="hidden w-full max-w-md shrink-0 bg-[#E9F4E7] lg:block lg:w-1/2">
                  <AddPropertySideBar accountType={resolvedAccountType} />
                </div>
                <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto p-5 sm:p-8 lg:w-1/2">
                  <div className="mx-auto w-full max-w-xl">
                    <AccountTypeBadge accountType={resolvedAccountType} className="mb-4" />
                    <MultiStepForm />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default SignUpVerifyAccount;
