import { AuthForm } from "@/components/auth-form";
import { getLocale } from "@/lib/locale";
import { getViewer } from "@/lib/data";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    next?: string;
    reset?: string;
    updated?: string;
    sent?: string;
    confirmation?: string;
  }>;
}) {
  const viewer = await getViewer();
  if (viewer)
    redirect(viewer.profile.role === "applicant" ? "/applicant" : "/internal");
  const email = z
    .email()
    .max(254)
    .safeParse((await cookies()).get("glf_last_email")?.value);
  return (
    <AuthForm
      locale={await getLocale()}
      params={await searchParams}
      lastEmail={email.success ? email.data : ""}
    />
  );
}
