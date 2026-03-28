"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Home,
	Users,
	UsersRound,
	Flag,
	CalendarDays,
	Search,
	Settings,
	LogOut,
	User,
	Moon,
	Sun,
	ShoppingBag,
	Video,
	BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchModal } from "@/components/root/SearchModal";
import { ChatNavButton } from "@/components/root/ChatNavButton";
import { NotificationBell } from "@/components/root/NotificationBell";

const NAV_LINKS = [
	{ href: "/feed", icon: Home, label: "Home" },
	{ href: "/people", icon: Users, label: "People" },
	{ href: "/groups", icon: UsersRound, label: "Groups" },
	{ href: "/pages", icon: Flag, label: "Pages" },
	{ href: "/events", icon: CalendarDays, label: "Events" },
	{ href: "/videos", icon: Video, label: "Videos" },
	{ href: "/marketplace", icon: ShoppingBag, label: "Market" },
	{ href: "/blog", icon: BookOpen, label: "Blog" },
];

const MOBILE_NAV_LINKS = [
	{ href: "/feed", icon: Home, label: "Home" },
	{ href: "/groups", icon: UsersRound, label: "Groups" },
	{ href: "/videos", icon: Video, label: "Videos" },
	{ href: "/events", icon: CalendarDays, label: "Events" },
	{ href: "/marketplace", icon: ShoppingBag, label: "Market" },
];

export function Navbar() {
	const { data: session } = useSession();
	const pathname = usePathname();
	const { theme, setTheme } = useTheme();
	const [searchOpen, setSearchOpen] = useState(false);

	const initials = session?.user?.name?.[0]?.toUpperCase() ?? "?";

	return (
		<>
			<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
				<div className="flex h-14 items-center px-4">
					{/* Left: Logo + Nav links */}
					<div className="flex items-center shrink-0 gap-0.5">
						<Link
							href={session ? "/feed" : "/"}
							className="flex items-center gap-2 mr-1"
						>
							<div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
								S
							</div>
							<span className="font-bold text-xl text-primary hidden xl:block">
								Sociax
							</span>
						</Link>
						{session && (
							<nav className="hidden md:flex items-center">
								{NAV_LINKS.map(
									({ href, icon: Icon, label }) => {
										const isActive =
											pathname === href ||
											pathname.startsWith(href + "/");
										return (
											<Link
												key={href}
												href={href}
												title={label}
												className={cn(
													"relative flex items-center justify-center h-14 w-11 rounded-md transition-colors text-muted-foreground hover:bg-muted",
													isActive && "text-primary",
												)}
											>
												<Icon className="h-5 w-5" />
												{isActive && (
													<span className="absolute bottom-0 left-1 right-1 h-[3px] bg-primary rounded-t-full" />
												)}
											</Link>
										);
									},
								)}
							</nav>
						)}
					</div>

					{/* Center: Search bar */}
					{session && (
						<div className="flex-1 flex justify-center px-4">
							<button
								onClick={() => setSearchOpen(true)}
								className="hidden sm:flex items-center gap-2 h-9 w-full max-w-sm bg-muted rounded-full px-4 text-sm text-muted-foreground hover:bg-muted/80 transition-colors"
							>
								<Search className="h-4 w-4 shrink-0" />
								Search
							</button>
						</div>
					)}

					{/* Right: Bell + Avatar */}
					<div className="flex items-center gap-1.5 ml-auto">
						{session ? (
							<>
								<Button
									variant="ghost"
									size="icon"
									className="rounded-full bg-muted h-9 w-9 sm:hidden"
									onClick={() => setSearchOpen(true)}
								>
									<Search className="h-5 w-5" />
								</Button>{" "}
								<ChatNavButton /> <NotificationBell />
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="rounded-full h-9 w-9 p-0"
										>
											<Avatar className="h-9 w-9">
												<AvatarImage
													src={
														session.user.image ??
														undefined
													}
												/>
												<AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
													{initials}
												</AvatarFallback>
											</Avatar>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align="end"
										className="w-72 p-2"
									>
										<div className="flex items-center gap-3 p-2 mb-1 rounded-lg hover:bg-muted cursor-pointer">
											<Avatar className="h-11 w-11">
												<AvatarImage
													src={
														session.user.image ??
														undefined
													}
												/>
												<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
													{initials}
												</AvatarFallback>
											</Avatar>
											<div>
												<p className="font-semibold text-sm leading-tight">
													{session.user.name}
												</p>
												<p className="text-xs text-muted-foreground truncate">
													{session.user.email}
												</p>
											</div>
										</div>
										<DropdownMenuSeparator />
										<DropdownMenuItem asChild>
											<Link
												href={`/profile/${session.user.name}`}
												className="flex items-center gap-3 cursor-pointer rounded-md"
											>
												<div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
													<User className="h-4 w-4" />
												</div>
												Profile
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem asChild>
											<Link
												href="/settings"
												className="flex items-center gap-3 cursor-pointer rounded-md"
											>
												<div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
													<Settings className="h-4 w-4" />
												</div>
												Settings & privacy
											</Link>
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={() =>
												setTheme(
													theme === "dark"
														? "light"
														: "dark",
												)
											}
											className="flex items-center gap-3 cursor-pointer rounded-md"
										>
											<div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
												{theme === "dark" ? (
													<Sun className="h-4 w-4" />
												) : (
													<Moon className="h-4 w-4" />
												)}
											</div>
											{theme === "dark"
												? "Light mode"
												: "Dark mode"}
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={() =>
												signOut({
													callbackUrl: "/login",
												})
											}
											className="flex items-center gap-3 cursor-pointer text-destructive focus:text-destructive rounded-md"
										>
											<div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
												<LogOut className="h-4 w-4 text-destructive" />
											</div>
											Sign out
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</>
						) : (
							<>
								<Button variant="ghost" size="sm" asChild>
									<Link href="/login">Sign in</Link>
								</Button>
								<Button size="sm" asChild>
									<Link href="/register">Get started</Link>
								</Button>
							</>
						)}
					</div>
				</div>
			</header>

			<SearchModal
				open={searchOpen}
				onClose={() => setSearchOpen(false)}
			/>

			{/* Mobile bottom nav */}
			{session && (
				<nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur border-t border-border safe-area-pb">
					<div className="flex items-center justify-around h-14">
						{MOBILE_NAV_LINKS.map(({ href, icon: Icon, label }) => {
							const isActive = pathname === href || pathname.startsWith(href + "/");
							return (
								<Link
									key={href}
									href={href}
									className={cn(
										"flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
										isActive ? "text-primary" : "text-muted-foreground",
									)}
								>
									<Icon className="h-5 w-5" />
									<span className="text-[10px] font-medium">{label}</span>
								</Link>
							);
						})}
					</div>
				</nav>
			)}
		</>
	);
}
