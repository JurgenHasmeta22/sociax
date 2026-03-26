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
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createPage } from "@/actions/page.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const CATEGORIES = [
	"Business",
	"Community",
	"Entertainment",
	"Education",
	"Sports",
	"Technology",
	"Arts",
	"NonProfit",
	"Government",
	"Other",
] as const;

type Category = (typeof CATEGORIES)[number];

export function CreatePageDialog({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState<Category>("Other");
	const [website, setWebsite] = useState("");
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const reset = () => {
		setName("");
		setDescription("");
		setCategory("Other");
		setWebsite("");
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	const handleSubmit = () => {
		if (!name.trim()) {
			toast.warning("Page name is required.");
			return;
		}

		startTransition(async () => {
			try {
				const page = await createPage(name, description, category, website);
				toast.success("Page created!");
				handleClose();
				router.push(`/pages/${page.slug}`);
			} catch {
				toast.error("Failed to create page.");
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Create page</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div>
						<p className="text-sm font-medium mb-1.5">Page name *</p>
						<Input
							placeholder="e.g. Awesome Tech Blog"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					<div>
						<p className="text-sm font-medium mb-1.5">Category</p>
						<Select
							value={category}
							onValueChange={(v) => setCategory(v as Category)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{CATEGORIES.map((c) => (
									<SelectItem key={c} value={c}>
										{c}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div>
						<p className="text-sm font-medium mb-1.5">Description (optional)</p>
						<Textarea
							placeholder="What is this page about?"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="resize-none min-h-[80px]"
						/>
					</div>

					<div>
						<p className="text-sm font-medium mb-1.5">Website (optional)</p>
						<Input
							placeholder="https://example.com"
							value={website}
							onChange={(e) => setWebsite(e.target.value)}
						/>
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
							disabled={isPending || !name.trim()}
						>
							{isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
							Create page
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
