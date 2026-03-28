"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
	const [count, setCount] = useState(0);

	useEffect(() => {
		const eventSource = new EventSource("/api/notifications/sse");

		eventSource.onmessage = (e) => {
			try {
				const data = JSON.parse(e.data) as { count: number };
				setCount(data.count);
			} catch {
				// ignore parse errors
			}
		};

		eventSource.onerror = () => {
			eventSource.close();
		};

		return () => {
			eventSource.close();
		};
	}, []);

	return (
		<Link href="/notifications">
			<Button
				variant="ghost"
				size="icon"
				className="relative rounded-full bg-muted h-9 w-9"
				aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
			>
				<Bell className="h-5 w-5" />
				{count > 0 && (
					<span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none">
						{count > 99 ? "99+" : count}
					</span>
				)}
			</Button>
		</Link>
	);
}
