"use client";

import { useState, useEffect } from "react";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "sociax-sidebar-collapsed";

export function CollapsibleSidebar({ children }: { children: React.ReactNode }) {
	const [collapsed, setCollapsed] = useState(false);

	useEffect(() => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved === "true") setCollapsed(true);
	}, []);

	const toggle = () => {
		setCollapsed((prev) => {
			localStorage.setItem(STORAGE_KEY, String(!prev));
			return !prev;
		});
	};

	return (
		<aside
			className={cn(
				"hidden lg:flex flex-col shrink-0 sticky top-14 h-[calc(100vh-56px)] border-r border-border/60 transition-[width] duration-200",
				collapsed ? "w-[68px]" : "w-[280px]",
			)}
		>
			<div className="flex-1 overflow-y-auto overflow-x-hidden">
				<div className={cn(collapsed && "sidebar-collapsed")}>
					{children}
				</div>
			</div>
			<button
				onClick={toggle}
				className="flex items-center justify-center h-10 border-t border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
				title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
			>
				{collapsed ? (
					<PanelLeft className="h-4 w-4" />
				) : (
					<PanelLeftClose className="h-4 w-4" />
				)}
			</button>
		</aside>
	);
}
