import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const ALLOWED_TYPES: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/gif": "gif",
	"image/webp": "webp",
	"video/mp4": "mp4",
	"video/webm": "webm",
	"application/pdf": "pdf",
	"application/msword": "doc",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		"docx",
	"application/vnd.ms-excel": "xls",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
	"text/plain": "txt",
};

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const formData = await req.formData();
	const file = formData.get("file");

	if (!file || typeof file === "string") {
		return NextResponse.json(
			{ error: "No file provided" },
			{ status: 400 },
		);
	}

	const typedFile = file as File;
	const ext = ALLOWED_TYPES[typedFile.type];

	if (!ext) {
		return NextResponse.json(
			{ error: "File type not allowed" },
			{ status: 400 },
		);
	}

	if (typedFile.size > MAX_SIZE) {
		return NextResponse.json(
			{ error: "File too large. Max 25MB." },
			{ status: 400 },
		);
	}

	const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
	const uploadDir = join(process.cwd(), "public", "uploads");
	const filePath = join(uploadDir, filename);

	const bytes = await typedFile.arrayBuffer();
	await writeFile(filePath, Buffer.from(bytes));

	return NextResponse.json({
		url: `/uploads/${filename}`,
		name: typedFile.name,
	});
}
