import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Users,
    MessageCircle,
    Image as ImageIcon,
    Globe,
    Shield,
    Zap,
    Heart,
    UsersRound,
    Flag,
    CalendarDays,
    ArrowRight,
} from "lucide-react";

const FEATURES = [
    {
        icon: Users,
        title: "Connect with people",
        description:
            "Follow friends, discover new connections, and build your personal network.",
        color: "bg-blue-500/10 text-blue-500",
    },
    {
        icon: ImageIcon,
        title: "Share your moments",
        description:
            "Post photos, videos, and stories that disappear after 24 hours.",
        color: "bg-green-500/10 text-green-500",
    },
    {
        icon: MessageCircle,
        title: "Real-time messaging",
        description:
            "Chat one-on-one or in groups with emoji reactions and media support.",
        color: "bg-purple-500/10 text-purple-500",
    },
    {
        icon: UsersRound,
        title: "Join communities",
        description:
            "Create or join groups around topics you care about.",
        color: "bg-orange-500/10 text-orange-500",
    },
    {
        icon: Flag,
        title: "Follow pages",
        description:
            "Stay updated with brands, creators, and organisations you love.",
        color: "bg-red-500/10 text-red-500",
    },
    {
        icon: CalendarDays,
        title: "Discover events",
        description:
            "Find and RSVP to events happening near you or online.",
        color: "bg-yellow-500/10 text-yellow-500",
    },
    {
        icon: Globe,
        title: "Privacy controls",
        description:
            "Share publicly, with friends only, or keep it just for yourself.",
        color: "bg-teal-500/10 text-teal-500",
    },
    {
        icon: Shield,
        title: "Safe platform",
        description:
            "Built-in moderation tools and reporting to keep the community healthy.",
        color: "bg-indigo-500/10 text-indigo-500",
    },
    {
        icon: Zap,
        title: "Lightning fast",
        description:
            "Built with Next.js 16, React 19, and edge-optimised queries.",
        color: "bg-pink-500/10 text-pink-500",
    },
];

const AVATARS = [
    { src: "https://i.pravatar.cc/150?img=1", fallback: "A" },
    { src: "https://i.pravatar.cc/150?img=3", fallback: "B" },
    { src: "https://i.pravatar.cc/150?img=5", fallback: "C" },
    { src: "https://i.pravatar.cc/150?img=7", fallback: "D" },
    { src: "https://i.pravatar.cc/150?img=9", fallback: "E" },
];

export default async function HomePage() {
    const session = await getServerSession(authOptions);
    if (session) redirect("/feed");

    return (
        <div className="flex flex-col">
            <section className="relative overflow-hidden py-20 md:py-32 px-4">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
                <div
                    className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20 -z-10"
                    style={{
                        background:
                            "radial-gradient(circle, oklch(0.546 0.215 254.4) 0%, transparent 70%)",
                    }}
                />
                <div
                    className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full opacity-10 -z-10"
                    style={{
                        background:
                            "radial-gradient(circle, oklch(0.546 0.215 254.4) 0%, transparent 70%)",
                    }}
                />

                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
                        <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                        Free forever · No ads
                    </Badge>

                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
                        Your world,{" "}
                        <span className="text-primary">connected</span>
                    </h1>

                    <p className="text-muted-foreground text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed">
                        Sociax brings people together. Share moments, join
                        communities, and have real conversations — all in one
                        place.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button size="lg" className="text-base px-8 h-12 gap-2 font-bold w-full sm:w-auto" asChild>
                            <Link href="/register">
                                Create your account
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="text-base px-8 h-12 font-semibold w-full sm:w-auto"
                            asChild
                        >
                            <Link href="/login">Sign in</Link>
                        </Button>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-2">
                        <div className="flex -space-x-3">
                            {AVATARS.map((a) => (
                                <Avatar
                                    key={a.src}
                                    className="h-9 w-9 ring-2 ring-background"
                                >
                                    <AvatarImage src={a.src} />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                                        {a.fallback}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">
                                26+ users
                            </span>{" "}
                            already joined
                        </p>
                    </div>
                </div>
            </section>

            <section className="py-20 px-4 bg-muted/30">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                            Everything you need to stay connected
                        </h2>
                        <p className="text-muted-foreground mt-3 text-lg max-w-xl mx-auto">
                            A modern social platform built with the latest
                            technology, focused on what matters — people.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {FEATURES.map(({ icon: Icon, title, description, color }) => (
                            <div
                                key={title}
                                className="bg-background rounded-2xl p-6 border border-border/60 hover:shadow-md transition-shadow duration-200 hover:border-primary/20"
                            >
                                <div
                                    className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}
                                >
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="font-semibold text-base mb-1.5">
                                    {title}
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 px-4">
                <div className="max-w-3xl mx-auto text-center space-y-6">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        Ready to get started?
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Join Sociax for free. No credit card required.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button
                            size="lg"
                            className="text-base px-10 h-12 gap-2 font-bold w-full sm:w-auto"
                            asChild
                        >
                            <Link href="/register">
                                Get started for free
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="ghost"
                            className="text-base font-semibold w-full sm:w-auto"
                            asChild
                        >
                            <Link href="/login">Already have an account?</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <footer className="border-t py-8 px-4">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                            S
                        </div>
                        Sociax
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-5 gap-y-1">
                        {["Privacy", "Terms", "Cookies", "Help"].map((item) => (
                            <a key={item} href="#" className="hover:text-foreground transition-colors">
                                {item}
                            </a>
                        ))}
                    </div>
                    <p>© 2026 Sociax. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
