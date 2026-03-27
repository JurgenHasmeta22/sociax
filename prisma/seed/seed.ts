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
    return shuffled.slice(0, Math.min(count, shuffled.length));
};

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomDate = (start: Date, end: Date) =>
    new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const slugify = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function runInChunks<T>(items: T[], size: number, fn: (item: T) => Promise<unknown>) {
    for (let i = 0; i < items.length; i += size) {
        await Promise.all(items.slice(i, i + size).map(fn));
    }
}
// #endregion

// #region Static data
const FIRST_NAMES = [
    "Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah",
    "Ivan", "Julia", "Kevin", "Laura", "Mike", "Nina", "Oscar", "Paula",
    "Quinn", "Rachel", "Sam", "Tina", "Uma", "Victor", "Wendy", "Xander",
    "Yasmine", "Zack", "Aaron", "Bella", "Calvin", "Daisy", "Eli", "Faith",
    "Gavin", "Holly", "Isaac", "Jade", "Kyle", "Luna", "Mason", "Nora",
    "Owen", "Piper", "Reid", "Rose", "Seth", "Tracy", "Ulysses", "Vera",
    "Wade", "Xena", "Yara", "Zoe",
];
const LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson",
    "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee",
    "White", "Harris", "Clark", "Lewis", "Robinson", "Walker", "Hall",
    "Allen", "Young", "King", "Scott", "Green", "Baker", "Adams", "Nelson",
    "Carter", "Mitchell", "Perez", "Roberts", "Turner",
];
const LOCATIONS = [
    "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX",
    "Phoenix, AZ", "Philadelphia, PA", "San Antonio, TX", "San Diego, CA",
    "Dallas, TX", "San Jose, CA", "London, UK", "Paris, France",
    "Berlin, Germany", "Tokyo, Japan", "Sydney, Australia",
    "Toronto, Canada", "Amsterdam, Netherlands", "Barcelona, Spain",
    "Seoul, South Korea", "Sao Paulo, Brazil", "Dubai, UAE",
    "Singapore", "Mumbai, India", "Mexico City, Mexico", "Rome, Italy",
    "Vienna, Austria", "Stockholm, Sweden", "Oslo, Norway", "Zurich, Switzerland",
    "Cape Town, South Africa",
];
const BIOS = [
    "Just here to vibe and connect.",
    "Coffee addict. Dog lover. Amateur chef.",
    "Making memories one day at a time.",
    "Wanderlust. Photography. Music.",
    "Developer by day, gamer by night.",
    "Chasing sunsets and good conversations.",
    "Living life on my own terms.",
    "Books, hiking, and strong opinions.",
    "Trying to adult. Failing gracefully.",
    "Mostly harmless.",
    "Always chasing the next adventure.",
    "Plant-based foodie & yoga enthusiast.",
    "Startup founder | Angel investor | Speaker.",
    "Former teacher, current learner.",
    "Cyclist, photographer, coffee snob.",
    "Mom of 3. Chaos coordinator. Survivor.",
    "Turning dreams into side projects since 2020.",
    "Music producer & part-time philosopher.",
    "Dog dad. Beach life. Good vibes only.",
    "Just a human being trying to be human.",
    "Creative director with a passion for type.",
    "Running fast, thinking slow.",
    "Fuelled by curiosity and cold brew.",
    "Introvert who loves extrovert experiences.",
    "I post too much and apologise too little.",
];
const POST_CONTENTS = [
    "Just had the most amazing brunch!",
    "Can't believe how fast this year is flying by.",
    "Anyone else obsessed with this new show on Netflix?",
    "Working from home hits different when the sun is out.",
    "That moment when your code finally works after 3 hours.",
    "Going hiking this weekend, who's in?",
    "Reminder: drink water, go outside, be kind.",
    "Hot take: pineapple absolutely belongs on pizza.",
    "Monday motivation: you got this.",
    "Nothing beats a good book and a rainy afternoon.",
    "Just adopted a puppy! My life is complete.",
    "Road trip vibes. No destination, just adventure.",
    "Trying to learn guitar. Neighbors probably hate me.",
    "Sleep is underrated. I said what I said.",
    "Finished a 10k today! New personal best!",
    "Making homemade pasta for the first time. Pray for me.",
    "Sunset at the beach hits different every single time.",
    "Unpopular opinion: mornings are actually great.",
    "Started my own garden. First tomato incoming.",
    "Two years at this job. Time flies when you love what you do.",
    "Just booked a spontaneous solo trip. Send help and suggestions.",
    "Hot take: remote work is the greatest invention of the 21st century.",
    "The sky looked absolutely insane today. Nature said: look at me.",
    "Finally cleaned my desk. Productivity unlocked.",
    "If you haven't tried cold brew at home yet, what are you doing?",
    "Stayed up until 2am reading. Zero regrets.",
    "Therapy is cool and also hard and also necessary.",
    "Started meditating. Day 3. Already feel like a changed person.",
    "Cooking with friends is better than going to restaurants.",
    "You ever just sit and think about how weird time is?",
    "New haircut, new me. Same anxieties, better hair.",
    "Spring cleaning my life, not just my apartment.",
    "Spent the whole day outside. Highly recommend.",
    "Finished building my portfolio site. Six months in the making.",
    "Shoutout to everyone grinding silently. Your time is coming.",
    "Late night walks are underrated as a coping mechanism.",
    "Sometimes the most productive thing is to do nothing.",
    "Big fan of starting over whenever I feel like it.",
    "Learning to say no is honestly a superpower.",
    "I love my friends more than I tell them. Consider this the telling.",
    "2026 is the year of doing things that scare me a little.",
    "Spent the morning volunteering. My heart is full.",
    "Finally watched that movie everyone was talking about last year.",
    "Unplug for one day and suddenly you have all the thoughts.",
    "Never stop learning. It keeps you humble.",
    "Woke up at 6am by choice. Proud and confused.",
    "Weekend project: teach myself to bake sourdough. Updates incoming.",
    "Nothing humbles you like trying a new sport for the first time.",
    "First day of winter and I'm already dreaming of summer.",
    "Sometimes a long drive with good music is the best therapy.",
];
const COMMENT_CONTENTS = [
    "This is so relatable!",
    "Omg same",
    "Love this so much!",
    "You're so right tbh",
    "This made my day!",
    "Preach!!",
    "I needed this today.",
    "Totally agree with you.",
    "Have you tried doing it differently?",
    "This is goals right here.",
    "Why is this so true lol",
    "Amazing, keep it up!",
    "Wish I could do this.",
    "Tag me next time!",
    "Okay but this slaps.",
    "I'm saving this!",
    "How do you always nail it?",
    "This is exactly what I needed to read today.",
    "Sending this to everyone I know.",
    "OK but can we talk about this more?",
    "You just described my life.",
    "The accuracy of this post is unreal.",
    "Genuinely inspired right now.",
    "More people need to see this.",
    "I feel so seen right now.",
    "Take my like, my comment, and my follow.",
    "Said what needed to be said.",
    "This is giving main character energy.",
    "Can you share more about this?",
    "Absolutely love this perspective.",
];
const REPLY_CONTENTS = [
    "Haha exactly my thoughts!",
    "Right?? I was thinking the same thing.",
    "Thanks for saying this!",
    "For real though.",
    "You always come through with the best takes.",
    "Couldn't agree more!",
    "You and me both honestly.",
    "Still thinking about this comment.",
    "The way you phrased that.",
    "This reply deserves its own post.",
];
const GROUP_NAMES = [
    "Photography Enthusiasts", "Coders And Developers Hub", "Travel Addicts",
    "Fitness And Wellness Community", "Movie Buffs Unite", "Book Club Central",
    "Foodies Paradise", "Gaming Legends", "Music for the Soul", "Startup Founders Network",
    "Design Inspiration", "Night Owls Club", "Remote Work Warriors", "Outdoor Adventures",
    "Pet Lovers United", "Mental Health Matters", "Language Learners", "DIY And Crafts",
    "Sustainable Living", "Career Growth Hub", "Finance And Investing", "Runners And Cyclists",
    "Street Photography", "Comedy Corner", "Anime And Manga Fans", "Sci-Fi Universe",
    "Home Chefs Network", "Meditation And Mindfulness", "Freelancers Connect", "Urban Explorers",
    "Climate Action", "Vintage Collectors", "Esports Tournament Hub", "Content Creators",
    "Night Photography", "Social Entrepreneurs", "Plant Parents", "Productivity Hackers",
    "Board Game Geeks", "Street Art Lovers",
];
const GROUP_DESCS = [
    "Share your best shots and get feedback from the community.",
    "A place for developers to share tips, projects, and jobs.",
    "Explore the world together through stories and photos.",
    "Workouts, meal prep, mental health - all welcome here.",
    "Discuss films, reviews, and recommendations.",
    "Monthly picks, reviews, and literary debates.",
    "Recipes, restaurant finds, and food photography.",
    "From casual to competitive, all gamers welcome.",
    "Discover new artists, share playlists, and connect.",
    "Network with founders, share learnings, find co-founders.",
    "Curated design inspiration for creatives.",
    "For those who come alive after midnight.",
    "Remote work tips, tools, and community.",
    "Hiking, climbing, camping and everything outdoor.",
    "Share pets, get advice, spread cuteness.",
    "A safe space to talk, share, and support.",
    "Practice languages together - every level welcome.",
    "Hand-making, upcycling, creative projects.",
    "Eco-friendly living, one habit at a time.",
    "Resumes, interviews, networking, and growth.",
    "Personal finance, crypto, stocks, and savings tips.",
    "Share routes, races, and training plans.",
    "Candid city shots and urban life photography.",
    "Memes, stand-up clips, and comic observations.",
    "Manga reviews, anime recs, and fan art.",
    "Hard sci-fi, space operas, and speculative futures.",
    "Home cooking experiments and recipe swaps.",
    "Breathwork, journaling, and meditation practice.",
    "Freelancing tips, client stories, rate discussions.",
    "Abandoned places, rooftops, and urban beauty.",
    "Climate news, green projects, and activism.",
    "Vintage fashion, records, and collectibles.",
    "Tournament brackets, team formation, and strategy.",
    "YouTube, newsletters - content creator support.",
    "Long exposure, astrophotography, and cityscapes.",
    "Social impact businesses and changemakers.",
    "Propagation tips, rare plants, and leaf appreciation.",
    "Time blocking, Notion templates, and focus hacks.",
    "Reviews, trades, and game nights.",
    "Murals, stencils, and public art appreciation.",
];
const PAGE_NAMES = [
    "TechInsider Daily", "The Culinary Lab", "Wanderlust Magazine",
    "FitLife Official", "CodeCraft Academy", "Indie Film Factory",
    "Urban Garden Society", "Digital Nomad Hub", "The Science Corner", "StartupWire",
    "Daily Dose of Design", "The Wellness Edit", "Economics Explained",
    "Pixel And Prose", "Mental Clarity", "EcoWatch Weekly", "The Career Guide",
    "Midnight Reads", "Global Sports Digest", "The Art Room",
    "Future Finance", "Street Stories", "Dev Weekly", "The Foodie Circle",
    "Mindful Mornings",
];
const PAGE_DESC_TPLS = [
    "Your daily source for the latest in technology and innovation.",
    "Recipes, techniques, and inspiration for home cooks everywhere.",
    "Inspiring travel stories, guides, and photo journals.",
    "Fitness tips, nutrition science, and motivation.",
    "Practical programming tutorials and developer resources.",
    "Independent film reviews, interviews, and festival coverage.",
    "Grow your own food and connect with urban gardeners.",
    "Resources and community for location-independent workers.",
    "Accessible science for curious minds.",
    "Startup news, funding rounds, and founder stories.",
    "Curated design content for creatives and visual thinkers.",
    "Holistic wellness content for mind, body, and spirit.",
    "Breaking down complex economics for everyday people.",
    "Photography, writing, and creative storytelling.",
    "Mental health resources, stories, and tools.",
    "Environmental news and sustainability guides.",
    "Career advice, job hunting tips, and interview prep.",
    "Book reviews, reading lists, and literary discussion.",
    "Coverage of global sports events and athlete stories.",
    "Showcasing emerging and established visual artists.",
    "Personal finance and investment education.",
    "Street photography and urban life documentation.",
    "Weekly curation of the best developer content.",
    "Restaurant reviews, recipes, and food culture.",
    "Morning routines and mindfulness practices.",
];
const EVENT_TITLES = [
    "City Hackathon 2026", "Rooftop Summer Party", "Online Coding Bootcamp",
    "Photography Walk Downtown", "Book Swap And Coffee Morning",
    "5K Charity Run", "Tech Talk AI in 2026",
    "Virtual Game Night", "Food Festival 2026", "Music Open Mic Night",
    "Startup Pitch Night", "Yoga in the Park", "Design Sprint Weekend",
    "Community Clean-Up Drive", "Film Screening Indie Night",
    "Language Exchange Meetup", "Night Market Pop-Up", "Web3 Workshop",
    "Fitness Challenge Kickoff", "Jazz in the Garden",
    "Social Entrepreneur Summit", "Board Game Marathon",
    "Street Art Tour", "Creative Writing Workshop", "Outdoor Bootcamp",
    "Podcast Recording Live", "Data Science Meetup",
    "Sustainability Expo 2026", "Comedy Open Mic", "Sunrise Hike",
];
const HASHTAG_NAMES = [
    "motivation", "travel", "food", "coding", "fitness", "music",
    "photography", "gaming", "books", "nature", "tech", "life",
    "friends", "weekend", "mondaymood", "growth", "coffee", "art",
    "design", "selfcare", "adventure", "health", "startup", "movies",
    "productivity", "mindfulness", "sustainability", "community", "learning", "creativity",
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
    "https://picsum.photos/seed/k11/800/600",
    "https://picsum.photos/seed/l12/800/600",
    "https://picsum.photos/seed/m13/800/600",
    "https://picsum.photos/seed/n14/800/600",
    "https://picsum.photos/seed/o15/800/600",
    "https://picsum.photos/seed/p16/800/600",
    "https://picsum.photos/seed/q17/800/600",
    "https://picsum.photos/seed/r18/800/600",
    "https://picsum.photos/seed/s19/800/600",
    "https://picsum.photos/seed/t20/800/600",
];
const AVATAR_URLS = Array.from({ length: 70 }, (_, i) => `https://i.pravatar.cc/150?img=${i + 1}`);
const MESSAGE_TEXTS = [
    "Hey, how's it going?",
    "Did you see that post earlier?",
    "We should catch up soon!",
    "Just checking in",
    "Long time no talk!",
    "What are your plans this weekend?",
    "Have you heard the news?",
    "Call me when you're free.",
    "Sending good vibes your way!",
    "Yo! What's up?",
    "I was just thinking about you.",
    "Did you finish that project?",
    "This week has been wild.",
    "Are you going to the event?",
    "Let's grab coffee sometime.",
    "Just got back - we need to talk.",
    "Night! Talk tomorrow?",
    "You doing okay? Haven't heard from you.",
    "That thing you said the other day stuck with me.",
    "Miss you already!",
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
    console.log("Seeding Sociax database (20x volume)...\n");

    await deleteAll();

    const POST_COUNT = 800;

    // #region Users (400)
    console.log("  Creating users...");
    const password = hashSync("Password123!", 10);
    const genders = [Gender.Male, Gender.Female, Gender.Other, Gender.PreferNotToSay];
    const privacies = [ProfilePrivacy.Public, ProfilePrivacy.Public, ProfilePrivacy.FriendsOnly, ProfilePrivacy.Private];

    const USER_COUNT = 400;
    const userDataList = Array.from({ length: USER_COUNT }, (_, i) => {
        const first = FIRST_NAMES[i % FIRST_NAMES.length];
        const last = LAST_NAMES[i % LAST_NAMES.length];
        const suffix = Math.floor(i / FIRST_NAMES.length);
        const userName = suffix === 0
            ? `${first.toLowerCase()}${last.toLowerCase()}`
            : `${first.toLowerCase()}${last.toLowerCase()}${suffix}`;
        const role = i === 0 ? UserRole.Admin : i === 1 ? UserRole.Moderator : UserRole.User;
        return { i, first, last, userName, role };
    });

    const users: { id: number }[] = [];
    await runInChunks(userDataList, 50, async (u) => {
        const created = await prisma.user.create({
            data: {
                userName: u.userName,
                email: `${u.userName}@sociax.dev`,
                password,
                firstName: u.first,
                lastName: u.last,
                bio: pick(BIOS),
                gender: pick(genders),
                location: pick(LOCATIONS),
                phone: `+1${randomInt(2000000000, 9999999999)}`,
                profilePrivacy: pick(privacies),
                active: true,
                role: u.role,
                birthday: randomDate(new Date("1970-01-01"), new Date("2002-12-31")),
                avatar: { create: { photoSrc: AVATAR_URLS[u.i % AVATAR_URLS.length] } },
                coverPhoto: { create: { photoSrc: pick(IMAGE_URLS) } },
            },
        });
        users.push(created);
    });
    console.log(`  -> ${users.length} users`);
    // #endregion

    // #region Follows
    console.log("  Creating follows...");
    const followPairs = new Set<string>();
    const followStateOptions = [FollowState.accepted, FollowState.accepted, FollowState.accepted, FollowState.pending];
    let followCount = 0;
    await runInChunks(users, 50, async (u) => {
        const targets = pickMany(users.filter((x) => x.id !== u.id), randomInt(10, 30));
        for (const t of targets) {
            const key = `${u.id}-${t.id}`;
            if (!followPairs.has(key)) {
                followPairs.add(key);
                await prisma.userFollow.create({
                    data: { followerId: u.id, followingId: t.id, state: pick(followStateOptions) },
                });
                followCount++;
            }
        }
    });
    console.log(`  -> ${followCount} follows`);
    // #endregion

    // #region Blocks
    console.log("  Creating blocks...");
    const blockPairs = new Set<string>();
    let blockCount = 0;
    for (let i = 0; i < 80; i++) {
        const [a, b] = pickMany(users, 2);
        const key = `${a.id}-${b.id}`;
        if (!blockPairs.has(key) && a.id !== b.id) {
            blockPairs.add(key);
            await prisma.userBlock.create({ data: { blockerId: a.id, blockedId: b.id } });
            blockCount++;
        }
    }
    console.log(`  -> ${blockCount} blocks`);
    // #endregion

    // #region Hashtags
    console.log("  Creating hashtags...");
    const hashtags = await Promise.all(
        HASHTAG_NAMES.map((name) => prisma.hashtag.create({ data: { name } })),
    );
    console.log(`  -> ${hashtags.length} hashtags`);
    // #endregion

    // #region Posts (800)
    console.log("  Creating posts...");
    const postPrivacies = [PostPrivacy.Public, PostPrivacy.Public, PostPrivacy.FriendsOnly, PostPrivacy.OnlyMe];
    const posts: { id: number }[] = [];
    await runInChunks(Array.from({ length: POST_COUNT }, (_, i) => i), 50, async (i) => {
        const user = users[i % users.length];
        const post = await prisma.post.create({
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
        posts.push(post);
    });
    console.log(`  -> ${posts.length} posts`);
    // #endregion

    // #region Shared posts (100)
    console.log("  Creating shared posts...");
    const sourcePosts = pickMany(posts, 100);
    const sharedPosts: { id: number }[] = [];
    await runInChunks(sourcePosts, 50, async (source) => {
        const sp = await prisma.post.create({
            data: {
                type: PostType.Shared,
                privacy: PostPrivacy.Public,
                userId: pick(users).id,
                sharedPostId: source.id,
                createdAt: randomDate(new Date("2025-06-01"), new Date()),
            },
        });
        sharedPosts.push(sp);
    });
    console.log(`  -> ${sharedPosts.length} shared posts`);
    // #endregion

    // #region PostLikes
    console.log("  Creating post likes...");
    const allPosts = [...posts, ...sharedPosts];
    const reactionTypes = Object.values(ReactionType);
    const likedPairs = new Set<string>();
    let likeCount = 0;
    await runInChunks(allPosts, 50, async (post) => {
        const likers = pickMany(users, randomInt(5, 25));
        for (const u of likers) {
            const key = `pl-${u.id}-${post.id}`;
            if (!likedPairs.has(key)) {
                likedPairs.add(key);
                await prisma.postLike.create({
                    data: { userId: u.id, postId: post.id, reactionType: pick(reactionTypes) },
                });
                likeCount++;
            }
        }
    });
    console.log(`  -> ${likeCount} post likes`);
    // #endregion

    // #region PostSaves
    console.log("  Creating post saves...");
    const savedPairs = new Set<string>();
    let saveCount = 0;
    await runInChunks(users, 50, async (u) => {
        for (const post of pickMany(allPosts, randomInt(3, 10))) {
            const key = `ps-${u.id}-${post.id}`;
            if (!savedPairs.has(key)) {
                savedPairs.add(key);
                await prisma.postSave.create({ data: { userId: u.id, postId: post.id } });
                saveCount++;
            }
        }
    });
    console.log(`  -> ${saveCount} post saves`);
    // #endregion

    // #region PostShares
    console.log("  Creating post shares...");
    const sharePairs = new Set<string>();
    let shareCount = 0;
    for (let i = 0; i < 300; i++) {
        const u = pick(users);
        const post = pick(allPosts);
        const key = `psh-${u.id}-${post.id}`;
        if (!sharePairs.has(key)) {
            sharePairs.add(key);
            await prisma.postShare.create({ data: { userId: u.id, postId: post.id } });
            shareCount++;
        }
    }
    console.log(`  -> ${shareCount} post shares`);
    // #endregion

    // #region Comments & Replies
    console.log("  Creating comments and replies...");
    let commentCount = 0;
    let replyCount = 0;
    let commentLikeCount = 0;
    let replyLikeCount = 0;
    const commentedPosts = pickMany(allPosts, 400);
    for (const post of commentedPosts) {
        const commentors = pickMany(users, randomInt(3, 10));
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
            for (const liker of pickMany(users, randomInt(1, 6))) {
                const clKey = `cl-${liker.id}-${comment.id}`;
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
                for (const liker of pickMany(users, randomInt(0, 4))) {
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
    console.log(`  -> ${commentCount} comments, ${replyCount} replies, ${commentLikeCount} comment likes, ${replyLikeCount} reply likes`);
    // #endregion

    // #region Stories
    console.log("  Creating stories...");
    const storyPrivacies = [StoryPrivacy.Public, StoryPrivacy.FriendsOnly, StoryPrivacy.CloseFriends];
    const stories: { id: number }[] = [];
    await runInChunks(users, 50, async (u) => {
        const count = randomInt(1, 4);
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
    });
    console.log(`  -> ${stories.length} stories`);

    let storyViewCount = 0;
    let storyReactionCount = 0;
    const svPairs = new Set<string>();
    await runInChunks(stories, 50, async (story) => {
        for (const u of pickMany(users, randomInt(4, 15))) {
            const key = `sv-${story.id}-${u.id}`;
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
    });
    console.log(`  -> ${storyViewCount} story views, ${storyReactionCount} story reactions`);
    // #endregion

    // #region Conversations & Messages
    console.log("  Creating conversations and messages...");
    let msgCount = 0;
    let convCount = 0;

    for (let i = 0; i < 300; i++) {
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
        const msgQty = randomInt(3, 12);
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

    for (let i = 0; i < 30; i++) {
        const members = pickMany(users, randomInt(3, 8));
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
        for (let j = 0; j < randomInt(5, 15); j++) {
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
    console.log(`  -> ${convCount} conversations, ${msgCount} messages`);
    // #endregion

    // #region Groups (200)
    console.log("  Creating groups...");
    const groupPrivacies = [GroupPrivacy.Public, GroupPrivacy.Private, GroupPrivacy.Secret];
    const GROUPS_COUNT = 200;
    const groupList: { id: number; slug: string }[] = [];

    await runInChunks(Array.from({ length: GROUPS_COUNT }, (_, i) => i), 20, async (i) => {
        const owner = users[i % users.length];
        const baseName = GROUP_NAMES[i % GROUP_NAMES.length];
        const name = i >= GROUP_NAMES.length ? `${baseName} ${Math.floor(i / GROUP_NAMES.length) + 1}` : baseName;
        const baseSlug = `${slugify(baseName)}-${i}`;
        const group = await prisma.group.create({
            data: {
                name,
                slug: baseSlug,
                description: GROUP_DESCS[i % GROUP_DESCS.length],
                coverUrl: pick(IMAGE_URLS),
                avatarUrl: pick(AVATAR_URLS),
                privacy: pick(groupPrivacies),
                ownerId: owner.id,
                members: {
                    create: [
                        { userId: owner.id, role: GroupMemberRole.Admin, status: GroupMemberStatus.Approved },
                        ...pickMany(users.filter((u) => u.id !== owner.id), randomInt(8, 25)).map((u) => ({
                            userId: u.id,
                            role: GroupMemberRole.Member,
                            status: pick([GroupMemberStatus.Approved, GroupMemberStatus.Pending]),
                        })),
                    ],
                },
            },
        });
        groupList.push({ id: group.id, slug: group.slug });
    });
    console.log(`  -> ${groupList.length} groups`);

    console.log("  Creating group posts/likes/comments...");
    let groupPostCount = 0;
    let groupCommentCount = 0;
    let groupLikeCount = 0;
    await runInChunks(groupList, 20, async (group) => {
        for (let p = 0; p < randomInt(5, 15); p++) {
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
            for (const liker of pickMany(users, randomInt(2, 12))) {
                const key = `gpl-${liker.id}-${gpost.id}`;
                if (!likedPairs.has(key)) {
                    likedPairs.add(key);
                    await prisma.groupPostLike.create({
                        data: { userId: liker.id, groupPostId: gpost.id, reactionType: pick(reactionTypes) },
                    });
                    groupLikeCount++;
                }
            }
            for (let c = 0; c < randomInt(0, 6); c++) {
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
    });
    console.log(`  -> ${groupPostCount} group posts, ${groupLikeCount} group likes, ${groupCommentCount} group comments`);
    // #endregion

    // #region Pages (200)
    console.log("  Creating pages...");
    const pageCategories = Object.values(PageCategory);
    const PAGES_COUNT = 200;
    const pageList: { id: number; slug: string }[] = [];

    await runInChunks(Array.from({ length: PAGES_COUNT }, (_, i) => i), 20, async (i) => {
        const owner = users[i % users.length];
        const baseName = PAGE_NAMES[i % PAGE_NAMES.length];
        const name = i >= PAGE_NAMES.length ? `${baseName} ${Math.floor(i / PAGE_NAMES.length) + 1}` : baseName;
        const baseSlug = `${slugify(baseName)}-${i}`;
        const page = await prisma.page.create({
            data: {
                name,
                slug: baseSlug,
                description: PAGE_DESC_TPLS[i % PAGE_DESC_TPLS.length],
                coverUrl: pick(IMAGE_URLS),
                avatarUrl: pick(AVATAR_URLS),
                category: pick(pageCategories),
                isVerified: Math.random() > 0.6,
                ownerId: owner.id,
            },
        });
        pageList.push({ id: page.id, slug: page.slug });
        for (const follower of pickMany(users, randomInt(5, 30))) {
            await prisma.pageFollower.create({ data: { userId: follower.id, pageId: page.id } }).catch(() => {});
        }
    });
    console.log(`  -> ${pageList.length} pages`);

    console.log("  Creating page posts/likes/comments...");
    let pagePostCount = 0;
    let pageLikeCount = 0;
    let pageCommentCount = 0;
    await runInChunks(pageList, 20, async (page) => {
        for (let p = 0; p < randomInt(4, 10); p++) {
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
            for (const liker of pickMany(users, randomInt(2, 15))) {
                const key = `ppl-${liker.id}-${ppost.id}`;
                if (!likedPairs.has(key)) {
                    likedPairs.add(key);
                    await prisma.pagePostLike.create({
                        data: { userId: liker.id, pagePostId: ppost.id, reactionType: pick(reactionTypes) },
                    });
                    pageLikeCount++;
                }
            }
            for (let c = 0; c < randomInt(0, 6); c++) {
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
    });
    console.log(`  -> ${pagePostCount} page posts, ${pageLikeCount} page likes, ${pageCommentCount} page comments`);
    // #endregion

    // #region Events (200)
    console.log("  Creating events...");
    const eventPrivacies = [EventPrivacy.Public, EventPrivacy.FriendsOnly, EventPrivacy.Private];
    const attendeeStatuses = [AttendeeStatus.Going, AttendeeStatus.Interested];
    const EVENTS_COUNT = 200;
    const eventList: { id: number }[] = [];

    await runInChunks(Array.from({ length: EVENTS_COUNT }, (_, i) => i), 20, async (i) => {
        const creator = users[i % users.length];
        const baseTitle = EVENT_TITLES[i % EVENT_TITLES.length];
        const title = i >= EVENT_TITLES.length ? `${baseTitle} (${Math.floor(i / EVENT_TITLES.length) + 1})` : baseTitle;
        const baseSlug = `${slugify(baseTitle)}-${i}`;
        const startDate = randomDate(new Date("2026-04-01"), new Date("2027-06-30"));
        const event = await prisma.event.create({
            data: {
                title,
                slug: baseSlug,
                description: `Join us for ${baseTitle}. It's going to be epic!`,
                coverUrl: pick(IMAGE_URLS),
                location: pick(LOCATIONS),
                isOnline: Math.random() > 0.7,
                privacy: pick(eventPrivacies),
                startDate,
                endDate: new Date(startDate.getTime() + 1000 * 60 * 60 * randomInt(2, 8)),
                creatorId: creator.id,
            },
        });
        eventList.push({ id: event.id });
        for (const u of pickMany(users, randomInt(5, 30))) {
            await prisma.eventAttendee.create({
                data: { eventId: event.id, userId: u.id, status: pick(attendeeStatuses) },
            }).catch(() => {});
        }
    });
    console.log(`  -> ${eventList.length} events`);
    // #endregion

    // #region Notifications (1200)
    console.log("  Creating notifications...");
    const notifTypes = Object.values(NotificationType);
    let notifCount = 0;
    for (let i = 0; i < 1200; i++) {
        const [receiver, sender] = pickMany(users, 2);
        await prisma.notification.create({
            data: {
                type: pick(notifTypes),
                content: `You have a new notification from user #${sender.id}.`,
                userId: receiver.id,
                senderId: sender.id,
                createdAt: randomDate(new Date("2025-01-01"), new Date()),
            },
        });
        notifCount++;
    }
    console.log(`  -> ${notifCount} notifications`);
    // #endregion

    // #region ReportedContent
    console.log("  Creating reports...");
    const reportTypes = Object.values(ReportType);
    const reportStatuses = Object.values(ReportStatus);
    for (let i = 0; i < 120; i++) {
        const [reporter, reported] = pickMany(users, 2);
        await prisma.reportedContent.create({
            data: {
                reportType: pick(reportTypes),
                reason: "This content violates community guidelines.",
                status: pick(reportStatuses),
                contentId: randomInt(1, POST_COUNT),
                reportingUserId: reporter.id,
                reportedUserId: reported.id,
            },
        });
    }
    console.log("  -> 120 reports");
    // #endregion

    // #region ModerationLogs
    console.log("  Creating moderation logs...");
    const modActions = Object.values(ModerationAction);
    for (let i = 0; i < 100; i++) {
        const mod = users[i % 2];
        const target = pick(users);
        await prisma.moderationLog.create({
            data: {
                actionType: pick(modActions),
                details: "Action taken against user for policy violation.",
                moderatorUserId: mod.id,
                targetUserId: target.id,
                targetContentId: randomInt(1, POST_COUNT),
            },
        });
    }
    console.log("  -> 100 moderation logs");
    // #endregion

    console.log("\nSeeding complete! (400 users, 800 posts, 200 groups, 200 pages, 200 events)");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
