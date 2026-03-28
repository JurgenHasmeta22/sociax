import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { BlogForm } from "@/components/feed/BlogForm";

export const metadata = { title: "Write Blog · Sociax" };

export default async function NewBlogPage() {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");

	return <BlogForm mode="create" />;
}
