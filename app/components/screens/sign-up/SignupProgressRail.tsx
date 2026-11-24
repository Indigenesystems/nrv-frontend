import { Mail } from "lucide-react";
import AccountTypeBadge from "./AccountTypeBadge";

export type SignupStepId =
  | "select_type"
  | "create_account"
  | "verify"
  | "business_profile"
  | "add_property"
  | "property_prefs";

type StepStatus = "complete" | "current" | "upcoming";

type Step = {
  id: SignupStepId;
  title: string;
  description: string;
};

const COPYRIGHT = "© 2026 Naija Rent Verify";

const getSteps = (accountType?: string | null): Step[] => {
  const role = String(accountType || "").toLowerCase();
  if (role === "shortlet_manager") {
    return [
      {
        id: "select_type",
        title: "Select User Type",
        description: "Shortlet Manager selected.",
      },
      {
        id: "create_account",
        title: "Create Your Account",
        description: "Set up your NRV Shortlet Manager account.",
      },
      {
        id: "verify",
        title: "Verify Email or Phone",
        description: "Verify your contact information to activate your account.",
      },
      {
        id: "business_profile",
        title: "Business profile",
        description:
          "Add your business details and NIN. NRV reviews this before complimentary guest-check credits are added.",
      },
    ];
  }
  if (role === "landlord") {
    return [
      {
        id: "select_type",
        title: "Select User Type",
        description: "Landlord selected.",
      },
      {
        id: "create_account",
        title: "Create Your Account",
        description: "Register with your name, email, and password.",
      },
      {
        id: "verify",
        title: "Verify Email or Phone",
        description: "Confirm your contact details to secure your account.",
      },
      {
        id: "add_property",
        title: "Add Your Property",
        description:
          "Help us personalize your experience by providing a few details about your property.",
      },
      {
        id: "property_prefs",
        title: "Set Up Your Property Preferences (Optional)",
        description:
          "Tell us more about your property to get personalized recommendations.",
      },
    ];
  }
  if (role === "tenant") {
    return [
      {
        id: "select_type",
        title: "Select User Type",
        description: "Tenant selected.",
      },
      {
        id: "create_account",
        title: "Create Your Account",
        description: "Create your NaijaRentVerify account.",
      },
      {
        id: "verify",
        title: "Verify Email or Phone",
        description: "Verify your contact information to activate your account.",
      },
    ];
  }
  return [
    {
      id: "select_type",
      title: "Select User Type",
      description: "Choose whether you are signing up as a landlord or tenant.",
    },
    {
      id: "create_account",
      title: "Create Your Account",
      description: "Create your NaijaRentVerify account.",
    },
    {
      id: "verify",
      title: "Verify Email or Phone",
      description: "Verify your contact information to activate your account.",
    },
  ];
};

const CompletedIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect width="32" height="32" rx="16" fill="white" />
    <rect x="1" y="1" width="30" height="30" rx="15" stroke="#045D23" strokeWidth="2" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M22.7953 9.85322L13.2487 19.0666L10.7153 16.3599C10.2487 15.9199 9.51534 15.8932 8.982 16.2666C8.462 16.6532 8.31534 17.3332 8.63534 17.8799L11.6353 22.7599C11.9287 23.2132 12.4353 23.4932 13.0087 23.4932C13.5553 23.2132 14.0753 23.2132 14.3687 22.7599C14.8487 22.1332 24.0087 11.2132 24.0087 11.2132C25.2087 9.98655 23.7553 8.90655 22.7953 9.83989V9.85322Z"
      fill="#045D23"
    />
  </svg>
);

const ActiveIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect width="32" height="32" rx="16" fill="white" />
    <rect x="1" y="1" width="30" height="30" rx="15" stroke="#045D23" strokeWidth="2" />
    <circle cx="16" cy="16" r="5" fill="#045D23" />
  </svg>
);

const UpcomingIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect width="32" height="32" rx="16" fill="#F7F7F8" />
    <rect x="1" y="1" width="30" height="30" rx="15" stroke="#E0E0E6" strokeWidth="2" />
    <circle cx="16" cy="16" r="5" fill="#E0E0E6" />
  </svg>
);

const statusFor = (steps: Step[], current: SignupStepId, id: SignupStepId): StepStatus => {
  const currentIndex = steps.findIndex((step) => step.id === current);
  const index = steps.findIndex((step) => step.id === id);
  if (index < 0) {
    return "upcoming";
  }
  if (currentIndex < 0) {
    return index === 0 ? "current" : "upcoming";
  }
  if (index < currentIndex) {
    return "complete";
  }
  if (index === currentIndex) {
    return "current";
  }
  return "upcoming";
};

export default function SignupProgressRail({
  accountType,
  current,
}: {
  accountType?: string | null;
  current: SignupStepId;
}) {
  const steps = getSteps(accountType);

  return (
    <div className="flex h-screen w-full flex-col justify-between p-4 sm:p-8">
      <div>
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-2xl font-bold text-black">NaijaRentVerify</h1>
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <a href="/sign-in" className="font-semibold text-green-900">
              Log in here.
            </a>
          </p>
        </div>
        <div className="px-6">
          <AccountTypeBadge accountType={accountType} />
        </div>
        <ol className="mt-8 space-y-12 px-6">
          {steps.map((step) => {
            const status = statusFor(steps, current, step.id);
            return (
              <li key={step.id} className="flex items-start space-x-2">
                <span className="mt-0.5 shrink-0">
                  {status === "complete" ? (
                    <CompletedIcon />
                  ) : status === "current" ? (
                    <ActiveIcon />
                  ) : (
                    <UpcomingIcon />
                  )}
                </span>
                <div>
                  <h3
                    className={`font-medium ${
                      status === "upcoming" ? "text-gray-400" : "text-[#645D5D]"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <footer className="flex justify-between items-center px-6 py-4 text-green-900 text-sm">
        <p>{COPYRIGHT}</p>
        <div className="flex items-center gap-2">
          <Mail size={16} />
          <a href="mailto:info@naijarentverify.com" className="hover:underline">
            info@naijarentverify.com
          </a>
        </div>
      </footer>
    </div>
  );
}
