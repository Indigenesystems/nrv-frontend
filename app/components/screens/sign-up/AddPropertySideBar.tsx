import SignupProgressRail from "./SignupProgressRail";

const AddPropertySideBar = ({
  accountType,
}: {
  accountType?: string | null;
}) => <SignupProgressRail accountType={accountType} current="add_property" />;

export default AddPropertySideBar;
