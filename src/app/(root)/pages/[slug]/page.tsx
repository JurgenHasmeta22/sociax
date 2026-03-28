import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageFeed } from "@/components/pages/PageFeed";
import { PageFollowButton } from "@/components/pages/PageFollowButton";
import { PageFollowersModal } from "@/components/pages/PageFollowersModal";
import { Crown, Flag, Globe, Settings } from "lucide-react";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
	const { slug } = await params;
	const page = await prisma.page.findUnique({
		where: { slug },
		select: { name: true },
	});
	return { title: page ? `${page.name} · Sociax` : "Page · Sociax" };
}

export default async function PageDetailPage({ params }: PageProps) {
	const { slug } = await params;
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");

	const userId = parseInt(session.user.id);

	const [currentUser, page] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			include: {
				avatar: true,
				_count: {
					select: { followers: true, following: true, posts: true },
				},
			},
		}),
		prisma.page.findUnique({
			where: { slug },
			include: {
				owner: {
					select: {
						id: true,
						userName: true,
						firstName: true,
						lastName: true,
						avatar: { select: { photoSrc: true } },
					},
				},
				followers: { where: { userId }, select: { id: true } },
				_count: { select: { followers: true, posts: true } },
				posts: {
					where: { isDeleted: false },
					orderBy: { createdAt: "desc" },
					take: 20,
					include: {
						user: {
							select: {
								id: true,
								userName: true,
								firstName: true,
								lastName: true,
								avatar: { select: { photoSrc: true } },
							},
						},
						likes: { select: { userId: true, reactionType: true } },
						_count: { select: { likes: true, comments: true } },
					},
				},
			},
		}),
	]);

	if (!page || !currentUser) notFound();

	const isFollowing = page.followers.length > 0;
	const isOwner = page.ownerId === userId;

	const ownerName =
		[page.owner.firstName, page.owner.lastName].filter(Boolean).join(" ") ||
		page.owner.userName;

	return (
		<div className="bg-muted/20 min-h-[calc(100vh-56px)]">
			<div className="relative h-48 md:h-64 bg-muted overflow-hidden">
				{page.coverUrl ? (
					<Image
						src={page.coverUrl}
						alt=""
						fill
						className="object-cover"
						sizes="100vw"
						priority
					/>
				) : (
					<div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10" />
				)}
			</div>

			<div className="max-w-4xl mx-auto px-4">
				<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-4">
					<div className="flex items-end gap-4">
						<div className="w-24 h-24 rounded-xl ring-4 ring-background bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
							{page.avatarUrl ? (
								<img
									src={page.avatarUrl}
									alt=""
									className="w-full h-full object-cover"
								/>
							) : (
								<Flag className="h-10 w-10 text-primary" />
							)}
						</div>
						<div className="pb-1">
							<h1 className="text-2xl font-bold leading-tight">
								{page.name}
							</h1>
							<div className="flex items-center gap-2 mt-0.5">
								<Badge variant="secondary">
									{page.category}
								</Badge>
								<PageFollowersModal
									pageId={page.id}
									followerCount={page._count.followers}
								/>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2 pb-1">
						{isOwner ? (
							<div className="flex items-center gap-2">
								<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
									<Crown className="h-4 w-4" />
									You manage this page
								</div>
							</div>
						) : (
							<PageFollowButton
								pageId={page.id}
								initialFollowing={isFollowing}
							/>
						)}
					</div>
				</div>

				{page.description && (
					<p className="text-sm text-muted-foreground mb-3">
						{page.description}
					</p>
				)}

				{page.website && (
					<a
						href={page.website}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-4"
					>
						<Globe className="h-3.5 w-3.5" />
						{page.website.replace(/^https?:\/\//, "")}
					</a>
				)}

				<div className="text-xs text-muted-foreground mb-6">
					Managed by{" "}
					<Link
						href={`/profile/${page.owner.userName}`}
						className="font-medium text-foreground hover:underline"
					>
						{ownerName}
					</Link>
				</div>

				<PageFeed
					posts={page.posts}
					pageId={page.id}
					pageSlug={slug}
					currentUser={currentUser}
					isOwner={isOwner}
				/>
			</div>
		</div>
	);
}
