import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
	const session = await getServerSession(authOptions);

	if (!session) {
		return new Response("Unauthorized", { status: 401 });
	}

	const userId = parseInt(session.user.id);

	const encoder = new TextEncoder();
	let intervalId: ReturnType<typeof setInterval> | null = null;

	const stream = new ReadableStream({
		async start(controller) {
			const sendCount = async () => {
				try {
					const count = await prisma.notification.count({
						where: { userId, status: "unread" },
					});
					controller.enqueue(
						encoder.encode(
							`data: ${JSON.stringify({ count })}\n\n`,
						),
					);
				} catch {
					controller.close();
				}
			};

			// Send initial count immediately
			await sendCount();

			// Poll every 15 seconds
			intervalId = setInterval(sendCount, 15000);
		},
		cancel() {
			if (intervalId) clearInterval(intervalId);
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
			"X-Accel-Buffering": "no",
		},
	});
}
