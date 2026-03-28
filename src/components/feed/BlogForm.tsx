"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BlogEditor } from "@/components/feed/BlogEditor";
import { createBlog, updateBlog } from "@/actions/blog.actions";
import { toast } from "sonner";
import { Loader2, Hash, Upload, X, ArrowLeft, Eye, Save } from "lucide-react";

type BlogFormProps = {
	mode: "create" | "edit";
	initialData?: {
		id: number;
		title: string;
		content: string;
		coverImageUrl: string | null;
		published: boolean;
		hashtags: { hashtag: { id: number; name: string } }[];
	};
};

export function BlogForm({ mode, initialData }: BlogFormProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [title, setTitle] = useState(initialData?.title ?? "");
	const [content, setContent] = useState(initialData?.content ?? "");
	const [coverImageUrl, setCoverImageUrl] = useState(
		initialData?.coverImageUrl ?? "",
	);
	const [tagsInput, setTagsInput] = useState(
		initialData?.hashtags.map((h) => h.hashtag.name).join(", ") ?? "",
	);
	const [uploadingCover, setUploadingCover] = useState(false);

	async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploadingCover(true);
		try {
			const fd = new FormData();
			fd.append("file", file);
			const res = await fetch("/api/upload", {
				method: "POST",
				body: fd,
			});
			const data = (await res.json()) as { url?: string; error?: string };
			if (!res.ok || !data.url)
				throw new Error(data.error ?? "Upload failed");
			setCoverImageUrl(data.url);
		} catch {
			toast.error("Cover upload failed");
		} finally {
			setUploadingCover(false);
		}
	}

	function handleSave(publish: boolean) {
		if (!title.trim()) {
			toast.warning("Title is required");
			return;
		}
		if (!content || content === '{"type":"doc","content":[]}') {
			toast.warning("Content is required");
			return;
		}

		const hashtags = tagsInput.split(/[,\s]+/).filter(Boolean);

		startTransition(async () => {
			try {
				if (mode === "create") {
					const result = await createBlog({
						title,
						content,
						coverImageUrl: coverImageUrl || undefined,
						published: publish,
						hashtags,
					});
					toast.success(publish ? "Blog published!" : "Draft saved!");
					router.push(`/blog/${result.slug}`);
				} else if (initialData) {
					const result = await updateBlog(initialData.id, {
						title,
						content,
						coverImageUrl: coverImageUrl || undefined,
						published: publish,
						hashtags,
					});
					toast.success("Blog updated!");
					router.push(`/blog/${result.slug}`);
				}
			} catch {
				toast.error("Failed to save blog");
			}
		});
	}

	return (
		<div className="max-w-3xl mx-auto px-4 py-8">
			{/* Header nav */}
			<div className="flex items-center justify-between mb-6">
				<Button variant="ghost" size="sm" asChild className="gap-1.5">
					<Link href="/blog">
						<ArrowLeft className="h-4 w-4" />
						Back
					</Link>
				</Button>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleSave(false)}
						disabled={isPending}
						className="gap-1.5"
					>
						<Save className="h-3.5 w-3.5" />
						Save Draft
					</Button>
					<Button
						size="sm"
						onClick={() => handleSave(true)}
						disabled={isPending}
						className="gap-1.5"
					>
						{isPending ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<Eye className="h-3.5 w-3.5" />
						)}
						Publish
					</Button>
				</div>
			</div>

			<div className="space-y-5">
				{/* Cover image */}
				<div>
					{coverImageUrl ? (
						<div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden bg-muted">
							<Image
								src={coverImageUrl}
								alt="Cover"
								fill
								className="object-cover"
							/>
							<button
								onClick={() => setCoverImageUrl("")}
								className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black transition-colors"
							>
								<X className="h-3.5 w-3.5 text-white" />
							</button>
						</div>
					) : (
						<label className="flex items-center gap-2 w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary transition-colors justify-center bg-muted/30">
							{uploadingCover ? (
								<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
							) : (
								<>
									<Upload className="h-5 w-5 text-muted-foreground" />
									<span className="text-sm text-muted-foreground">
										Add a cover image
									</span>
								</>
							)}
							<input
								type="file"
								accept="image/*"
								className="hidden"
								onChange={handleCoverUpload}
								disabled={uploadingCover}
							/>
						</label>
					)}
				</div>

				{/* Title */}
				<Input
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="Blog title…"
					className="text-2xl font-bold border-none shadow-none px-0 h-auto text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0"
				/>

				{/* Tags */}
				<div className="flex items-center gap-2">
					<Hash className="h-4 w-4 text-muted-foreground shrink-0" />
					<Input
						value={tagsInput}
						onChange={(e) => setTagsInput(e.target.value)}
						placeholder="Add tags (comma separated)"
						className="border-none shadow-none px-0 text-sm h-auto focus-visible:ring-0 text-primary placeholder:text-muted-foreground/60"
					/>
				</div>

				{/* Editor */}
				<BlogEditor
					initialContent={content || undefined}
					onChange={setContent}
					placeholder="Write your blog post here. Use the toolbar for formatting…"
				/>
			</div>
		</div>
	);
}
