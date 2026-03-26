import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function FeedPage() {
	const session = await getServerSession(authOptions);

	if (!session) {
		redirect("/login");
	}

	return (
		<div className="max-w-2xl mx-auto">
			<h1 className="text-2xl font-bold mb-6">Your Feed</h1>
			<p className="text-muted-foreground">
				Welcome back, {session.user?.name ?? session.user?.email}!
			</p>
			<p className="text-muted-foreground mt-2">
				Your feed is empty for now. Start by connecting with people.
			</p>
		</div>
	);
}
