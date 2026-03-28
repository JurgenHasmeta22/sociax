"use client";

import Image from "next/image";
import Link from "next/link";
import { Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupJoinButton } from "@/components/groups/GroupJoinButton";
import { formatCount } from "@/lib/utils";

type Group = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	coverUrl: string | null;
	avatarUrl: string | null;
	privacy: string;
	owner: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
	_count: { members: number; posts: number };
};

const CATEGORY_COLORS: Record<string, string> = {
	Shopping: "from-gray-800 to-gray-600",
	Health: "from-red-500 to-red-700",
	Science: "from-yellow-400 to-yellow-600",
	Travel: "from-green-600 to-green-800",
	Business: "from-sky-400 to-sky-600",
	Technology: "from-blue-500 to-blue-700",
	Arts: "from-purple-500 to-purple-700",
	Sports: "from-orange-500 to-orange-700",
};

const STATIC_CATEGORIES = [
	"Shopping",
	"Health",
	"Science",
	"Travel",
	"Business",
	"Technology",
	"Arts",
	"Sports",
];

export function GroupCategoriesClient({
	groups,
	membershipMap,
	isLoggedIn,
	selectedCategory,
}: {
	groups: Group[];
	membershipMap: Record<number, string>;
	isLoggedIn: boolean;
	selectedCategory: string | null;
}) {
	return (
		<div className="max-w-5xl mx-auto px-4 py-6">
			{/* Header */}
			<div className="flex items-center gap-3 mb-6">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/groups">
						<ArrowLeft className="h-5 w-5" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-bold">Group Categories</h1>
					<p className="text-sm text-muted-foreground">
						Browse groups by topic
					</p>
				</div>
			</div>

			{/* Category grid */}
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
				<Link
					href="/groups/categories"
					className={`relative rounded-xl overflow-hidden h-24 bg-gradient-to-br from-foreground/10 to-foreground/5 hover:opacity-90 transition-opacity ${
						!selectedCategory ? "ring-2 ring-primary" : ""
					}`}
				>
					<div className="absolute inset-0 flex items-end p-3">
						<span className="text-foreground font-semibold text-sm drop-shadow">
							All Categories
						</span>
					</div>
				</Link>
				{STATIC_CATEGORIES.map((cat) => (
					<Link
						key={cat}
						href={`/groups/categories?cat=${encodeURIComponent(cat)}`}
						className={`relative rounded-xl overflow-hidden h-24 bg-gradient-to-br ${
							CATEGORY_COLORS[cat] ?? "from-gray-600 to-gray-800"
						} hover:opacity-90 transition-opacity ${
							selectedCategory === cat
								? "ring-2 ring-primary ring-offset-2"
								: ""
						}`}
					>
						<div className="absolute inset-0 flex items-end p-3">
							<span className="text-white font-semibold text-sm drop-shadow">
								{cat}
							</span>
						</div>
					</Link>
				))}
			</div>

			{/* Groups section */}
			<div>
				<h2 className="text-lg font-bold mb-1">
					{selectedCategory
						? `${selectedCategory} Groups`
						: "All Groups"}
				</h2>
				<p className="text-sm text-muted-foreground mb-4">
					{groups.length} group{groups.length !== 1 ? "s" : ""} found
				</p>

				{groups.length === 0 ? (
					<div className="text-center py-16 text-muted-foreground border border-dashed rounded-xl">
						<Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
						<p className="font-medium text-base">No groups found</p>
						<p className="text-sm mt-1">
							Try a different category or{" "}
							<Link
								href="/groups"
								className="text-primary hover:underline"
							>
								browse all groups
							</Link>
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
						{groups.map((group) => (
							<div
								key={group.id}
								className="rounded-xl overflow-hidden bg-card border border-border hover:shadow-md transition-shadow"
							>
								<Link href={`/groups/${group.slug}`}>
									<div className="relative h-32 bg-muted">
										{group.coverUrl ? (
											<Image
												src={group.coverUrl}
												alt={group.name}
												fill
												className="object-cover"
												sizes="360px"
											/>
										) : (
											<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
												<Users className="h-10 w-10 text-primary/30" />
											</div>
										)}
									</div>
								</Link>
								<div className="p-4">
									<Link href={`/groups/${group.slug}`}>
										<h3 className="font-bold text-sm truncate hover:underline">
											{group.name}
										</h3>
									</Link>
									<p className="text-xs text-muted-foreground mt-0.5">
										{group.privacy} &middot;{" "}
										{formatCount(group._count.members)}{" "}
										members
									</p>
									{group.description && (
										<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
											{group.description}
										</p>
									)}
									{isLoggedIn && (
										<div className="mt-3">
											<GroupJoinButton
												groupId={group.id}
												initialState={
													(membershipMap[group.id] ??
														"none") as
														| "none"
														| "Pending"
														| "Approved"
														| "Banned"
												}
												privacy={group.privacy}
											/>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
