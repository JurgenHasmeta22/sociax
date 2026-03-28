import { getAllBlogs } from "@/actions/blog.actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, PenLine } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { BlogListClient } from "@/components/feed/BlogListClient";

export const metadata = { title: "Blog · Sociax" };

export default async function BlogListPage() {
	const [session, result] = await Promise.all([
		getServerSession(authOptions),
		getAllBlogs(),
	]);

	return (
		<div className="max-w-3xl mx-auto px-4 py-8">
			{/* Header */}
			<div className="flex items-center justify-between mb-8">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center">
						<BookOpen className="h-5 w-5 text-sky-500" />
					</div>
					<h1 className="text-2xl font-bold">Blog</h1>
				</div>
				{session && (
					<Button asChild className="gap-2">
						<Link href="/blog/new">
							<PenLine className="h-4 w-4" />
							Write
						</Link>
					</Button>
				)}
			</div>

			<BlogListClient
				initialBlogs={result.blogs as never[]}
				initialHasMore={result.hasMore}
				isLoggedIn={!!session}
			/>
		</div>
	);
}
