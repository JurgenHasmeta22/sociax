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
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Globe, Users, Lock, Loader2, Hash } from "lucide-react";
import { createEvent } from "@/actions/event.actions";
import { toast } from "sonner";
import type { EventPrivacy } from "../../../prisma/generated/prisma/enums";

const PRIVACY_OPTIONS: {
	value: EventPrivacy;
	label: string;
	icon: React.ElementType;
}[] = [
	{ value: "Public", label: "Public", icon: Globe },
	{ value: "FriendsOnly", label: "Friends only", icon: Users },
	{ value: "Private", label: "Private", icon: Lock },
];

export function CreateEventDialog({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [coverUrl, setCoverUrl] = useState("");
	const [location, setLocation] = useState("");
	const [isOnline, setIsOnline] = useState(false);
	const [onlineLink, setOnlineLink] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [privacy, setPrivacy] = useState<EventPrivacy>("Public");
	const [tagsInput, setTagsInput] = useState("");

	const reset = () => {
		setTitle("");
		setDescription("");
		setCoverUrl("");
		setLocation("");
		setIsOnline(false);
		setOnlineLink("");
		setStartDate("");
		setEndDate("");
		setPrivacy("Public");
		setTagsInput("");
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	const handleSubmit = () => {
		if (!title.trim()) {
			toast.warning("Please add a title.");
			return;
		}
		if (!startDate) {
			toast.warning("Please set a start date.");
			return;
		}

		startTransition(async () => {
			try {
				const result = await createEvent({
					title,
					description,
					coverUrl,
					location: isOnline ? undefined : location,
					isOnline,
					onlineLink: isOnline ? onlineLink : undefined,
					startDate,
					endDate: endDate || undefined,
					privacy,
					hashtags: tagsInput.split(/[,\s]+/).filter(Boolean),
				});
				toast.success("Event created!");
				handleClose();
				router.push(`/events/${result.slug}`);
			} catch {
				toast.error("Failed to create event.");
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create event</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="event-title">Title *</Label>
						<Input
							id="event-title"
							placeholder="What's the event?"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="event-desc">Description</Label>
						<Textarea
							id="event-desc"
							placeholder="Tell people what to expect…"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="resize-none min-h-[80px]"
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="event-cover">Cover image URL</Label>
						<Input
							id="event-cover"
							placeholder="https://example.com/image.jpg"
							value={coverUrl}
							onChange={(e) => setCoverUrl(e.target.value)}
						/>
					</div>

					<div className="flex items-center gap-3">
						<Switch
							id="is-online"
							checked={isOnline}
							onCheckedChange={setIsOnline}
						/>
						<Label htmlFor="is-online">Online event</Label>
					</div>

					{isOnline ? (
						<div className="space-y-1.5">
							<Label htmlFor="online-link">Online link</Label>
							<Input
								id="online-link"
								placeholder="https://meet.google.com/..."
								value={onlineLink}
								onChange={(e) => setOnlineLink(e.target.value)}
							/>
						</div>
					) : (
						<div className="space-y-1.5">
							<Label htmlFor="event-loc">Location</Label>
							<Input
								id="event-loc"
								placeholder="Address or venue name"
								value={location}
								onChange={(e) => setLocation(e.target.value)}
							/>
						</div>
					)}

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="start-date">
								Start date & time *
							</Label>
							<Input
								id="start-date"
								type="datetime-local"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="end-date">End date & time</Label>
							<Input
								id="end-date"
								type="datetime-local"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						{" "}
						<Label htmlFor="event-tags">Tags (optional)</Label>
						<div className="relative">
							<Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								id="event-tags"
								placeholder="music, tech, art (comma or space separated)"
								value={tagsInput}
								onChange={(e) => setTagsInput(e.target.value)}
								className="pl-9"
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						{" "}
						<Label>Audience</Label>
						<Select
							value={privacy}
							onValueChange={(v) => setPrivacy(v as EventPrivacy)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PRIVACY_OPTIONS.map(
									({ value, label, icon: Icon }) => (
										<SelectItem key={value} value={value}>
											<span className="flex items-center gap-2">
												<Icon className="h-4 w-4" />
												{label}
											</span>
										</SelectItem>
									),
								)}
							</SelectContent>
						</Select>
					</div>

					<div className="flex gap-2 pt-1">
						<Button
							variant="secondary"
							className="flex-1"
							onClick={handleClose}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button
							className="flex-1"
							onClick={handleSubmit}
							disabled={isPending || !title.trim() || !startDate}
						>
							{isPending && (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							)}
							Create event
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
