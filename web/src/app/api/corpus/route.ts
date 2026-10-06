import { NextRequest, NextResponse } from "next/server";
import { requireViewer } from "@/lib/data";
import { embedTexts } from "@/lib/rag";
import { z } from "zod";

const schema = z
  .array(
    z
      .object({
        document_name: z.string().min(1).max(200),
        document_version: z.string().min(1).max(100),
        locator: z.string().min(1).max(250),
        content: z.string().min(1).max(12000),
        source_kind: z.enum([
          "official",
          "translation",
          "summary",
          "unclassified",
        ]),
      })
      .strict(),
  )
  .min(1)
  .max(2);

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { db } = await requireViewer(["administrator"]);
  if (Number(request.headers.get("content-length")) > 40000)
    return NextResponse.json({ error: "Too large" }, { status: 413 });
  let items;
  try {
    const body = await request.text();
    if (body.length > 40000) throw new Error();
    items = schema.parse(JSON.parse(body));
  } catch {
    return NextResponse.json(
      { error: "Invalid corpus batch" },
      { status: 400 },
    );
  }
  try {
    const vectors = await embedTexts(
      items.map((item) => item.content),
      "passage",
    );
    const { data, error } = await db.rpc("import_evidence", {
      items: items.map((item, i) => ({ ...item, embedding: vectors[i] })),
    });
    if (error) throw error;
    return NextResponse.json(
      { imported: data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Import failed; this batch can be retried" },
      { status: 503 },
    );
  }
}
