"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { PostCard } from "@/components/feed/PostCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { removeMemory, updateMemoryNote } from "@/actions/memory.actions";
import { NotebookPen, Trash2, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type MemoryPost = {
	id: number;
	content: string | null;
	createdAt: Date;
	privacy: string;
	saves?: { id: number }[];
	user: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
	media: { id: number; url: string; type: string; order: number }[];
	likes: { id: number; userId: number; reactionType: string }[];
	_count: { comments: number; shares: number };
	hashtags: { hashtag: { id: number; name: string } }[];
};

type Memory = {
	id: number;
	note: string | null;
	createdAt: Date;
	post: MemoryPost | null;
};

function MemoryCard({
	memory,
	currentUserId,
	onRemove,
}: {
	memory: Memory;
	currentUserId: number;
	onRemove: (id: number) => void;
}) {
	const [isPending, startTransition] = useTransition();
	const [editingNote, setEditingNote] = useState(false);
	const [note, setNote] = useState(memory.note ?? "");

	if (!memory.post) return null;

	const handleRemove = () => {
		onRemove(memory.id);
		startTransition(() => removeMemory(memory.post!.id));
	};

	const handleSaveNote = () => {
		setEditingNote(false);
		startTransition(() => updateMemoryNote(memory.id, note));
	};

	const savedAgo = formatDistanceToNow(new Date(memory.createdAt), {
		addSuffix: true,
	});

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between px-1">
				<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<NotebookPen className="h-3.5 w-3.5 text-primary" />
					<span>Saved as memory {savedAgo}</span>
				</div>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 text-muted-foreground hover:text-foreground"
						onClick={() => setEditingNote((p) => !p)}
						title="Edit note"
					>
						<Pencil className="h-3.5 w-3.5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 text-muted-foreground hover:text-destructive"
						onClick={handleRemove}
						disabled={isPending}
						title="Remove from memories"
					>
						<Trash2 className="h-3.5 w-3.5" />
					</Button>
				</div>
			</div>

			{editingNote ? (
				<Card className="border-primary/30">
					<CardContent className="pt-3 pb-3">
						<p className="text-xs text-muted-foreground mb-1.5 font-medium">
							Personal note
						</p>
						<Textarea
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder="Add a personal note…"
							className="resize-none min-h-[60px] text-sm"
							autoFocus
						/>
						<div className="flex justify-end gap-2 mt-2">
							<Button
								size="sm"
								variant="ghost"
								onClick={() => {
									setNote(memory.note ?? "");
									setEditingNote(false);
								}}
							>
								<X className="h-3.5 w-3.5 mr-1" />
								Cancel
							</Button>
							<Button
								size="sm"
								onClick={handleSaveNote}
								disabled={isPending}
							>
								<Check className="h-3.5 w-3.5 mr-1" />
								Save
							</Button>
						</div>
					</CardContent>
				</Card>
			) : note ? (
				<Card
					className={cn(
						"border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors",
					)}
					onClick={() => setEditingNote(true)}
				>
					<CardContent className="py-2 px-3">
						<p className="text-xs text-primary font-medium mb-0.5">
							Your note
						</p>
						<p className="text-sm text-foreground/80">{note}</p>
					</CardContent>
				</Card>
			) : null}

			<PostCard post={memory.post} currentUserId={currentUserId} />
		</div>
	);
}

export function MemoriesClient({
	memories: initialMemories,
	currentUserId,
}: {
	memories: Memory[];
	currentUserId: number;
}) {
	const [memories, setMemories] = useState(initialMemories);

	const handleRemove = (id: number) => {
		setMemories((p) => p.filter((m) => m.id !== id));
	};

	return (
		<div className="space-y-6">
			{memories.map((memory) => (
				<MemoryCard
					key={memory.id}
					memory={memory}
					currentUserId={currentUserId}
					onRemove={handleRemove}
				/>
			))}
		</div>
	);
}
