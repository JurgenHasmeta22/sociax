import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
            <h2 className="text-4xl font-bold">404</h2>
            <p className="text-muted-foreground">Page not found.</p>
            <Button asChild>
                <Link href="/">Go home</Link>
            </Button>
        </div>
    );
}
