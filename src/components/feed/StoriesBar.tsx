"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";

type Story = {
    id: number;
    mediaUrl: string;
    user: {
        userName: string;
        firstName: string | null;
        lastName: string | null;
        avatar: { photoSrc: string } | null;
    };
};

type CurrentUser = {
    firstName: string | null;
    lastName: string | null;
    userName: string;
    avatar: { photoSrc: string } | null;
};

const name = (u: { firstName: string | null; lastName: string | null; userName: string }) =>
    [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

export function StoriesBar({
    stories,
    currentUser,
}: {
    stories: Story[];
    currentUser: CurrentUser;
}) {
    const userName = name(currentUser);

    return (
        <ScrollArea className="w-full pb-2">
            <div className="flex gap-2.5">
                <div className="relative w-[112px] h-[196px] rounded-xl overflow-hidden bg-muted flex-shrink-0 cursor-pointer group border border-border">
                    <div className="h-[140px] w-full overflow-hidden relative bg-muted">
                        {currentUser.avatar && (
                            <Image
                                src={currentUser.avatar.photoSrc}
                                alt=""
                                fill
                                className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-200"
                                sizes="112px"
                            />
                        )}
                    </div>
                    <div className="absolute top-[110px] left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary flex items-center justify-center border-4 border-background z-10">
                        <Plus className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-card pb-3 pt-6 px-2">
                        <p className="text-[11px] font-semibold text-center leading-tight truncate">
                            Create story
                        </p>
                    </div>
                </div>

                {stories.map((story) => {
                    const storyName = name(story.user);
                    return (
                        <div
                            key={story.id}
                            className="relative w-[112px] h-[196px] rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group"
                        >
                            <Image
                                src={story.mediaUrl}
                                alt=""
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-200"
                                sizes="112px"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
                            <div className="absolute top-2 left-2 ring-[3px] ring-primary rounded-full">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={story.user.avatar?.photoSrc ?? undefined} />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                                        {storyName[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-white text-xs font-semibold truncate drop-shadow">
                                    {storyName}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}
