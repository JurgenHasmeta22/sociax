import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsContent } from "@/components/profile/SettingsContent";

export const metadata = { title: "Settings · Sociax" };

export default async function SettingsPage() {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");

	const userId = parseInt(session.user.id);

	const [user, blockedEntries] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				firstName: true,
				lastName: true,
				userName: true,
				email: true,
				bio: true,
				location: true,
				website: true,
				phone: true,
				birthday: true,
				gender: true,
				profilePrivacy: true,
				password: true,
			},
		}),
		prisma.userBlock.findMany({
			where: { blockerId: userId },
			select: {
				blocked: {
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

	if (!user) redirect("/login");

	const blockedUsers = blockedEntries.map((e) => e.blocked);

	return (
		<SettingsContent
			user={{
				...user,
				hasPassword: !!user.password,
			}}
			blockedUsers={blockedUsers}
		/>
	);
}
