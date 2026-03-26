"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Bell,
    MessageCircle,
    Plus,
    Settings,
    LogOut,
    User,
    Moon,
    Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
    { href: "/feed", icon: Home, label: "Home" },
    { href: "/people", icon: Users, label: "People" },
    { href: "/groups", icon: UsersRound, label: "Groups" },
    { href: "/pages", icon: Flag, label: "Pages" },
    { href: "/events", icon: CalendarDays, label: "Events" },
];

export function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();

    const initials = session?.user?.name?.[0]?.toUpperCase() ?? "?";

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
            <div className="flex h-14 items-center gap-2 px-4">
                <div className="flex items-center gap-2 w-64 shrink-0">
                    <Link
                        href={session ? "/feed" : "/"}
                        className="flex items-center gap-2"
                    >
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                            S
                        </div>
                        <span className="font-bold text-xl text-primary hidden sm:block">
                            Sociax
                        </span>
                    </Link>
                    {session && (
                        <div className="relative ml-1 hidden lg:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Search"
                                className="pl-9 h-9 w-44 bg-muted rounded-full text-sm border-0 focus-visible:ring-1"
                            />
                        </div>
                    )}
                </div>

                {session && (
                    <nav className="hidden md:flex flex-1 items-center justify-center">
                        {NAV_LINKS.map(({ href, icon: Icon, label }) => {
                            const isActive =
                                pathname === href ||
                                pathname.startsWith(href + "/");
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    title={label}
                                    className={cn(
                                        "relative flex items-center justify-center h-14 w-24 rounded-md transition-colors text-muted-foreground hover:bg-muted",
                                        isActive && "text-primary",
                                    )}
                                >
                                    <Icon className="h-6 w-6" />
                                    {isActive && (
                                        <span className="absolute bottom-0 left-3 right-3 h-[3px] bg-primary rounded-t-full" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                )}

                <div className="flex items-center gap-1.5 ml-auto">
                    {session ? (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full bg-muted h-9 w-9"
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full bg-muted h-9 w-9"
                            >
                                <MessageCircle className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full bg-muted h-9 w-9"
                            >
                                <Bell className="h-5 w-5" />
                            </Button>
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
                                            signOut({ callbackUrl: "/login" })
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
    );
}

