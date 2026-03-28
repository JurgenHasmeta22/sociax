import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getVideos } from "@/actions/video.actions";
import { VideoCard } from "@/components/feed/VideoCard";
import { VideosPageClient } from "@/components/feed/VideosPageClient";

export const metadata = { title: "Videos · Sociax" };

export default async function VideosPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");

	const { filter = "all" } = await searchParams;
	const currentUserId = parseInt(session.user.id);

	const validFilter = (["all", "mine", "friends"] as const).includes(filter as "all" | "mine" | "friends")
		? (filter as "all" | "mine" | "friends")
		: "all";

	const videos = await getVideos({ filter: validFilter });

	return (
		<VideosPageClient
			initialVideos={videos}
			currentFilter={validFilter}
			currentUserId={currentUserId}
		/>
	);
}
