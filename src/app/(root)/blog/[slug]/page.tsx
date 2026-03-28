import { getBlogBySlug } from "@/actions/blog.actions";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { BlogDetailClient } from "@/components/feed/BlogDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const blog = await getBlogBySlug(slug);
	if (!blog) return { title: "Blog not found" };
	return {
		title: `${blog.title} · Sociax`,
		description: blog.excerpt ?? undefined,
	};
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const blog = await getBlogBySlug(slug);

	if (!blog || (!blog.published && !blog.isAuthor)) notFound();

	return <BlogDetailClient blog={blog} />;
}
