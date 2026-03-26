import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, ImageIcon, Smile } from "lucide-react";

type ComposerUser = {
    userName: string;
    firstName: string | null;
    lastName: string | null;
    avatar: { photoSrc: string } | null;
};

const firstName = (u: ComposerUser) =>
    u.firstName || u.userName;

export function PostComposer({ user }: { user: ComposerUser }) {
    return (
        <Card className="shadow-sm">
            <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={user.avatar?.photoSrc ?? undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                            {(user.firstName || user.userName)[0]?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <button className="flex-1 text-left bg-muted hover:bg-accent rounded-full px-4 py-2.5 text-muted-foreground text-sm transition-colors">
                        What&apos;s on your mind, {firstName(user)}?
                    </button>
                </div>
                <Separator className="mb-3" />
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-2 text-muted-foreground hover:bg-muted rounded-lg h-9 font-semibold"
                    >
                        <Video className="h-5 w-5 text-red-500" />
                        <span className="hidden sm:block">Live video</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-2 text-muted-foreground hover:bg-muted rounded-lg h-9 font-semibold"
                    >
                        <ImageIcon className="h-5 w-5 text-green-500" />
                        <span className="hidden sm:block">Photo/video</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-2 text-muted-foreground hover:bg-muted rounded-lg h-9 font-semibold"
                    >
                        <Smile className="h-5 w-5 text-yellow-500" />
                        <span className="hidden sm:block">Feeling</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
