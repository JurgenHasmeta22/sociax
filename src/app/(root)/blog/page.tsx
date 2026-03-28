import { getAllBlogs } from "@/actions/blog.actions";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Heart, PenLine } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const metadata = { title: "Blog · Sociax" };

export default async function BlogListPage() {
	const [session, blogs] = await Promise.all([
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

			{/* Blog list */}
			{blogs.length === 0 ? (
				<div className="text-center py-20 text-muted-foreground">
					<BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
					<p className="font-semibold text-lg">No blogs published yet</p>
					{session && (
						<Button asChild className="mt-4 gap-2">
							<Link href="/blog/new">
								<PenLine className="h-4 w-4" />
								Write the first one
							</Link>
						</Button>
					)}
				</div>
			) : (
				<div className="space-y-6">
					{blogs.map((blog) => {
						const authorName =
							[blog.author.firstName, blog.author.lastName].filter(Boolean).join(" ") ||
							blog.author.userName;
						return (
							<Card key={blog.id} className="overflow-hidden hover:shadow-md transition-shadow">
								<Link href={`/blog/${blog.slug}`}>
									<div className="flex gap-0 flex-col sm:flex-row">
										{blog.coverImageUrl && (
											<div className="relative sm:w-48 w-full h-40 sm:h-auto shrink-0 bg-muted">
												<Image
													src={blog.coverImageUrl}
													alt={blog.title}
													fill
													className="object-cover"
												/>
											</div>
										)}
										<CardContent className="p-4 flex-1">
											<div className="flex items-center gap-2 mb-2">
												<Avatar className="h-6 w-6">
													<AvatarImage src={blog.author.avatar?.photoSrc ?? undefined} />
													<AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
														{authorName[0]?.toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<span className="text-xs text-muted-foreground font-medium">{authorName}</span>
												<span className="text-xs text-muted-foreground ml-auto">
													{formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}
												</span>
											</div>
											<h2 className="font-semibold text-base line-clamp-2 leading-snug">{blog.title}</h2>
											{blog.excerpt && (
												<p className="text-sm text-muted-foreground line-clamp-2 mt-1">{blog.excerpt}</p>
											)}
											{blog.hashtags.length > 0 && (
												<div className="flex flex-wrap gap-1 mt-2">
													{blog.hashtags.slice(0, 4).map(({ hashtag }) => (
														<Badge key={hashtag.id} variant="secondary" className="text-xs font-normal">
															#{hashtag.name}
														</Badge>
													))}
												</div>
											)}
											<div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
												<Heart className="h-3.5 w-3.5" />
												{blog._count.likes}
											</div>
										</CardContent>
									</div>
								</Link>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}
