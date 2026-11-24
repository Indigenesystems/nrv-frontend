import SignupProgressRail from "./SignupProgressRail";

const AccountSideBar = ({ accountType }: { accountType?: string | null }) => (
  <SignupProgressRail accountType={accountType} current="create_account" />
);

export default AccountSideBar;
