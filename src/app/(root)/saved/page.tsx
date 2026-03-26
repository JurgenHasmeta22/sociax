import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import { fetchSavedPosts } from "@/actions/post.actions";
import { PostCard } from "@/components/feed/PostCard";

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

			{posts.length === 0 ? (
				<div className="text-center py-16 text-muted-foreground">
					<Bookmark className="h-10 w-10 mx-auto mb-3 opacity-30" />
					<p className="text-lg font-medium">No saved posts</p>
					<p className="text-sm mt-1">
						Posts you save will appear here.
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{posts.map((post) => (
						<PostCard key={post.id} post={post} currentUserId={userId} />
					))}
				</div>
			)}
		</div>
	);
}
