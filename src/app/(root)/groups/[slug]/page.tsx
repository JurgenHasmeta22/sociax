import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Globe, Lock, Users, Shield } from "lucide-react";
import { GroupJoinButton } from "@/components/groups/GroupJoinButton";
import { GroupFeed } from "@/components/groups/GroupFeed";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const group = await prisma.group.findUnique({ where: { slug } });
	return { title: group ? `${group.name} · Sociax` : "Group not found" };
}

export default async function GroupDetailPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const session = await getServerSession(authOptions);
	const userId = session ? parseInt(session.user.id) : null;

	const group = await prisma.group.findUnique({
		where: { slug },
		include: {
			owner: { include: { avatar: true } },
			_count: { select: { members: true, posts: true } },
			members: userId
				? {
						where: { userId },
						select: { status: true, role: true },
					}
				: false,
		},
	});

	if (!group) notFound();

	const myMembership = Array.isArray(group.members)
		? (group.members[0] ?? null)
		: null;
	const isApproved = myMembership?.status === "Approved";
	const isPrivate = group.privacy !== "Public";
	const canView = isApproved || !isPrivate;

	const posts = canView
		? await prisma.groupPost.findMany({
				where: { groupId: group.id, isDeleted: false },
				orderBy: { createdAt: "desc" },
				take: 20,
				include: {
					user: { include: { avatar: true } },
					likes: {
						select: { id: true, userId: true, reactionType: true },
					},
					_count: { select: { comments: true } },
				},
			})
		: [];

	const members = await prisma.groupMember.findMany({
		where: { groupId: group.id, status: "Approved" },
		take: 9,
		include: { user: { include: { avatar: true } } },
	});

	const ownerName =
		[group.owner.firstName, group.owner.lastName]
			.filter(Boolean)
			.join(" ") || group.owner.userName;

	const PrivacyIcon = group.privacy === "Public" ? Globe : Lock;

	return (
		<div className="max-w-5xl mx-auto px-4 py-6">
			<div className="relative rounded-xl overflow-hidden bg-muted mb-6 h-52 md:h-72">
				{group.coverUrl ? (
					<Image
						src={group.coverUrl}
						alt={group.name}
						fill
						className="object-cover"
						sizes="900px"
					/>
				) : (
					<div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center">
						<Users className="h-20 w-20 text-primary/30" />
					</div>
				)}
			</div>

			<div className="flex flex-col md:flex-row md:items-end gap-4 mb-6 -mt-2">
				<div className="flex-1">
					<div className="flex items-center gap-2 flex-wrap">
						<h1 className="text-2xl font-bold">{group.name}</h1>
						<Badge variant="secondary" className="gap-1">
							<PrivacyIcon className="h-3 w-3" />
							{group.privacy}
						</Badge>
					</div>
					<div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
						<span className="flex items-center gap-1">
							<Users className="h-3.5 w-3.5" />
							{group._count.members.toLocaleString()} members
						</span>
						<span>{group._count.posts} posts</span>
						<span className="flex items-center gap-1">
							<Shield className="h-3.5 w-3.5" />
							Admin:{" "}
							<Link
								href={`/profile/${group.owner.userName}`}
								className="font-medium text-foreground hover:underline"
							>
								{ownerName}
							</Link>
						</span>
					</div>
					{group.description && (
						<p className="text-sm text-muted-foreground mt-2 max-w-xl">
							{group.description}
						</p>
					)}
				</div>
				<div className="w-full md:w-44">
					<GroupJoinButton
						groupId={group.id}
						initialState={
							(myMembership?.status as
								| "none"
								| "Pending"
								| "Approved"
								| "Banned") ?? "none"
						}
						privacy={group.privacy}
					/>
				</div>
			</div>

			<Separator className="mb-6" />

			<div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
				<div>
					{!canView ? (
						<div className="text-center py-20 border border-dashed rounded-xl text-muted-foreground">
							<Lock className="h-10 w-10 mx-auto mb-3 opacity-40" />
							<p className="font-semibold text-base">
								This is a private group
							</p>
							<p className="text-sm mt-1">
								Join the group to see posts and members.
							</p>
						</div>
					) : (
						<GroupFeed
							posts={posts}
							groupId={group.id}
							currentUserId={userId}
							isMember={isApproved}
						/>
					)}
				</div>

				<aside className="space-y-5">
					<div className="border rounded-xl p-4">
						<h3 className="font-semibold text-sm mb-3">Members</h3>
						<div className="grid grid-cols-3 gap-2">
							{members.map(({ user }) => {
								const n =
									[user.firstName, user.lastName]
										.filter(Boolean)
										.join(" ") || user.userName;
								return (
									<Link
										key={user.id}
										href={`/profile/${user.userName}`}
										className="flex flex-col items-center gap-1 group"
									>
										<Avatar className="h-10 w-10">
											<AvatarImage
												src={
													user.avatar?.photoSrc ??
													undefined
												}
											/>
											<AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
												{n[0]?.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<span className="text-[10px] text-center leading-tight text-muted-foreground group-hover:text-foreground truncate w-full text-center">
											{n.split(" ")[0]}
										</span>
									</Link>
								);
							})}
						</div>
						{group._count.members > 9 && (
							<p className="text-xs text-muted-foreground mt-3 text-center">
								+{(group._count.members - 9).toLocaleString()}{" "}
								more members
							</p>
						)}
					</div>
				</aside>
			</div>
		</div>
	);
}
