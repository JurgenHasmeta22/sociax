"use client";

import { useState, useTransition } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Globe, Users, Lock, Loader2, Upload } from "lucide-react";
import { createAlbum } from "@/actions/album.actions";
import { toast } from "sonner";
import type { PostPrivacy } from "../../../prisma/generated/prisma/enums";

const PRIVACY_OPTIONS: { value: PostPrivacy; label: string; icon: React.ElementType }[] = [
	{ value: "Public", label: "Public", icon: Globe },
	{ value: "FriendsOnly", label: "Friends only", icon: Users },
	{ value: "OnlyMe", label: "Only me", icon: Lock },
];

export function CreateAlbumDialog({
	open,
	onClose,
	onCreated,
}: {
	open: boolean;
	onClose: () => void;
	onCreated?: (album: { id: number; name: string; description: string | null; privacy: string; coverUrl: null; createdAt: Date }) => void;
}) {
	const [isPending, startTransition] = useTransition();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [privacy, setPrivacy] = useState<PostPrivacy>("Public");

	const reset = () => { setName(""); setDescription(""); setPrivacy("Public"); };

	function handleClose() { reset(); onClose(); }

	function handleCreate() {
		if (!name.trim()) { toast.warning("Album name is required"); return; }
		startTransition(async () => {
			try {
				const album = await createAlbum({ name, description: description || undefined, privacy });
				toast.success("Album created!");
				onCreated?.({ id: album.id, name: album.name, description: description || null, privacy, coverUrl: null, createdAt: new Date() });
				handleClose();
			} catch {
				toast.error("Failed to create album");
			}
		});
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Create Album</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="album-name">Album name *</Label>
						<Input id="album-name" placeholder="Summer 2026, Travel…" value={name} onChange={(e) => setName(e.target.value)} />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="album-desc">Description</Label>
						<Textarea id="album-desc" placeholder="Optional description" value={description} onChange={(e) => setDescription(e.target.value)} className="resize-none" rows={2} />
					</div>
					<div className="space-y-1.5">
						<Label>Privacy</Label>
						<Select value={privacy} onValueChange={(v) => setPrivacy(v as PostPrivacy)}>
							<SelectTrigger><SelectValue /></SelectTrigger>
							<SelectContent>
								{PRIVACY_OPTIONS.map(({ value, label, icon: Icon }) => (
									<SelectItem key={value} value={value}>
										<span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex gap-2">
						<Button variant="secondary" className="flex-1" onClick={handleClose} disabled={isPending}>Cancel</Button>
						<Button className="flex-1" onClick={handleCreate} disabled={isPending || !name.trim()}>
							{isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
							Create Album
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
