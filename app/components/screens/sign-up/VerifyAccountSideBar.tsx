import SignupProgressRail from "./SignupProgressRail";

const VerifyAccountSideBar = ({
  accountType,
}: {
  accountType?: string | null;
}) => <SignupProgressRail accountType={accountType} current="verify" />;

export default VerifyAccountSideBar;
