import SignupProgressRail from "./SignupProgressRail";

const CompleteProfileSideBar = ({
  accountType,
}: {
  accountType?: string | null;
}) => (
  <SignupProgressRail
    accountType={accountType}
    current={
      String(accountType || "").toLowerCase() === "shortlet_manager"
        ? "business_profile"
        : "add_property"
    }
  />
);

export default CompleteProfileSideBar;
