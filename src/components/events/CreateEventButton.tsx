"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateEventDialog } from "@/components/events/CreateEventDialog";

export function CreateEventButton() {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button onClick={() => setOpen(true)} className="gap-2">
				<Plus className="h-4 w-4" />
				Create event
			</Button>
			<CreateEventDialog open={open} onClose={() => setOpen(false)} />
		</>
	);
}
