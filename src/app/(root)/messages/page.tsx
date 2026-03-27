import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getMyConversations } from "@/actions/message.actions";
import { MessagesClient } from "@/components/messages/MessagesClient";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");

	const userId = parseInt(session.user.id);
	const conversations = await getMyConversations();

	return (
		<MessagesClient
			initialConversations={conversations}
			currentUserId={userId}
		/>
	);
}
