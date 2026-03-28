import { getHashtagPosts, getHashtagEvents, getHashtagBlogs, getHashtagVideos, getHashtagStats } from "@/actions/hashtag.actions";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Hash, FileText, CalendarDays, BookOpen, Video, Heart } from "lucide-react";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }) {
	const { tag } = await params;
	return { title: `#${tag} · Sociax` };
}

export default async function HashtagPage({ params, searchParams }: {
	params: Promise<{ tag: string }>;
	searchParams: Promise<{ tab?: string }>;
}) {
	const { tag } = await params;
	const { tab = "posts" } = await searchParams;

	const [stats, posts, events, blogs, videos] = await Promise.all([
		getHashtagStats(tag),
		tab === "posts" || tab === "all" ? getHashtagPosts(tag) : Promise.resolve([]),
		tab === "events" || tab === "all" ? getHashtagEvents(tag) : Promise.resolve([]),
		tab === "blogs" || tab === "all" ? getHashtagBlogs(tag) : Promise.resolve([]),
		tab === "videos" || tab === "all" ? getHashtagVideos(tag) : Promise.resolve([]),
	]);

	const tabs = [
		{ id: "posts", label: "Posts", icon: FileText, count: stats?.postCount ?? 0 },
		{ id: "events", label: "Events", icon: CalendarDays, count: stats?.eventCount ?? 0 },
		{ id: "blogs", label: "Blogs", icon: BookOpen, count: stats?.blogCount ?? 0 },
		{ id: "videos", label: "Videos", icon: Video, count: stats?.videoCount ?? 0 },
	];

	return (
		<div className="max-w-2xl mx-auto px-4 py-8">
			{/* Header */}
			<div className="flex items-center gap-3 mb-6">
				<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
					<Hash className="h-6 w-6 text-primary" />
				</div>
				<div>
					<h1 className="text-2xl font-bold">#{tag}</h1>
					<p className="text-sm text-muted-foreground">
						{stats ? `${stats.total.toLocaleString()} items` : "No results yet"}
					</p>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex gap-1 border-b mb-6 overflow-x-auto">
				{tabs.map(({ id, label, icon: Icon, count }) => (
					<Link
						key={id}
						href={`/hashtags/${tag}?tab=${id}`}
						className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
							tab === id
								? "border-primary text-primary"
								: "border-transparent text-muted-foreground hover:text-foreground"
						}`}
					>
						<Icon className="h-4 w-4" />
						{label}
						{count > 0 && (
							<span className="ml-1 text-xs bg-muted rounded-full px-1.5 py-0.5">
								{count}
							</span>
						)}
					</Link>
				))}
			</div>

			{/* Posts Tab */}
			{tab === "posts" && (
				<div className="space-y-4">
					{posts.length === 0 ? (
						<EmptyState label="No posts with this tag yet" />
					) : (
						posts.map((post) => {
							const name = [post.user.firstName, post.user.lastName].filter(Boolean).join(" ") || post.user.userName;
							return (
								<Card key={post.id} className="overflow-hidden">
									<CardContent className="p-4">
										<div className="flex items-center gap-2 mb-3">
											<Link href={`/profile/${post.user.userName}`}>
												<Avatar className="h-9 w-9">
													<AvatarImage src={post.user.avatar?.photoSrc ?? undefined} />
													<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
														{name[0]?.toUpperCase()}
													</AvatarFallback>
												</Avatar>
											</Link>
											<div>
												<Link href={`/profile/${post.user.userName}`} className="font-semibold text-sm hover:underline">
													{name}
												</Link>
												<p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
											</div>
										</div>
										{post.content && (
											<p className="text-sm leading-relaxed mb-2">
												{post.content.split(/(#[\w]+)/g).map((part, i) =>
													/^#[\w]+$/.test(part) ? (
														<Link key={i} href={`/hashtags/${part.slice(1).toLowerCase()}`} className="text-primary hover:underline font-medium">{part}</Link>
													) : <span key={i}>{part}</span>
												)}
											</p>
										)}
										{post.media.length > 0 && post.media[0].type === "Image" && (
											<div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted mt-2">
												<Image src={post.media[0].url} alt="Post media" fill className="object-cover" />
											</div>
										)}
										<p className="text-xs text-muted-foreground mt-2">
											{post._count.likes} likes · {post._count.comments} comments
										</p>
									</CardContent>
								</Card>
							);
						})
					)}
				</div>
			)}

			{/* Events Tab */}
			{tab === "events" && (
				<div className="space-y-4">
					{events.length === 0 ? (
						<EmptyState label="No events with this tag yet" />
					) : (
						events.map((event) => {
							const name = [event.creator.firstName, event.creator.lastName].filter(Boolean).join(" ") || event.creator.userName;
							return (
								<Link key={event.id} href={`/events/${event.slug}`}>
									<Card className="hover:shadow-md transition-shadow">
										<CardContent className="p-4">
											<div className="flex gap-3">
												{event.coverUrl && (
													<div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-muted">
														<Image src={event.coverUrl} alt={event.title} fill className="object-cover" />
													</div>
												)}
												<div className="flex-1 min-w-0">
													<h3 className="font-semibold text-sm line-clamp-2">{event.title}</h3>
													<p className="text-xs text-muted-foreground mt-0.5">{format(new Date(event.startDate), "PPP")}</p>
													<p className="text-xs text-muted-foreground mt-0.5">by {name} · {event._count.attendees} attending</p>
												</div>
											</div>
										</CardContent>
									</Card>
								</Link>
							);
						})
					)}
				</div>
			)}

			{/* Blogs Tab */}
			{tab === "blogs" && (
				<div className="space-y-4">
					{blogs.length === 0 ? (
						<EmptyState label="No blogs with this tag yet" />
					) : (
						blogs.map((blog) => {
							const name = [blog.author.firstName, blog.author.lastName].filter(Boolean).join(" ") || blog.author.userName;
							return (
								<Link key={blog.id} href={`/blog/${blog.slug}`}>
									<Card className="hover:shadow-md transition-shadow">
										<CardContent className="p-4">
											<div className="flex gap-3">
												{blog.coverImageUrl && (
													<div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-muted">
														<Image src={blog.coverImageUrl} alt={blog.title} fill className="object-cover" />
													</div>
												)}
												<div className="flex-1 min-w-0">
													<h3 className="font-semibold text-sm line-clamp-2">{blog.title}</h3>
													{blog.excerpt && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{blog.excerpt}</p>}
													<p className="text-xs text-muted-foreground mt-1">by {name} · <Heart className="inline h-3 w-3" /> {blog._count.likes}</p>
												</div>
											</div>
										</CardContent>
									</Card>
								</Link>
							);
						})
					)}
				</div>
			)}

			{/* Videos Tab */}
			{tab === "videos" && (
				<div className="grid grid-cols-2 gap-3">
					{videos.length === 0 ? (
						<div className="col-span-2"><EmptyState label="No videos with this tag yet" /></div>
					) : (
						videos.map((video) => (
							<Link key={video.id} href={`/videos?v=${video.id}`}>
								<Card className="overflow-hidden hover:shadow-md transition-shadow">
									<div className="relative aspect-video bg-muted">
										{video.thumbnailUrl ? (
											<Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" />
										) : (
											<div className="absolute inset-0 flex items-center justify-center">
												<Video className="h-8 w-8 text-muted-foreground" />
											</div>
										)}
									</div>
									<CardContent className="p-2">
										<p className="text-xs font-medium line-clamp-2">{video.title}</p>
									</CardContent>
								</Card>
							</Link>
						))
					)}
				</div>
			)}
		</div>
	);
}

function EmptyState({ label }: { label: string }) {
	return (
		<div className="text-center py-16 text-muted-foreground">
			<Hash className="h-10 w-10 mx-auto mb-3 opacity-30" />
			<p className="font-medium">{label}</p>
		</div>
	);
}
