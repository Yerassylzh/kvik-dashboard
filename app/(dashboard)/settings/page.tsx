import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function SettingsIndexPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("kvik_role")?.value;

  if (role === "SPECIALIST") {
    redirect("/settings/account");
  }

  redirect("/settings/workspace");
}
