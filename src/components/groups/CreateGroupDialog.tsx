"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createGroup } from "@/actions/group.actions";

export function CreateGroupDialog({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const router = useRouter();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [privacy, setPrivacy] = useState("Public");
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		startTransition(async () => {
			const group = await createGroup({
				name: name.trim(),
				description: description.trim(),
				privacy,
			});
			if (group) {
				onClose();
				router.push(`/groups/${group.slug}`);
			}
		});
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o) onClose();
			}}
		>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Create a group</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 mt-1">
					<div className="space-y-1.5">
						<Label htmlFor="group-name">Group name</Label>
						<Input
							id="group-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Photography enthusiasts"
							maxLength={100}
							required
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="group-desc">
							Description{" "}
							<span className="text-muted-foreground font-normal">
								(optional)
							</span>
						</Label>
						<Textarea
							id="group-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="What is this group about?"
							className="resize-none min-h-[80px]"
							maxLength={500}
						/>
					</div>
					<div className="space-y-1.5">
						<Label>Privacy</Label>
						<Select value={privacy} onValueChange={setPrivacy}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="Public">
									Public — Anyone can see and join
								</SelectItem>
								<SelectItem value="Private">
									Private — Members only can see posts
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex justify-end gap-2 pt-1">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={!name.trim() || isPending}
						>
							{isPending ? "Creating…" : "Create group"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
