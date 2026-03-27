import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const ALLOWED_IMAGE_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

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
	const mimeType = typedFile.type;

	if (!ALLOWED_TYPES.includes(mimeType)) {
		return NextResponse.json(
			{ error: "File type not allowed" },
			{ status: 400 },
		);
	}

	const isVideo = ALLOWED_VIDEO_TYPES.includes(mimeType);
	const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

	if (typedFile.size > maxSize) {
		return NextResponse.json(
			{ error: `File too large. Max ${isVideo ? "50MB" : "10MB"}.` },
			{ status: 400 },
		);
	}

	const ext = mimeType.split("/")[1].replace("jpeg", "jpg");
	const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
	const uploadDir = join(process.cwd(), "public", "uploads");
	const filePath = join(uploadDir, filename);

	const bytes = await typedFile.arrayBuffer();
	await writeFile(filePath, Buffer.from(bytes));

	return NextResponse.json({ url: `/uploads/${filename}` });
}
