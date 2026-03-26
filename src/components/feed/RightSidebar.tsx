import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, MapPin } from "lucide-react";
import { SidebarFollowButton } from "@/components/feed/SidebarFollowButton";

type SuggestedUser = {
	id: number;
	userName: string;
	firstName: string | null;
	lastName: string | null;
	location: string | null;
	avatar: { photoSrc: string } | null;
	_count: { followers: number };
};

type UpcomingEvent = {
	id: number;
	title: string;
	slug: string;
	location: string | null;
	startDate: Date;
	coverUrl: string | null;
	_count: { attendees: number };
};

const name = (u: {
	firstName: string | null;
	lastName: string | null;
	userName: string;
}) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

export function RightSidebar({
	suggestedUsers,
	events,
	currentUserId,
	followStates,
}: {
	suggestedUsers: SuggestedUser[];
	events: UpcomingEvent[];
	currentUserId: number;
	followStates: Record<number, string>;
}) {
	return (
		<div className="px-2 py-4 space-y-4">
			<div>
				<div className="flex items-center justify-between mb-3">
					<h3 className="font-semibold text-base">
						People you may know
					</h3>
					<Link
						href="/people"
						className="text-primary text-sm font-medium hover:underline"
					>
						See all
					</Link>
				</div>
				<div className="space-y-3">
					{suggestedUsers.map((user) => {
						const displayName = name(user);
						return (
							<div
								key={user.id}
								className="flex items-start gap-2.5"
							>
								<Link
									href={`/profile/${user.userName}`}
									className="shrink-0"
								>
									<Avatar className="h-10 w-10">
										<AvatarImage
											src={
												user.avatar?.photoSrc ??
												undefined
											}
										/>
										<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
											{displayName[0]?.toUpperCase()}
										</AvatarFallback>
									</Avatar>
								</Link>
								<div className="flex-1 min-w-0">
									<Link href={`/profile/${user.userName}`}>
										<p className="font-semibold text-sm leading-tight hover:underline truncate">
											{displayName}
										</p>
									</Link>
									{user.location && (
										<p className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-0.5">
											<MapPin className="h-3 w-3 shrink-0" />
											{user.location}
										</p>
									)}
									<p className="text-xs text-muted-foreground mt-0.5">
										{user._count.followers.toLocaleString()}{" "}
										friends
									</p>
									<SidebarFollowButton
										userId={user.id}
										initialState={
											followStates[user.id] === "accepted"
												? "accepted"
												: followStates[user.id] ===
													  "pending"
													? "outgoing_pending"
													: "none"
										}
									/>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{events.length > 0 && (
				<>
					<Separator />
					<div>
						<div className="flex items-center justify-between mb-3">
							<h3 className="font-semibold text-base">
								Upcoming events
							</h3>
							<Link
								href="/events"
								className="text-primary text-sm font-medium hover:underline"
							>
								See all
							</Link>
						</div>
						<div className="space-y-3">
							{events.map((event) => (
								<Link
									key={event.id}
									href={`/events/${event.slug}`}
									className="flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-muted transition-colors"
								>
									<div className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-muted">
										{event.coverUrl ? (
											<Image
												src={event.coverUrl}
												alt=""
												fill
												className="object-cover"
												sizes="56px"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center">
												<CalendarDays className="h-6 w-6 text-muted-foreground" />
											</div>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<p className="font-semibold text-sm leading-tight truncate">
											{event.title}
										</p>
										<p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
											<CalendarDays className="h-3 w-3 shrink-0" />
											{format(
												new Date(event.startDate),
												"MMM d · h:mm a",
											)}
										</p>
										{event.location && (
											<p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
												<MapPin className="h-3 w-3 shrink-0" />
												{event.location}
											</p>
										)}
										<p className="text-xs text-muted-foreground mt-0.5">
											{event._count.attendees} going
										</p>
									</div>
								</Link>
							))}
						</div>
					</div>
				</>
			)}

			<Separator />
			<div className="flex flex-wrap gap-x-2 gap-y-1">
				{["Privacy", "Terms", "Advertising", "Cookies"].map((item) => (
					<a
						key={item}
						href="#"
						className="text-xs text-muted-foreground hover:underline"
					>
						{item}
					</a>
				))}
				<span className="text-xs text-muted-foreground">
					Sociax © 2026
				</span>
			</div>
		</div>
	);
}
