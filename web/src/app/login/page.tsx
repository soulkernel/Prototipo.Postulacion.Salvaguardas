import { AuthForm } from "@/components/auth-form";
import { getLocale } from "@/lib/locale";
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
  return <AuthForm locale={await getLocale()} params={await searchParams} />;
}
