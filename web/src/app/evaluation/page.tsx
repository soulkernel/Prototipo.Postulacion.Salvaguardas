import { redirect } from "next/navigation";
// Old bookmarked links go through the normal, role-protected entry point.
export default function RetiredEntry() {
  redirect("/");
}
