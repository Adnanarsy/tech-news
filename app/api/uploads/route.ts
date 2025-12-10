import { NextRequest, NextResponse } from "next/server";
import { uploadBuffer } from "@/lib/azure/blob";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs"; // ensure Node APIs available for Buffer

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const folder = (form.get("folder") as string) || "uploads";
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const filename = `${uuidv4()}.${ext || "bin"}`;
    const path = `${folder}/${filename}`;
    const url = await uploadBuffer(path, buf, file.type || undefined);
    return NextResponse.json({ url, path });
  } catch (err: any) {
    console.error("Upload error", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
