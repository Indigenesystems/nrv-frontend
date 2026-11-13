import { redirect } from "next/navigation";

export default function NewGuestVerificationRedirect() {
  redirect("/dashboard/manager/requests");
}
