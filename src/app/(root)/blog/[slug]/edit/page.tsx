import { getBlogBySlug } from "@/actions/blog.actions";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { BlogForm } from "@/components/feed/BlogForm";

export const metadata = { title: "Edit Blog · Sociax" };

export default async function EditBlogPage({ params }: { params: Promise<{ slug: string }> }) {
	const [{ slug }, session] = await Promise.all([params, getServerSession(authOptions)]);
	if (!session) redirect("/login");

	const blog = await getBlogBySlug(slug);
	if (!blog || !blog.isAuthor) notFound();

	return (
		<BlogForm
			mode="edit"
			initialData={{
				id: blog.id,
				title: blog.title,
				content: blog.content,
				coverImageUrl: blog.coverImageUrl,
				published: blog.published,
				hashtags: blog.hashtags,
			}}
		/>
	);
}
