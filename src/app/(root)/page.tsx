import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default async function HomePage() {
    const session = await getServerSession(authOptions);

    if (session) {
        redirect("/feed");
    }

    return (
        <div className="flex flex-col items-center gap-16 py-12">
            {/* Hero */}
            <section className="flex flex-col items-center gap-6 text-center">
                <Badge variant="secondary">shadcn/ui + Tailwind v4 ✓</Badge>
                <h1 className="text-5xl font-bold tracking-tight">
                    Welcome to <span className="text-primary">Sociax</span>
                </h1>
                <p className="text-muted-foreground text-xl max-w-xl">
                    Connect with friends, share moments, and explore communities.
                </p>
                <div className="flex gap-4">
                    <Button size="lg" asChild>
                        <Link href="/register">Get started</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <Link href="/login">Sign in</Link>
                    </Button>
                </div>
            </section>

            <Separator className="max-w-2xl w-full" />

            {/* Component showcase */}
            <section className="w-full max-w-4xl">
                <h2 className="text-2xl font-semibold mb-6 text-center">
                    Component Showcase
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Buttons card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Buttons</CardTitle>
                            <CardDescription>All button variants</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            <Button variant="default">Default</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="outline">Outline</Button>
                            <Button variant="ghost">Ghost</Button>
                            <Button variant="destructive">Destructive</Button>
                        </CardContent>
                    </Card>

                    {/* Badges card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Badges</CardTitle>
                            <CardDescription>Status indicators</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            <Badge>Default</Badge>
                            <Badge variant="secondary">Secondary</Badge>
                            <Badge variant="outline">Outline</Badge>
                            <Badge variant="destructive">Destructive</Badge>
                        </CardContent>
                    </Card>

                    {/* Avatars card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Avatars</CardTitle>
                            <CardDescription>User representation</CardDescription>
                        </CardHeader>
                        <CardContent className="flex gap-3 items-center">
                            <Avatar>
                                <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
                                <AvatarFallback>SC</AvatarFallback>
                            </Avatar>
                            <Avatar>
                                <AvatarFallback>JD</AvatarFallback>
                            </Avatar>
                            <Avatar>
                                <AvatarFallback>AB</AvatarFallback>
                            </Avatar>
                        </CardContent>
                        <CardFooter>
                            <p className="text-sm text-muted-foreground">Fallback to initials</p>
                        </CardFooter>
                    </Card>

                    {/* Tailwind colors card */}
                    <Card className="sm:col-span-2 lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Tailwind CSS v4</CardTitle>
                            <CardDescription>Theme color swatches from CSS variables</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-3">
                            {[
                                ["bg-primary", "Primary"],
                                ["bg-secondary", "Secondary"],
                                ["bg-accent", "Accent"],
                                ["bg-muted", "Muted"],
                                ["bg-destructive", "Destructive"],
                            ].map(([cls, label]) => (
                                <div key={cls} className="flex flex-col items-center gap-1">
                                    <div className={`${cls} w-12 h-12 rounded-md border`} />
                                    <span className="text-xs text-muted-foreground">{label}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}
