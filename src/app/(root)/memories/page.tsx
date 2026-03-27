import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { NotebookPen } from "lucide-react";
import { getUserMemories } from "@/actions/memory.actions";
import { MemoriesClient } from "@/components/profile/MemoriesClient";

export const metadata = { title: "Memories · Sociax" };

export default async function MemoriesPage() {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");
	const userId = parseInt(session.user.id);

	const memories = await getUserMemories();

	return (
		<div className="max-w-[600px] mx-auto py-6 px-3 space-y-4">
			<div className="flex items-center gap-2 mb-2">
				<NotebookPen className="h-5 w-5 text-primary" />
				<h1 className="text-xl font-bold">Memories</h1>
			</div>
			<p className="text-sm text-muted-foreground -mt-2">
				Posts you&apos;ve saved as personal memories.
			</p>

			{memories.length === 0 ? (
				<div className="text-center py-16 text-muted-foreground">
					<NotebookPen className="h-10 w-10 mx-auto mb-3 opacity-30" />
					<p className="text-lg font-medium">No memories yet</p>
					<p className="text-sm mt-1">
						Save posts as memories from your feed.
					</p>
				</div>
			) : (
				<MemoriesClient memories={memories} currentUserId={userId} />
			)}
		</div>
	);
}
