import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import { fetchSavedPosts } from "@/actions/post.actions";
import { SavedPostsClient } from "@/components/feed/SavedPostsClient";

export const metadata = { title: "Saved Posts · Sociax" };

export default async function SavedPage() {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");
	const userId = parseInt(session.user.id);

	const posts = await fetchSavedPosts(0);

	return (
		<div className="max-w-[600px] mx-auto py-6 px-3 space-y-4">
			<div className="flex items-center gap-2 mb-2">
				<Bookmark className="h-5 w-5 text-primary" />
				<h1 className="text-xl font-bold">Saved Posts</h1>
			</div>

			<SavedPostsClient initialPosts={posts} currentUserId={userId} />
		</div>
	);
}
