import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/data";
import { z } from "zod";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return new NextResponse("Not found", { status: 404 });
  const viewer = await getViewer();
  if (!viewer)
    return NextResponse.redirect(
      new URL("/login?next=" + encodeURIComponent("/files/" + id), request.url),
    );
  const { data: doc } = await viewer.db
    .from("application_documents")
    .select("storage_path,file_name")
    .eq("id", id)
    .maybeSingle();
  if (!doc) return new NextResponse("Not found", { status: 404 });
  const { data, error } = await viewer.db.storage
    .from("application-files")
    .createSignedUrl(doc.storage_path, 60, { download: doc.file_name });
  if (error || !data) return new NextResponse("Unavailable", { status: 404 });
  const response = NextResponse.redirect(data.signedUrl);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
