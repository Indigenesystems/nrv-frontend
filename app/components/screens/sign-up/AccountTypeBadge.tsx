type AccountTypeBadgeProps = {
  accountType?: string | null;
  className?: string;
};

const formatAccountType = (accountType?: string | null): string | null => {
  if (!accountType) {
    return null;
  }
  if (accountType === "landlord") {
    return "Property Owner / Landlord";
  }
  if (accountType === "tenant") {
    return "Tenant";
  }
  if (accountType === "shortlet_manager") {
    return "Shortlet Manager";
  }
  return accountType;
};

const AccountTypeBadge = ({
  accountType,
  className = "",
}: AccountTypeBadgeProps) => {
  const label = formatAccountType(accountType);
  if (!label) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border border-[#03442C]/20 bg-[#03442C]/[0.08] px-3 py-1 text-xs font-medium text-[#03442C] ${className}`}
      aria-label={`Account type: ${label}`}
    >
      Account type: {label}
    </div>
  );
};

export default AccountTypeBadge;
