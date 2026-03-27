import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Bell } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { FriendRequests } from "@/components/notifications/FriendRequests";
import { NotificationList } from "@/components/notifications/NotificationList";

export const metadata = { title: "Notifications · Sociax" };

export default async function NotificationsPage() {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");

	const userId = parseInt(session.user.id);

	const [pendingRequests, notifications] = await Promise.all([
		prisma.userFollow.findMany({
			where: { followingId: userId, state: "pending" },
			orderBy: { createdAt: "desc" },
			include: {
				follower: {
					select: {
						id: true,
						userName: true,
						firstName: true,
						lastName: true,
						location: true,
						avatar: { select: { photoSrc: true } },
						_count: { select: { following: { where: { state: "accepted" } } } },
					},
				},
			},
		}),
		prisma.notification.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
			take: 40,
			include: {
				sender: {
					select: {
						id: true,
						userName: true,
						firstName: true,
						lastName: true,
						avatar: { select: { photoSrc: true } },
					},
				},
			},
		}),
	]);

	return (
		<div className="max-w-2xl mx-auto px-4 py-8">
			<div className="flex items-center gap-3 mb-6">
				<Bell className="h-6 w-6" />
				<h1 className="text-2xl font-bold">Notifications</h1>
			</div>

			{pendingRequests.length > 0 && (
				<>
					<section className="mb-6">
						<h2 className="text-base font-semibold mb-3">
							Friend Requests ({pendingRequests.length})
						</h2>
						<FriendRequests requests={pendingRequests} />
					</section>
					<Separator className="mb-6" />
				</>
			)}

			<section>
				<h2 className="text-base font-semibold mb-3">
					Recent Activity
				</h2>
				<NotificationList notifications={notifications} />
			</section>
		</div>
	);
}
