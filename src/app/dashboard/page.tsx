import { redirect } from "next/navigation";

/** The dashboard was a stat screen; "Hoy" replaced it. */
export default function DashboardPage() {
  redirect("/");
}
