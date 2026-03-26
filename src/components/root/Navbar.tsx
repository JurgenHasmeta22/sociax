import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Button } from "@/components/ui/button";

export async function Navbar() {
	const session = await getServerSession(authOptions);

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto flex h-14 items-center justify-between px-4">
				<Link
					href="/"
					className="flex items-center gap-2 font-bold text-lg"
				>
					Sociax
				</Link>
				<nav className="flex items-center gap-2">
					{session ? (
						<>
							<Button variant="ghost" asChild>
								<Link href="/feed">Feed</Link>
							</Button>
							<Button variant="ghost" asChild>
								<Link href="/profile">Profile</Link>
							</Button>
							<Button variant="outline" asChild>
								<Link href="/api/auth/signout">Sign out</Link>
							</Button>
						</>
					) : (
						<>
							<Button variant="ghost" asChild>
								<Link href="/login">Sign in</Link>
							</Button>
							<Button asChild>
								<Link href="/register">Sign up</Link>
							</Button>
						</>
					)}
				</nav>
			</div>
		</header>
	);
}
