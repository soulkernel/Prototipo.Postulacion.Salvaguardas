import { redirect } from "next/navigation";
import { getViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { AuthForm } from "@/components/auth-form";
export default async function Home() {
  const viewer = await getViewer();
  if (viewer)
    redirect(viewer.profile.role === "applicant" ? "/applicant" : "/internal");
  return <AuthForm locale={await getLocale()} params={{}} />;
}
