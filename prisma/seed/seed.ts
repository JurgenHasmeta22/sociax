import "dotenv/config";
import {
    AttendeeStatus,
    FollowState,
    Gender,
    GroupMemberRole,
    GroupMemberStatus,
    GroupPrivacy,
    EventPrivacy,
    MessageStatus,
    MessageType,
    ModerationAction,
    NotificationType,
    PageCategory,
    PostMediaType,
    PostPrivacy,
    PostType,
    PrismaClient,
    ProfilePrivacy,
    ReactionType,
    ReportStatus,
    ReportType,
    StoryPrivacy,
    UserRole,
} from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashSync } from "bcrypt";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

// #region Helpers
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickMany = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start: Date, end: Date) =>
    new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const slug = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// #endregion

// #region Static data
const FIRST_NAMES = [
    "Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah",
    "Ivan", "Julia", "Kevin", "Laura", "Mike", "Nina", "Oscar", "Paula",
    "Quinn", "Rachel", "Sam", "Tina", "Uma", "Victor", "Wendy", "Xander",
    "Yasmine", "Zack",
];
const LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson",
    "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee",
];
const LOCATIONS = [
    "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX",
    "Phoenix, AZ", "Philadelphia, PA", "San Antonio, TX", "San Diego, CA",
    "Dallas, TX", "San Jose, CA", "London, UK", "Paris, France",
    "Berlin, Germany", "Tokyo, Japan", "Sydney, Australia",
];
const BIOS = [
    "Just here to vibe and connect.",
    "Coffee addict. Dog lover. Amateur chef.",
    "Making memories one day at a time.",
    "Wanderlust • Photography • Music",
    "Developer by day, gamer by night.",
    "Chasing sunsets and good conversations.",
    "Living life on my own terms.",
    "Books, hiking, and strong opinions.",
    "Trying to adult. Failing gracefully.",
    "Mostly harmless.",
];
const POST_CONTENTS = [
    "Just had the most amazing brunch! 🍳",
    "Can't believe how fast this year is flying by.",
    "Anyone else obsessed with this new show on Netflix?",
    "Working from home hits different when the sun is out.",
    "That moment when your code finally works after 3 hours. 🎉",
    "Going hiking this weekend, who's in?",
    "Reminder: drink water, go outside, be kind.",
    "Hot take: pineapple absolutely belongs on pizza.",
    "Monday motivation: you got this. 💪",
    "Nothing beats a good book and a rainy afternoon.",
    "Just adopted a puppy! My life is complete. 🐶",
    "Road trip vibes. No destination, just adventure.",
    "Trying to learn guitar. Neighbors probably hate me.",
    "Sleep is underrated. I said what I said.",
    "Finished a 10k today! New personal best! 🏃",
    "Making homemade pasta for the first time. Pray for me.",
    "Sunset at the beach hits different every single time.",
    "Unpopular opinion: mornings are actually great.",
    "Started my own garden. First tomato incoming. 🍅",
    "Two years at this job. Time flies when you love what you do.",
];
const COMMENT_CONTENTS = [
    "This is so relatable!",
    "Omg same 😂",
    "Love this so much!",
    "You're so right tbh",
    "This made my day!",
    "Preach!! 🙌",
    "I needed this today.",
    "Totally agree with you.",
    "Have you tried doing it differently?",
    "This is goals right here.",
    "Why is this so true lol",
    "Amazing, keep it up!",
    "Wish I could do this.",
    "Tag me next time!",
    "Okay but this slaps.",
];
const REPLY_CONTENTS = [
    "Haha exactly my thoughts!",
    "Right?? I was thinking the same thing.",
    "Thanks for saying this!",
    "For real though.",
    "You always come through with the best takes.",
];
const GROUP_NAMES = [
    "Photography Enthusiasts", "Coders & Developers Hub", "Travel Addicts",
    "Fitness & Wellness Community", "Movie Buffs Unite", "Book Club Central",
    "Foodies Paradise", "Gaming Legends", "Music for the Soul", "Startup Founders Network",
];
const GROUP_DESCS = [
    "Share your best shots and get feedback from the community.",
    "A place for developers to share tips, projects, and jobs.",
    "Explore the world together through stories and photos.",
    "Workouts, meal prep, mental health — all welcome here.",
    "Discuss films, reviews, and recommendations.",
    "Monthly picks, reviews, and literary debates.",
    "Recipes, restaurant finds, and food photography.",
    "From casual to competitive, all gamers welcome.",
    "Discover new artists, share playlists, and connect.",
    "Network with founders, share learnings, find co-founders.",
];
const PAGE_NAMES = [
    "TechInsider Daily", "The Culinary Lab", "Wanderlust Magazine",
    "FitLife Official", "CodeCraft Academy", "Indie Film Factory",
    "Urban Garden Society", "Digital Nomad Hub", "The Science Corner", "StartupWire",
];
const EVENT_TITLES = [
    "City Hackathon 2026", "Rooftop Summer Party", "Online Coding Bootcamp",
    "Photography Walk — Downtown", "Book Swap & Coffee Morning",
    "5K Charity Run", "Tech Talk: AI in 2026",
    "Virtual Game Night", "Food Festival 2026", "Music Open Mic Night",
];
const HASHTAG_NAMES = [
    "motivation", "travel", "food", "coding", "fitness", "music",
    "photography", "gaming", "books", "nature", "tech", "life",
    "friends", "weekend", "mondaymood",
];
const IMAGE_URLS = [
    "https://picsum.photos/seed/a1/800/600",
    "https://picsum.photos/seed/b2/800/600",
    "https://picsum.photos/seed/c3/800/600",
    "https://picsum.photos/seed/d4/800/600",
    "https://picsum.photos/seed/e5/800/600",
    "https://picsum.photos/seed/f6/800/600",
    "https://picsum.photos/seed/g7/800/600",
    "https://picsum.photos/seed/h8/800/600",
    "https://picsum.photos/seed/i9/800/600",
    "https://picsum.photos/seed/j10/800/600",
];
const AVATAR_URLS = [
    "https://i.pravatar.cc/150?img=1",  "https://i.pravatar.cc/150?img=2",
    "https://i.pravatar.cc/150?img=3",  "https://i.pravatar.cc/150?img=4",
    "https://i.pravatar.cc/150?img=5",  "https://i.pravatar.cc/150?img=6",
    "https://i.pravatar.cc/150?img=7",  "https://i.pravatar.cc/150?img=8",
    "https://i.pravatar.cc/150?img=9",  "https://i.pravatar.cc/150?img=10",
    "https://i.pravatar.cc/150?img=11", "https://i.pravatar.cc/150?img=12",
    "https://i.pravatar.cc/150?img=13", "https://i.pravatar.cc/150?img=14",
    "https://i.pravatar.cc/150?img=15",
];
const MESSAGE_TEXTS = [
    "Hey, how's it going?",
    "Did you see that post earlier?",
    "We should catch up soon!",
    "Just checking in 😊",
    "Long time no talk!",
    "What are your plans this weekend?",
    "Have you heard the news?",
    "Miss you already 😄",
    "Call me when you're free.",
    "Sending good vibes your way!",
];
// #endregion

// #region Delete all data
async function deleteAll() {
    console.log("  Clearing existing data...");
    await prisma.moderationLog.deleteMany();
    await prisma.reportedContent.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.messageReaction.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversationParticipant.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.eventAttendee.deleteMany();
    await prisma.event.deleteMany();
    await prisma.pagePostComment.deleteMany();
    await prisma.pagePostLike.deleteMany();
    await prisma.pagePost.deleteMany();
    await prisma.pageFollower.deleteMany();
    await prisma.page.deleteMany();
    await prisma.groupPostComment.deleteMany();
    await prisma.groupPostLike.deleteMany();
    await prisma.groupPost.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.storyReaction.deleteMany();
    await prisma.storyView.deleteMany();
    await prisma.story.deleteMany();
    await prisma.replyLike.deleteMany();
    await prisma.commentReply.deleteMany();
    await prisma.commentLike.deleteMany();
    await prisma.postComment.deleteMany();
    await prisma.postHashtag.deleteMany();
    await prisma.hashtag.deleteMany();
    await prisma.postHistory.deleteMany();
    await prisma.postShare.deleteMany();
    await prisma.postSave.deleteMany();
    await prisma.postLike.deleteMany();
    await prisma.postMedia.deleteMany();
    await prisma.post.deleteMany();
    await prisma.userBlock.deleteMany();
    await prisma.userFollow.deleteMany();
    await prisma.coverPhoto.deleteMany();
    await prisma.avatar.deleteMany();
    await prisma.resetPasswordToken.deleteMany();
    await prisma.activateToken.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
}
// #endregion

async function main() {
    console.log("🌱 Seeding Sociax database...\n");

    await deleteAll();

    // #region Users (20)
    console.log("  Creating users...");
    const password = hashSync("Password123!", 10);
    const genders = [Gender.Male, Gender.Female, Gender.Other, Gender.PreferNotToSay];
    const privacies = [ProfilePrivacy.Public, ProfilePrivacy.FriendsOnly, ProfilePrivacy.Private];

    const users = await Promise.all(
        FIRST_NAMES.map((first, i) => {
            const last = LAST_NAMES[i % LAST_NAMES.length];
            const userName = `${first.toLowerCase()}${last.toLowerCase()}${i}`;
            const role = i === 0 ? UserRole.Admin : i === 1 ? UserRole.Moderator : UserRole.User;
            return prisma.user.create({
                data: {
                    userName,
                    email: `${userName}@sociax.dev`,
                    password,
                    firstName: first,
                    lastName: last,
                    bio: pick(BIOS),
                    gender: pick(genders),
                    location: pick(LOCATIONS),
                    phone: `+1${randomInt(2000000000, 9999999999)}`,
                    profilePrivacy: pick(privacies),
                    active: true,
                    role,
                    birthday: randomDate(new Date("1970-01-01"), new Date("2000-12-31")),
                    avatar: { create: { photoSrc: AVATAR_URLS[i % AVATAR_URLS.length] } },
                    coverPhoto: { create: { photoSrc: pick(IMAGE_URLS) } },
                },
            });
        }),
    );
    console.log(`  ✓ ${users.length} users`);
    // #endregion

    // #region Follows
    console.log("  Creating follows...");
    const followPairs = new Set<string>();
    const followStates = [FollowState.accepted, FollowState.accepted, FollowState.accepted, FollowState.pending];
    let followCount = 0;
    for (const u of users) {
        const targets = pickMany(users.filter((x) => x.id !== u.id), randomInt(4, 10));
        for (const t of targets) {
            const key = `${u.id}-${t.id}`;
            if (!followPairs.has(key)) {
                followPairs.add(key);
                await prisma.userFollow.create({
                    data: { followerId: u.id, followingId: t.id, state: pick(followStates) },
                });
                followCount++;
            }
        }
    }
    console.log(`  ✓ ${followCount} follows`);
    // #endregion

    // #region Blocks (a few)
    console.log("  Creating blocks...");
    const blockPairs = new Set<string>();
    let blockCount = 0;
    for (let i = 0; i < 8; i++) {
        const [a, b] = pickMany(users, 2);
        const key = `${a.id}-${b.id}`;
        if (!blockPairs.has(key) && a.id !== b.id) {
            blockPairs.add(key);
            await prisma.userBlock.create({ data: { blockerId: a.id, blockedId: b.id } });
            blockCount++;
        }
    }
    console.log(`  ✓ ${blockCount} blocks`);
    // #endregion

    // #region Hashtags
    console.log("  Creating hashtags...");
    const hashtags = await Promise.all(
        HASHTAG_NAMES.map((name) => prisma.hashtag.create({ data: { name } })),
    );
    console.log(`  ✓ ${hashtags.length} hashtags`);
    // #endregion

    // #region Posts (40)
    console.log("  Creating posts...");
    const postPrivacies = [PostPrivacy.Public, PostPrivacy.Public, PostPrivacy.FriendsOnly, PostPrivacy.OnlyMe];
    const posts = await Promise.all(
        Array.from({ length: 40 }).map((_, i) => {
            const user = users[i % users.length];
            return prisma.post.create({
                data: {
                    content: pick(POST_CONTENTS),
                    type: PostType.Original,
                    privacy: pick(postPrivacies),
                    userId: user.id,
                    createdAt: randomDate(new Date("2025-01-01"), new Date()),
                    media: i % 3 === 0
                        ? { create: [{ url: pick(IMAGE_URLS), type: PostMediaType.Image, order: 0 }] }
                        : undefined,
                    hashtags: {
                        create: pickMany(hashtags, randomInt(1, 3)).map((h) => ({ hashtagId: h.id })),
                    },
                },
            });
        }),
    );
    console.log(`  ✓ ${posts.length} posts`);
    // #endregion

    // #region Shared posts (10)
    console.log("  Creating shared posts...");
    const sourcePosts = pickMany(posts, 10);
    const sharedPosts = await Promise.all(
        sourcePosts.map((source) =>
            prisma.post.create({
                data: {
                    type: PostType.Shared,
                    privacy: PostPrivacy.Public,
                    userId: pick(users).id,
                    sharedPostId: source.id,
                    createdAt: randomDate(new Date("2025-06-01"), new Date()),
                },
            }),
        ),
    );
    console.log(`  ✓ ${sharedPosts.length} shared posts`);
    // #endregion

    // #region PostLikes
    console.log("  Creating post likes...");
    const allPosts = [...posts, ...sharedPosts];
    const reactionTypes = Object.values(ReactionType);
    const likedPairs = new Set<string>();
    let likeCount = 0;
    for (const post of allPosts) {
        const likers = pickMany(users, randomInt(2, 10));
        for (const u of likers) {
            const key = `${u.id}-${post.id}`;
            if (!likedPairs.has(key)) {
                likedPairs.add(key);
                await prisma.postLike.create({
                    data: { userId: u.id, postId: post.id, reactionType: pick(reactionTypes) },
                });
                likeCount++;
            }
        }
    }
    console.log(`  ✓ ${likeCount} post likes`);
    // #endregion

    // #region PostSaves
    console.log("  Creating post saves...");
    const savedPairs = new Set<string>();
    let saveCount = 0;
    for (const u of users) {
        for (const post of pickMany(allPosts, randomInt(1, 5))) {
            const key = `${u.id}-${post.id}`;
            if (!savedPairs.has(key)) {
                savedPairs.add(key);
                await prisma.postSave.create({ data: { userId: u.id, postId: post.id } });
                saveCount++;
            }
        }
    }
    console.log(`  ✓ ${saveCount} post saves`);
    // #endregion

    // #region PostShares
    console.log("  Creating post shares...");
    const sharePairs = new Set<string>();
    let shareCount = 0;
    for (let i = 0; i < 30; i++) {
        const u = pick(users);
        const post = pick(allPosts);
        const key = `${u.id}-${post.id}`;
        if (!sharePairs.has(key)) {
            sharePairs.add(key);
            await prisma.postShare.create({ data: { userId: u.id, postId: post.id } });
            shareCount++;
        }
    }
    console.log(`  ✓ ${shareCount} post shares`);
    // #endregion

    // #region Comments & Replies
    console.log("  Creating comments and replies...");
    let commentCount = 0;
    let replyCount = 0;
    let commentLikeCount = 0;
    let replyLikeCount = 0;
    for (const post of pickMany(allPosts, 30)) {
        const commentors = pickMany(users, randomInt(2, 5));
        for (const u of commentors) {
            const comment = await prisma.postComment.create({
                data: {
                    content: pick(COMMENT_CONTENTS),
                    postId: post.id,
                    userId: u.id,
                    createdAt: randomDate(new Date("2025-01-01"), new Date()),
                },
            });
            commentCount++;
            for (const liker of pickMany(users, randomInt(1, 4))) {
                const clKey = `${liker.id}-${comment.id}`;
                if (!likedPairs.has(clKey)) {
                    likedPairs.add(clKey);
                    await prisma.commentLike.create({
                        data: { userId: liker.id, commentId: comment.id, reactionType: pick(reactionTypes) },
                    });
                    commentLikeCount++;
                }
            }
            if (Math.random() > 0.4) {
                const reply = await prisma.commentReply.create({
                    data: {
                        content: pick(REPLY_CONTENTS),
                        commentId: comment.id,
                        userId: pick(users).id,
                        createdAt: randomDate(new Date("2025-01-01"), new Date()),
                    },
                });
                replyCount++;
                for (const liker of pickMany(users, randomInt(0, 3))) {
                    const rlKey = `rl-${liker.id}-${reply.id}`;
                    if (!likedPairs.has(rlKey)) {
                        likedPairs.add(rlKey);
                        await prisma.replyLike.create({
                            data: { userId: liker.id, replyId: reply.id, reactionType: pick(reactionTypes) },
                        });
                        replyLikeCount++;
                    }
                }
            }
        }
    }
    console.log(`  ✓ ${commentCount} comments, ${replyCount} replies, ${commentLikeCount} comment likes, ${replyLikeCount} reply likes`);
    // #endregion

    // #region Stories
    console.log("  Creating stories...");
    const storyPrivacies = [StoryPrivacy.Public, StoryPrivacy.FriendsOnly, StoryPrivacy.CloseFriends];
    const stories: { id: number }[] = [];
    for (const u of users) {
        const count = randomInt(1, 3);
        for (let i = 0; i < count; i++) {
            const story = await prisma.story.create({
                data: {
                    mediaUrl: pick(IMAGE_URLS),
                    caption: Math.random() > 0.5 ? pick(POST_CONTENTS) : null,
                    privacy: pick(storyPrivacies),
                    userId: u.id,
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
                    createdAt: randomDate(new Date("2025-10-01"), new Date()),
                },
            });
            stories.push(story);
        }
    }
    console.log(`  ✓ ${stories.length} stories`);

    let storyViewCount = 0;
    let storyReactionCount = 0;
    const svPairs = new Set<string>();
    for (const story of stories) {
        for (const u of pickMany(users, randomInt(2, 8))) {
            const key = `${story.id}-${u.id}`;
            if (!svPairs.has(key)) {
                svPairs.add(key);
                await prisma.storyView.create({ data: { storyId: story.id, userId: u.id } });
                storyViewCount++;
                if (Math.random() > 0.5) {
                    await prisma.storyReaction.create({
                        data: { storyId: story.id, userId: u.id, reaction: pick(reactionTypes) },
                    });
                    storyReactionCount++;
                }
            }
        }
    }
    console.log(`  ✓ ${storyViewCount} story views, ${storyReactionCount} story reactions`);
    // #endregion

    // #region Conversations & Messages
    console.log("  Creating conversations and messages...");
    let msgCount = 0;
    let convCount = 0;
    for (let i = 0; i < 15; i++) {
        const [userA, userB] = pickMany(users, 2);
        const conv = await prisma.conversation.create({
            data: {
                isGroup: false,
                participants: {
                    create: [
                        { userId: userA.id, isAdmin: true },
                        { userId: userB.id },
                    ],
                },
            },
        });
        convCount++;
        const sender = Math.random() > 0.5 ? userA : userB;
        const receiver = sender.id === userA.id ? userB : userA;
        const msgQty = randomInt(3, 8);
        for (let j = 0; j < msgQty; j++) {
            const actualSender = j % 2 === 0 ? sender : receiver;
            const msg = await prisma.message.create({
                data: {
                    content: pick(MESSAGE_TEXTS),
                    type: MessageType.Text,
                    status: MessageStatus.Read,
                    senderId: actualSender.id,
                    conversationId: conv.id,
                    createdAt: randomDate(new Date("2025-06-01"), new Date()),
                },
            });
            msgCount++;
            if (Math.random() > 0.7) {
                await prisma.messageReaction.create({
                    data: { messageId: msg.id, userId: receiver.id, reactionType: pick(reactionTypes) },
                });
            }
        }
    }
    // 3 group conversations
    for (let i = 0; i < 3; i++) {
        const members = pickMany(users, randomInt(3, 6));
        const conv = await prisma.conversation.create({
            data: {
                isGroup: true,
                name: `Group Chat ${i + 1}`,
                coverUrl: pick(IMAGE_URLS),
                participants: {
                    create: members.map((m, idx) => ({ userId: m.id, isAdmin: idx === 0 })),
                },
            },
        });
        convCount++;
        for (let j = 0; j < randomInt(5, 12); j++) {
            await prisma.message.create({
                data: {
                    content: pick(MESSAGE_TEXTS),
                    type: MessageType.Text,
                    status: MessageStatus.Delivered,
                    senderId: pick(members).id,
                    conversationId: conv.id,
                    createdAt: randomDate(new Date("2025-09-01"), new Date()),
                },
            });
            msgCount++;
        }
    }
    console.log(`  ✓ ${convCount} conversations, ${msgCount} messages`);
    // #endregion

    // #region Groups
    console.log("  Creating groups...");
    const groupPrivacies = [GroupPrivacy.Public, GroupPrivacy.Private, GroupPrivacy.Secret];
    const groupList: { id: number }[] = [];
    for (let i = 0; i < GROUP_NAMES.length; i++) {
        const owner = users[i % users.length];
        const name = GROUP_NAMES[i];
        const group = await prisma.group.create({
            data: {
                name,
                slug: `${slug(name)}-${i}`,
                description: GROUP_DESCS[i],
                coverUrl: pick(IMAGE_URLS),
                avatarUrl: pick(AVATAR_URLS),
                privacy: pick(groupPrivacies),
                ownerId: owner.id,
                members: {
                    create: [
                        { userId: owner.id, role: GroupMemberRole.Admin, status: GroupMemberStatus.Approved },
                        ...pickMany(users.filter((u) => u.id !== owner.id), randomInt(4, 10)).map((u) => ({
                            userId: u.id,
                            role: GroupMemberRole.Member,
                            status: pick([GroupMemberStatus.Approved, GroupMemberStatus.Pending]),
                        })),
                    ],
                },
            },
        });
        groupList.push(group);
    }
    console.log(`  ✓ ${groupList.length} groups`);

    let groupPostCount = 0;
    let groupCommentCount = 0;
    let groupLikeCount = 0;
    for (const group of groupList) {
        for (let p = 0; p < randomInt(3, 7); p++) {
            const author = pick(users);
            const gpost = await prisma.groupPost.create({
                data: {
                    content: pick(POST_CONTENTS),
                    mediaUrl: Math.random() > 0.6 ? pick(IMAGE_URLS) : null,
                    groupId: group.id,
                    userId: author.id,
                    createdAt: randomDate(new Date("2025-01-01"), new Date()),
                },
            });
            groupPostCount++;
            for (const liker of pickMany(users, randomInt(1, 6))) {
                const key = `gpl-${liker.id}-${gpost.id}`;
                if (!likedPairs.has(key)) {
                    likedPairs.add(key);
                    await prisma.groupPostLike.create({
                        data: { userId: liker.id, groupPostId: gpost.id, reactionType: pick(reactionTypes) },
                    });
                    groupLikeCount++;
                }
            }
            for (let c = 0; c < randomInt(0, 4); c++) {
                await prisma.groupPostComment.create({
                    data: {
                        content: pick(COMMENT_CONTENTS),
                        groupPostId: gpost.id,
                        userId: pick(users).id,
                    },
                });
                groupCommentCount++;
            }
        }
    }
    console.log(`  ✓ ${groupPostCount} group posts, ${groupLikeCount} group likes, ${groupCommentCount} group comments`);
    // #endregion

    // #region Pages
    console.log("  Creating pages...");
    const pageCategories = Object.values(PageCategory);
    const pageList: { id: number }[] = [];
    for (let i = 0; i < PAGE_NAMES.length; i++) {
        const owner = users[i % users.length];
        const name = PAGE_NAMES[i];
        const page = await prisma.page.create({
            data: {
                name,
                slug: `${slug(name)}-${i}`,
                description: `Official page of ${name}. Stay tuned for updates!`,
                coverUrl: pick(IMAGE_URLS),
                avatarUrl: pick(AVATAR_URLS),
                category: pick(pageCategories),
                isVerified: Math.random() > 0.6,
                ownerId: owner.id,
            },
        });
        pageList.push(page);
        for (const follower of pickMany(users, randomInt(3, 12))) {
            await prisma.pageFollower.create({ data: { userId: follower.id, pageId: page.id } }).catch(() => {});
        }
    }
    console.log(`  ✓ ${pageList.length} pages`);

    let pagePostCount = 0;
    let pageLikeCount = 0;
    let pageCommentCount = 0;
    for (const page of pageList) {
        for (let p = 0; p < randomInt(3, 6); p++) {
            const ppost = await prisma.pagePost.create({
                data: {
                    content: pick(POST_CONTENTS),
                    mediaUrl: Math.random() > 0.5 ? pick(IMAGE_URLS) : null,
                    pageId: page.id,
                    userId: pick(users).id,
                    createdAt: randomDate(new Date("2025-01-01"), new Date()),
                },
            });
            pagePostCount++;
            for (const liker of pickMany(users, randomInt(1, 8))) {
                const key = `ppl-${liker.id}-${ppost.id}`;
                if (!likedPairs.has(key)) {
                    likedPairs.add(key);
                    await prisma.pagePostLike.create({
                        data: { userId: liker.id, pagePostId: ppost.id, reactionType: pick(reactionTypes) },
                    });
                    pageLikeCount++;
                }
            }
            for (let c = 0; c < randomInt(0, 4); c++) {
                await prisma.pagePostComment.create({
                    data: {
                        content: pick(COMMENT_CONTENTS),
                        pagePostId: ppost.id,
                        userId: pick(users).id,
                    },
                });
                pageCommentCount++;
            }
        }
    }
    console.log(`  ✓ ${pagePostCount} page posts, ${pageLikeCount} page likes, ${pageCommentCount} page comments`);
    // #endregion

    // #region Events
    console.log("  Creating events...");
    const eventPrivacies = [EventPrivacy.Public, EventPrivacy.FriendsOnly, EventPrivacy.Private];
    const attendeeStatuses = Object.values(AttendeeStatus);
    const eventList: { id: number }[] = [];
    for (let i = 0; i < EVENT_TITLES.length; i++) {
        const creator = users[i % users.length];
        const title = EVENT_TITLES[i];
        const startDate = randomDate(new Date("2026-04-01"), new Date("2026-12-31"));
        const event = await prisma.event.create({
            data: {
                title,
                slug: `${slug(title)}-${i}`,
                description: `Join us for ${title}. It's going to be epic!`,
                coverUrl: pick(IMAGE_URLS),
                location: pick(LOCATIONS),
                isOnline: Math.random() > 0.7,
                privacy: pick(eventPrivacies),
                startDate,
                endDate: new Date(startDate.getTime() + 1000 * 60 * 60 * randomInt(2, 8)),
                creatorId: creator.id,
            },
        });
        eventList.push(event);
        for (const u of pickMany(users, randomInt(3, 12))) {
            await prisma.eventAttendee.create({
                data: { eventId: event.id, userId: u.id, status: pick(attendeeStatuses) },
            }).catch(() => {});
        }
    }
    console.log(`  ✓ ${eventList.length} events`);
    // #endregion

    // #region Notifications
    console.log("  Creating notifications...");
    const notifTypes = Object.values(NotificationType);
    let notifCount = 0;
    for (let i = 0; i < 60; i++) {
        const [receiver, sender] = pickMany(users, 2);
        await prisma.notification.create({
            data: {
                type: pick(notifTypes),
                content: `You have a new notification from ${sender.userName}.`,
                userId: receiver.id,
                senderId: sender.id,
                createdAt: randomDate(new Date("2025-01-01"), new Date()),
            },
        });
        notifCount++;
    }
    console.log(`  ✓ ${notifCount} notifications`);
    // #endregion

    // #region ReportedContent
    console.log("  Creating reports...");
    const reportTypes = Object.values(ReportType);
    const reportStatuses = Object.values(ReportStatus);
    for (let i = 0; i < 12; i++) {
        const [reporter, reported] = pickMany(users, 2);
        await prisma.reportedContent.create({
            data: {
                reportType: pick(reportTypes),
                reason: "This content violates community guidelines.",
                status: pick(reportStatuses),
                contentId: randomInt(1, 40),
                reportingUserId: reporter.id,
                reportedUserId: reported.id,
            },
        });
    }
    console.log("  ✓ 12 reports");
    // #endregion

    // #region ModerationLogs
    console.log("  Creating moderation logs...");
    const moderators = users.filter((u) => u.role === UserRole.Admin || u.role === UserRole.Moderator);
    const modActions = Object.values(ModerationAction);
    for (let i = 0; i < 10; i++) {
        const mod = pick(moderators);
        const target = pick(users);
        await prisma.moderationLog.create({
            data: {
                actionType: pick(modActions),
                details: `Action taken against ${target.userName} for policy violation.`,
                moderatorUserId: mod.id,
                targetUserId: target.id,
                targetContentId: randomInt(1, 40),
            },
        });
    }
    console.log("  ✓ 10 moderation logs");
    // #endregion

    console.log("\n✅ Seeding complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
