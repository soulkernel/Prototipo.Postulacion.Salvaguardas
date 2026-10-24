import { AuthForm } from "@/components/auth-form";
import { getLocale } from "@/lib/locale";
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  return (
    <AuthForm locale={await getLocale()} register params={await searchParams} />
  );
}
