import "dotenv/config";
import {
    AttendeeStatus,
    FollowState,
    Gender,
    GroupMemberRole,
    GroupMemberStatus,
    GroupPrivacy,
    EventPrivacy,
    ListingCategory,
    ListingCondition,
    ListingStatus,
    MessageStatus,
    MessageType,
    ModerationAction,
    NotificationType,
    OfferStatus,
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
import { faker } from "@faker-js/faker";

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
const VIDEO_TITLES = [
    "My Morning Routine for 2026", "How I Built My First App in 30 Days",
    "Travel Vlog: Tokyo Street Food Tour", "5 Things I Wish I Knew Before Freelancing",
    "Ultimate Home Workout — No Equipment Needed", "Cooking Challenge: 5 Meals Under $10",
    "City Night Walk — London 4K", "Day in My Life as a Remote Developer",
    "The Best Coffee Shops in Amsterdam", "How to Actually Read More Books",
    "Minimalist Living: What I Got Rid Of", "Road Trip Across the USA — Part 1",
    "Learning Guitar at 30: Week 10 Update", "My Productivity System for 2026",
    "How I Built a $1k/Month Side Project", "Documentary: Urban Farming Revolution",
    "Top 10 VS Code Extensions in 2026", "Backpacking Europe on a Budget",
    "Meditation for Beginners — Day 1", "Behind the Lens: Street Photography Tips",
    "The Science of Getting Better Sleep", "Starting a Podcast from Scratch",
    "My Fitness Transformation — 6 Months", "Languages I'm Learning in 2026",
    "Weekend at a Tiny House Airbnb", "How to Make Sourdough Bread",
    "Running My First Marathon", "Inside a Startup Studio",
    "The 4-Hour Workweek Actually Works", "Night Photography Masterclass",
];
const VIDEO_DESCS = [
    "Join me as I walk through my daily routine and share tips that have changed my life.",
    "A deep dive into how I went from idea to launch in just 30 days.",
    "Exploring the incredible street food scene in Tokyo — bites, prices, and favorites.",
    "Hard lessons learned from 3 years of freelancing. Watch before you quit your job.",
    "A complete 30-minute home workout you can do anywhere, anytime.",
    "Can I feed myself for a week with just $50? Let's find out.",
    "A cinematic walk through London at night. Perfect for relaxing.",
    "What does a typical day look like for a remote developer in 2026?",
    "I visited 15 coffee shops in Amsterdam so you don't have to.",
    "My honest review of the methods I use to read 50+ books a year.",
    "A tour of my apartment after my minimalism experiment. Less really is more.",
    "Day 1 of our cross-country road trip. National parks, diners, and chaos.",
    "Week 10 of learning guitar. Sharing progress and struggles.",
    "The exact productivity system I use to run two projects and stay sane.",
    "Breaking down how my side project went from $0 to $1,000/month.",
    "A short documentary about people growing food in unexpected urban places.",
    "My favorite VS Code extensions that save me hours every week.",
    "Two weeks across Europe for under $1,200. Here's how.",
    "Complete beginner guide to starting a meditation practice.",
    "Tips and behind-the-scenes from a day of street photography.",
    "What research says about sleep and how to actually improve yours.",
    "Everything you need to start a podcast — gear, software, and workflow.",
    "Documenting my 6-month fitness transformation: before, during, after.",
    "My language learning stack and weekly routine for three languages.",
    "Staying in a tiny house for the weekend — pros, cons, and vibes.",
    "Step-by-step sourdough bread for complete beginners.",
    "Training for and running my first marathon. What I learned.",
    "Inside the daily operations of a startup studio building 10 companies at once.",
    "My experiment living by the 4-hour workweek principles for 90 days.",
    "Long-exposure and astrophotography tips for beginners.",
];
const VIDEO_THUMBNAIL_URLS = Array.from({ length: 30 }, (_, i) => `https://picsum.photos/seed/vt${i + 1}/1280/720`);
const VIDEO_URLS = Array.from({ length: 30 }, (_, i) => `https://example-cdn.sociax.dev/videos/sample-${i + 1}.mp4`);

const BLOG_TITLES = [
    "Why I Deleted All My Social Media for 30 Days",
    "The Hidden Benefits of Waking Up at 5am",
    "What Nobody Tells You About Building a Startup",
    "How I Learned to Code in 6 Months",
    "The Art of Slow Travel: A Manifesto",
    "Why Remote Work Changed My Relationship with Time",
    "A Beginner's Guide to Personal Finance",
    "The Books That Changed How I Think",
    "What Minimalism Actually Taught Me",
    "My Mental Health Journey: Year Two",
    "Building in Public: The Good, Bad, and Ugly",
    "An Honest Review of 12 Productivity Apps",
    "How I Overcame Creative Block",
    "The Case for Doing Hard Things",
    "Learning a New Language as an Adult",
    "Why I Moved Abroad and Stayed",
    "The Economics of Content Creation",
    "How Meditation Changed My Work",
    "Everything I Ate For a Week and What I Learned",
    "The Future of Work Is Already Here",
    "Freelancing Isn't Freedom — It's a Different Kind of Job",
    "What Three Years of Daily Journaling Taught Me",
    "How to Actually Achieve Your Goals",
    "The Quiet Power of Saying No",
    "Building a Second Brain: My Note-Taking System",
    "How Running Changed My Mind",
    "Tech I No Longer Use and Why",
    "The Science of Forming Better Habits",
    "What I Wish I Knew Before Investing",
    "Life After Burnout: A Reflection",
];
const BLOG_EXCERPTS = [
    "I didn't expect to discover so much about myself during a 30-day digital detox.",
    "The science and personal experience behind early rising might surprise you.",
    "Three years in, here are the things the startup community won't prepare you for.",
    "A realistic breakdown of timelines, resources, and expectations.",
    "Slow travel isn't just a budget hack — it's a meaningful way to experience the world.",
    "Distributed work broke my assumptions about productivity and presence.",
    "You don't need to be a finance expert to take control of your money.",
    "A curated list with context on why each book mattered.",
    "What I expected vs. what actually happened after decluttering my life.",
    "A vulnerable look at what year two of therapy and self-work looks like.",
    "The unfiltered version of building something in public.",
    "Twelve apps. Three months. One conclusion.",
    "Creative blocks aren't obstacles. They're information.",
    "Comfort zones are fine. Growth lives just outside them.",
    "Every adult language learner has the same fears. Here's how I beat mine.",
];
const BLOG_CONTENTS = [
    "When I decided to delete every social media app from my phone for 30 days, I thought I'd be bored. What I actually found was a kind of clarity I hadn't experienced in years. The first week was uncomfortable — I kept reaching for my phone out of habit. But by week two, something shifted. I started cooking more, reading longer, and sleeping better. The notifications had been a constant low-level anxiety I'd normalized. Without them, I realized how much mental bandwidth I'd been sacrificing. I'm not saying social media is evil. I'm back on it now. But that month gave me a perspective I return to whenever I feel scattered.",
    "Three years ago I started waking up at 5am every day. Not because a productivity guru told me to, but because I needed time before my household woke up. What I discovered was that those early hours are mine in a way that no other part of the day is. I use them inconsistently: sometimes writing, sometimes running, sometimes just drinking coffee slowly. The point isn't the activity. It's the intentionality. Starting the day on your own terms, even just for one hour, changes the entire flavor of everything that follows.",
    "Here is the thing no one warns you about when you start a company: the psychological weight of it. You can read every startup book and still be blindsided by the loneliness of decision-making, the randomness of what takes off versus what doesn't, and the strange grief of letting go of your original idea. My startup pivoted twice. We fired people we liked. We raised money from people who later became difficult. None of it is in the framework documents. But all of it is survivable. And weirdly, it's also the most alive I've ever felt.",
    "I started learning to code at 27, with no technical background and no CS degree. The first two months were brutal. I failed tutorials, misunderstood fundamentals, and considered quitting weekly. But I kept a single rule: code something every day, even if it's just 15 minutes. By month three I had built a tool I actually used. By month five I was contributing to an open source project. By month six I had a job. What changed wasn't my aptitude — it was my tolerance for confusion. Learning to sit with not knowing is the actual skill.",
    "Slow travel is not a budget strategy. It's a philosophy. It means staying somewhere long enough to stop being a tourist. To know the baker's name, to have a regular table, to notice how the light changes in the afternoon. Fast travel optimizes for coverage — how many countries, how many photos. Slow travel optimizes for depth. I've lived for a month in cities that most people pass through in a day. I can tell you that depth always wins. You leave knowing something real. You leave having been somewhere, not just passing through.",
    "Remote work removed the commute, the small talk, and the office politics. What I didn't anticipate was how it would change my relationship with time itself. Without the forced structure of an office, I started noticing my own rhythms. I work better in the morning. I crash at 3pm. I get a second wind at 7pm. Now I structure my day around that reality. My output didn't decrease — it increased. And I stopped performing productivity for an audience and started actually practicing it.",
    "Personal finance isn't complicated. It's just uncomfortable. Looking at your bank statement, cutting subscriptions you forgot you had, acknowledging that your spending doesn't match your values — that's the hard part. The math is simple: spend less than you earn, invest the difference consistently, and wait. That's it. Everything else is noise, complexity added by people who profit from your confusion. Start with a budget you can keep, an emergency fund, and one index fund. The rest can wait.",
    "Reading changed me before I understood it was changing me. The books on this list didn't give me answers. They gave me better questions. Thinking Fast and Slow made me distrust my instincts in the best way. The Almanack of Naval Ravikant made me rethink what wealth actually means. Man's Search for Meaning gave me a framework for suffering. Not every book works for every person. But these worked for me at specific moments, and I suspect they'll work for someone reading this right now.",
    "I owned fewer things than I thought and still got rid of half of them. Minimalism isn't about living with 100 possessions or sleeping on the floor. It's about intentionality. Every item you own has a cost: storage space, mental overhead, maintenance. When I cleared out what I didn't use, I could finally see what I did use. My space felt calmer. My mornings took less time. The unexpected benefit was emotional — I stopped using objects as comfort and started using the space they created.",
    "Year two of therapy is quieter than year one. In year one, everything is discovery — you uncover patterns, understand your childhood, name the things that were nameless. Year two is integration. You know the patterns. Now you have to do something with them. It's slower work, less dramatic, more real. I still have the same anxious tendencies, the same defensive reflexes. But I catch them faster. I recover quicker. The goal was never to become a different person. It was to understand the one I am.",
];
const LISTING_TITLES = [
    "iPhone 15 Pro Max — Mint Condition", "Vintage Leather Sofa — 2-Seater",
    "Sony WH-1000XM5 Headphones", "Trek Mountain Bike 27.5\"",
    "Standing Desk — Oak Top White Frame", "Canon EOS R6 Mark II Body",
    "Gaming Chair — Ergonomic Home Office", "Mechanical Keyboard — Keychron K3",
    "Indoor Plants Bundle — 5 Plants", "Nintendo Switch OLED + 3 Games",
    "Coffee Table — Solid Walnut", "Dell UltraSharp 27\" 4K Monitor",
    "Yoga Mat + Blocks + Strap Set", "Dyson V12 Cordless Vacuum",
    "Electric Scooter — Xiaomi Pro 2", "Leather Jacket — Size M",
    "MacBook Air M2 2023 — 256GB", "IKEA KALLAX Shelving Unit",
    "Acoustic Guitar — Yamaha F310", "Bean Bag Chair — XL Grey",
    "Nespresso Vertuo Next Machine", "Small Aquarium Starter Kit",
    "GoPro Hero 12 Black — Barely Used", "Air Purifier — Levoit Core 400S",
    "PS5 Console + Extra Controller", "Road Bike — Carbon Frame Size 54",
    "Bookshelf — 5 Tier Rustic Wood", "Blender — Vitamix A3500",
    "Smart Home Starter Kit", "Desk Lamp — LED Wireless Charging",
];
const LISTING_DESCS = [
    "Used for only 6 months. Deep Purple, 256GB. No scratches, with original box and accessories.",
    "Beautiful vintage leather sofa in excellent condition. Minor wear consistent with age. Pick up only.",
    "Best-in-class noise cancelling headphones, lightly used for travel. Comes with case and cables.",
    "Trek Marlin 7 in excellent condition. Lightly used, recently serviced. Original RRP $750.",
    "Adjustable height desk, oak surface, 4 USB ports, cable management tray. 1yr old, near perfect.",
    "Low shutter count (~900 actuations). Includes battery, charger, strap. Body only, no lens.",
    "Ergonomic design, lumbar support, adjustable armrests. Good condition, used in home office only.",
    "Gateron Brown switches, backlit, compact 75% layout. Excellent condition with original keycaps.",
    "Includes pothos, snake plant, peace lily, spider plant, and monstera. All healthy and thriving.",
    "Great condition. Includes: Mario Kart 8, Zelda BOTW, Animal Crossing. Original box included.",
    "Solid walnut coffee table, oval top. One small scratch on underside only. 120x60cm footprint.",
    "U2722D, 4K, USB-C 90W charging. One dead pixel but unnoticeable. Selling due to upgrade.",
    "Lightly used mat, 6mm thick non-slip backing. Blocks and strap are basically brand new.",
    "V12 Detect in Nickel color. Runs perfectly, all accessories included. Selling because I upgraded.",
    "35km range, 25km/h top speed. Minor scuffs on base from regular use. Battery in great health.",
    "Genuine leather, barely worn. Great condition. Size Medium, fits like a medium-large.",
    "M2 chip, 8GB RAM, 256GB SSD, Midnight color. Light use, comes with charger and original box.",
    "4x4 cube storage unit in white. Some minor assembly marks but solid and sturdy structure.",
    "Full-size dreadnought guitar. Great for starter or practice. Comes with gig bag and extra strings.",
    "Huge bean bag in dark grey microsuede. Kept indoors, pet-free home, excellent condition.",
    "Capsule machine with milk frother. Works perfectly. Includes 20-capsule sampler pack.",
    "10-gallon tank with filter, heater, LED light, substrate and decor. Setup ready to go.",
    "Almost new — used on one dive trip only. All accessories + two extra batteries included.",
    "Covers 1500 sq ft, smart auto mode. Filter replaced 2 months ago, very clean unit.",
    "Disc edition, 825GB SSD. Includes DualSense controller x2. Selling due to upgrade.",
    "Lightweight carbon frame, Shimano 105 groupset. Size 54. Matching helmet included.",
    "Farmhouse style, solid pine. Some minor marks. Easy disassembly for transport.",
    "Vitamix A3500, top of the line. Self-cleaning, stainless steel, no dents or chips.",
    "Philips Hue starter pack + smart plugs, smart thermostat, and voice hub. All work perfectly.",
    "Minimalist LED desk lamp with 15W wireless charging base. Stepless dimming. Like new.",
];
const ALBUM_NAMES = [
    "Summer Memories", "Family Vacation 2025", "Graduation Day",
    "Wedding Photos", "Travel Highlights", "Weekend Adventures",
    "Nature Walks", "Food Favorites", "Friends Forever",
    "City Exploration", "Concert Nights", "Birthday Bash",
    "Road Trip 2026", "Home Sweet Home", "Work Milestones",
    "Fitness Journey", "Throwback Collection", "Autumn Vibes",
    "Beach Days", "Holiday Season",
];
// #endregion

// #region Faker generators — called fresh per row; unique content at any SCALE
const g = {
    firstName:     () => faker.person.firstName(),
    lastName:      () => faker.person.lastName(),
    bio:           () => faker.person.bio(),
    location:      () => `${faker.location.city()}, ${faker.location.country()}`,
    postContent:   () => faker.lorem.sentences({ min: 1, max: 3 }),
    comment:       () => faker.lorem.sentence({ min: 5, max: 15 }),
    reply:         () => faker.lorem.sentence({ min: 3, max: 10 }),
    message:       () => faker.lorem.sentence({ min: 3, max: 12 }),
    imageUrl:      () => `https://picsum.photos/seed/${faker.string.alphanumeric(8)}/800/600`,
    avatarUrl:     () => `https://i.pravatar.cc/150?img=${randomInt(1, 70)}`,
    thumbnailUrl:  () => `https://picsum.photos/seed/${faker.string.alphanumeric(8)}/1280/720`,
    videoUrl:      (i: number) => `https://example-cdn.sociax.dev/videos/v${i}.mp4`,
    groupName:     () => `${faker.word.adjective()} ${faker.word.noun()} Community`,
    groupDesc:     () => faker.company.catchPhrase(),
    pageName:      () => faker.company.name(),
    pageDesc:      () => faker.company.catchPhrase(),
    eventTitle:    () => faker.lorem.words({ min: 3, max: 5 }).split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" "),
    videoTitle:    () => faker.lorem.sentence({ min: 4, max: 8 }).replace(/\.$/, ""),
    videoDesc:     () => faker.lorem.paragraph(),
    blogTitle:     () => faker.lorem.sentence({ min: 5, max: 10 }).replace(/\.$/, ""),
    blogExcerpt:   () => faker.lorem.sentence({ min: 10, max: 20 }),
    blogContent:   () => faker.lorem.paragraphs({ min: 3, max: 6 }),
    listingTitle:  () => faker.commerce.productName(),
    listingDesc:   () => faker.commerce.productDescription(),
    albumName:     () => `${faker.word.adjective()} ${faker.word.noun()} Album`,
    groupChatName: () => `${faker.word.adjective()} ${faker.word.noun()} Chat`,
};
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
    await prisma.eventPostCommentLike.deleteMany();
    await prisma.eventPostComment.deleteMany();
    await prisma.eventPostLike.deleteMany();
    await prisma.eventPost.deleteMany();
    await prisma.eventHashtag.deleteMany();
    await prisma.eventAttendee.deleteMany();
    await prisma.event.deleteMany();
    await prisma.pagePostCommentLike.deleteMany();
    await prisma.pagePostComment.deleteMany();
    await prisma.pagePostLike.deleteMany();
    await prisma.pagePost.deleteMany();
    await prisma.pageFollower.deleteMany();
    await prisma.page.deleteMany();
    await prisma.groupPostCommentLike.deleteMany();
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
    await prisma.memory.deleteMany();
    await prisma.videoLike.deleteMany();
    await prisma.videoComment.deleteMany();
    await prisma.videoHashtag.deleteMany();
    await prisma.video.deleteMany();
    await prisma.blogLike.deleteMany();
    await prisma.blogHashtag.deleteMany();
    await prisma.blog.deleteMany();
    await prisma.albumPhoto.deleteMany();
    await prisma.album.deleteMany();
    await prisma.listingMessage.deleteMany();
    await prisma.listingOffer.deleteMany();
    await prisma.listingSave.deleteMany();
    await prisma.listingImage.deleteMany();
    await prisma.marketplaceListing.deleteMany();
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

// Change this single value to scale all seed volumes proportionally.
// SCALE=1 ≈ original seed, SCALE=3 ≈ previous run, SCALE=10 ≈ big traffic simulation.
const SCALE = 10;

async function main() {
    console.log(`Seeding Sociax database (SCALE=${SCALE})...\n`);

    await deleteAll();

    // Maximize SQLite write throughput for seeding (no durability needed)
    await prisma.$executeRawUnsafe("PRAGMA synchronous=OFF;");
    await prisma.$executeRawUnsafe("PRAGMA journal_mode=MEMORY;");
    await prisma.$executeRawUnsafe("PRAGMA cache_size=-131072;");
    await prisma.$executeRawUnsafe("PRAGMA temp_store=MEMORY;");

    // Helper: flush collected rows with createMany in safe SQLite-sized batches
    async function batchInsert<T extends object>(model: { createMany: (args: { data: T[] }) => Promise<unknown> }, data: T[]) {
        const BATCH = 500;
        for (let i = 0; i < data.length; i += BATCH)
            await model.createMany({ data: data.slice(i, i + BATCH) });
    }

    const POST_COUNT = 800 * SCALE;

    // #region Users (1200)
    console.log("  Creating users...");
    const password = hashSync("Password123!", 10);
    const genders = [Gender.Male, Gender.Female, Gender.Other, Gender.PreferNotToSay];
    const privacies = [ProfilePrivacy.Public, ProfilePrivacy.Public, ProfilePrivacy.FriendsOnly, ProfilePrivacy.Private];

    const USER_COUNT = 400 * SCALE;
    const userDataList = Array.from({ length: USER_COUNT }, (_, i) => {
        const first = g.firstName();
        const last = g.lastName();
        const userName = `${first.toLowerCase().replace(/[^a-z0-9]/g, "")}${last.toLowerCase().replace(/[^a-z0-9]/g, "")}${i}`;
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
                bio: g.bio(),
                gender: pick(genders),
                location: g.location(),
                phone: `+1${randomInt(2000000000, 9999999999)}`,
                profilePrivacy: pick(privacies),
                active: true,
                role: u.role,
                birthday: randomDate(new Date("1970-01-01"), new Date("2002-12-31")),
                avatar: { create: { photoSrc: g.avatarUrl() } },
                coverPhoto: { create: { photoSrc: g.imageUrl() } },
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
    const followData: { followerId: number; followingId: number; state: FollowState }[] = [];
    for (const u of users) {
        const targets = pickMany(users.filter((x) => x.id !== u.id), randomInt(10, 30));
        for (const t of targets) {
            const key = `${u.id}-${t.id}`;
            if (!followPairs.has(key)) {
                followPairs.add(key);
                followData.push({ followerId: u.id, followingId: t.id, state: pick(followStateOptions) });
            }
        }
    }
    await batchInsert(prisma.userFollow, followData);
    console.log(`  -> ${followData.length} follows`);
    // #endregion

    // #region Blocks
    console.log("  Creating blocks...");
    const blockPairs = new Set<string>();
    const blockData: { blockerId: number; blockedId: number }[] = [];
    for (let i = 0; i < 80 * SCALE; i++) {
        const [a, b] = pickMany(users, 2);
        const key = `${a.id}-${b.id}`;
        if (!blockPairs.has(key) && a.id !== b.id) {
            blockPairs.add(key);
            blockData.push({ blockerId: a.id, blockedId: b.id });
        }
    }
    await batchInsert(prisma.userBlock, blockData);
    console.log(`  -> ${blockData.length} blocks`);
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
                content: g.postContent(),
                type: PostType.Original,
                privacy: pick(postPrivacies),
                userId: user.id,
                createdAt: randomDate(new Date("2025-01-01"), new Date()),
                media: i % 3 === 0
                    ? { create: [{ url: g.imageUrl(), type: PostMediaType.Image, order: 0 }] }
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

    // #region Shared posts (300)
    console.log("  Creating shared posts...");
    const sourcePosts = pickMany(posts, Math.min(posts.length, 100 * SCALE));
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
    const postLikeData: { userId: number; postId: number; reactionType: ReactionType }[] = [];
    for (const post of allPosts) {
        for (const u of pickMany(users, randomInt(5, 25))) {
            const key = `pl-${u.id}-${post.id}`;
            if (!likedPairs.has(key)) {
                likedPairs.add(key);
                postLikeData.push({ userId: u.id, postId: post.id, reactionType: pick(reactionTypes) });
            }
        }
    }
    await batchInsert(prisma.postLike, postLikeData);
    console.log(`  -> ${postLikeData.length} post likes`);
    // #endregion

    // #region PostSaves
    console.log("  Creating post saves...");
    const savedPairs = new Set<string>();
    const postSaveData: { userId: number; postId: number }[] = [];
    for (const u of users) {
        for (const post of pickMany(allPosts, randomInt(3, 10))) {
            const key = `ps-${u.id}-${post.id}`;
            if (!savedPairs.has(key)) {
                savedPairs.add(key);
                postSaveData.push({ userId: u.id, postId: post.id });
            }
        }
    }
    await batchInsert(prisma.postSave, postSaveData);
    console.log(`  -> ${postSaveData.length} post saves`);
    // #endregion

    // #region PostShares
    console.log("  Creating post shares...");
    const sharePairs = new Set<string>();
    const postShareData: { userId: number; postId: number }[] = [];
    for (let i = 0; i < 300 * SCALE; i++) {
        const u = pick(users);
        const post = pick(allPosts);
        const key = `psh-${u.id}-${post.id}`;
        if (!sharePairs.has(key)) {
            sharePairs.add(key);
            postShareData.push({ userId: u.id, postId: post.id });
        }
    }
    await batchInsert(prisma.postShare, postShareData);
    console.log(`  -> ${postShareData.length} post shares`);
    // #endregion

    // #region Comments & Replies
    console.log("  Creating comments and replies...");
    let commentCount = 0;
    let replyCount = 0;
    let commentLikeCount = 0;
    let replyLikeCount = 0;
    const commentLikeData: { userId: number; commentId: number; reactionType: ReactionType }[] = [];
    const replyLikeData: { userId: number; replyId: number; reactionType: ReactionType }[] = [];
    const commentedPosts = pickMany(allPosts, Math.min(allPosts.length, 400 * SCALE));
    for (const post of commentedPosts) {
        const commentors = pickMany(users, randomInt(3, 10));
        for (const u of commentors) {
            const comment = await prisma.postComment.create({
                data: {
                    content: g.comment(),
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
                    commentLikeData.push({ userId: liker.id, commentId: comment.id, reactionType: pick(reactionTypes) });
                    commentLikeCount++;
                }
            }
            if (Math.random() > 0.4) {
                const reply = await prisma.commentReply.create({
                    data: {
                        content: g.reply(),
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
                        replyLikeData.push({ userId: liker.id, replyId: reply.id, reactionType: pick(reactionTypes) });
                        replyLikeCount++;
                    }
                }
            }
        }
    }
    await batchInsert(prisma.commentLike, commentLikeData);
    await batchInsert(prisma.replyLike, replyLikeData);
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
                    mediaUrl: g.imageUrl(),
                    caption: Math.random() > 0.5 ? g.postContent() : null,
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
    const storyViewData: { storyId: number; userId: number }[] = [];
    const storyReactionData: { storyId: number; userId: number; reaction: ReactionType }[] = [];
    for (const story of stories) {
        for (const u of pickMany(users, randomInt(4, 15))) {
            const key = `sv-${story.id}-${u.id}`;
            if (!svPairs.has(key)) {
                svPairs.add(key);
                storyViewData.push({ storyId: story.id, userId: u.id });
                storyViewCount++;
                if (Math.random() > 0.5) {
                    storyReactionData.push({ storyId: story.id, userId: u.id, reaction: pick(reactionTypes) });
                    storyReactionCount++;
                }
            }
        }
    }
    await batchInsert(prisma.storyView, storyViewData);
    await batchInsert(prisma.storyReaction, storyReactionData);
    console.log(`  -> ${storyViewCount} story views, ${storyReactionCount} story reactions`);
    // #endregion

    // #region Conversations & Messages
    console.log("  Creating conversations and messages...");
    let msgCount = 0;
    let convCount = 0;

    for (let i = 0; i < 300 * SCALE; i++) {
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
                    content: g.message(),
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

    for (let i = 0; i < 30 * SCALE; i++) {
        const members = pickMany(users, randomInt(3, 8));
        const conv = await prisma.conversation.create({
            data: {
                isGroup: true,
                name: g.groupChatName(),
                coverUrl: g.imageUrl(),
                participants: {
                    create: members.map((m, idx) => ({ userId: m.id, isAdmin: idx === 0 })),
                },
            },
        });
        convCount++;
        for (let j = 0; j < randomInt(5, 15); j++) {
            await prisma.message.create({
                data: {
                    content: g.message(),
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

    // #region Groups (600)
    console.log("  Creating groups...");
    const groupPrivacies = [GroupPrivacy.Public, GroupPrivacy.Private, GroupPrivacy.Secret];
    const GROUPS_COUNT = 200 * SCALE;
    const groupList: { id: number; slug: string }[] = [];

    await runInChunks(Array.from({ length: GROUPS_COUNT }, (_, i) => i), 20, async (i) => {
        const owner = users[i % users.length];
        const name = g.groupName();
        const baseSlug = `${slugify(name)}-${i}`;
        const group = await prisma.group.create({
            data: {
                name,
                slug: baseSlug,
                description: g.groupDesc(),
                coverUrl: g.imageUrl(),
                avatarUrl: g.avatarUrl(),
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
        const batchLikes: { userId: number; groupPostId: number; reactionType: ReactionType }[] = [];
        for (let p = 0; p < randomInt(5, 15); p++) {
            const author = pick(users);
            const gpost = await prisma.groupPost.create({
                data: {
                    content: g.postContent(),
                    mediaUrl: Math.random() > 0.6 ? g.imageUrl() : null,
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
                    batchLikes.push({ userId: liker.id, groupPostId: gpost.id, reactionType: pick(reactionTypes) });
                    groupLikeCount++;
                }
            }
            for (let c = 0; c < randomInt(0, 6); c++) {
                await prisma.groupPostComment.create({
                    data: {
                        content: g.comment(),
                        groupPostId: gpost.id,
                        userId: pick(users).id,
                    },
                });
                groupCommentCount++;
            }
        }
        if (batchLikes.length > 0) await prisma.groupPostLike.createMany({ data: batchLikes });
    });
    console.log(`  -> ${groupPostCount} group posts, ${groupLikeCount} group likes, ${groupCommentCount} group comments`);
    // #endregion

    // #region Pages (600)
    console.log("  Creating pages...");
    const pageCategories = Object.values(PageCategory);
    const PAGES_COUNT = 200 * SCALE;
    const pageList: { id: number; slug: string }[] = [];

    await runInChunks(Array.from({ length: PAGES_COUNT }, (_, i) => i), 20, async (i) => {
        const owner = users[i % users.length];
        const name = g.pageName();
        const baseSlug = `${slugify(name)}-${i}`;
        const page = await prisma.page.create({
            data: {
                name,
                slug: baseSlug,
                description: g.pageDesc(),
                coverUrl: g.imageUrl(),
                avatarUrl: g.avatarUrl(),
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
        const batchLikes: { userId: number; pagePostId: number; reactionType: ReactionType }[] = [];
        for (let p = 0; p < randomInt(4, 10); p++) {
            const ppost = await prisma.pagePost.create({
                data: {
                    content: g.postContent(),
                    mediaUrl: Math.random() > 0.5 ? g.imageUrl() : null,
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
                    batchLikes.push({ userId: liker.id, pagePostId: ppost.id, reactionType: pick(reactionTypes) });
                    pageLikeCount++;
                }
            }
            for (let c = 0; c < randomInt(0, 6); c++) {
                await prisma.pagePostComment.create({
                    data: {
                        content: g.comment(),
                        pagePostId: ppost.id,
                        userId: pick(users).id,
                    },
                });
                pageCommentCount++;
            }
        }
        if (batchLikes.length > 0) await prisma.pagePostLike.createMany({ data: batchLikes });
    });
    console.log(`  -> ${pagePostCount} page posts, ${pageLikeCount} page likes, ${pageCommentCount} page comments`);
    // #endregion

    // #region Events (600)
    console.log("  Creating events...");
    const eventPrivacies = [EventPrivacy.Public, EventPrivacy.FriendsOnly, EventPrivacy.Private];
    const attendeeStatuses = [AttendeeStatus.Going, AttendeeStatus.Interested];
    const EVENTS_COUNT = 200 * SCALE;
    const eventList: { id: number }[] = [];

    await runInChunks(Array.from({ length: EVENTS_COUNT }, (_, i) => i), 20, async (i) => {
        const creator = users[i % users.length];
        const title = g.eventTitle();
        const baseSlug = `${slugify(title)}-${i}`;
        const startDate = randomDate(new Date("2026-04-01"), new Date("2027-06-30"));
        const event = await prisma.event.create({
            data: {
                title,
                slug: baseSlug,
                description: faker.lorem.paragraph(),
                coverUrl: g.imageUrl(),
                location: g.location(),
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

    // #region Notifications (3600)
    console.log("  Creating notifications...");
    const notifTypes = Object.values(NotificationType);
    const notifData = Array.from({ length: 1200 * SCALE }, () => {
        const [receiver, sender] = pickMany(users, 2);
        return {
            type: pick(notifTypes),
            content: faker.lorem.sentence({ min: 5, max: 12 }),
            userId: receiver.id,
            senderId: sender.id,
            createdAt: randomDate(new Date("2025-01-01"), new Date()),
        };
    });
    await batchInsert(prisma.notification, notifData);
    console.log(`  -> ${notifData.length} notifications`);
    // #endregion

    // #region ReportedContent
    console.log("  Creating reports...");
    const reportTypes = Object.values(ReportType);
    const reportStatuses = Object.values(ReportStatus);
    const reportData = Array.from({ length: 120 * SCALE }, () => {
        const [reporter, reported] = pickMany(users, 2);
        return {
            reportType: pick(reportTypes),
            reason: faker.lorem.sentence({ min: 8, max: 15 }),
            status: pick(reportStatuses),
            contentId: randomInt(1, POST_COUNT),
            reportingUserId: reporter.id,
            reportedUserId: reported.id,
        };
    });
    await batchInsert(prisma.reportedContent, reportData);
    console.log(`  -> ${reportData.length} reports`);
    // #endregion

    // #region ModerationLogs
    console.log("  Creating moderation logs...");
    const modActions = Object.values(ModerationAction);
    const modData = Array.from({ length: 100 * SCALE }, (_, i) => ({
        actionType: pick(modActions),
        details: faker.lorem.sentence({ min: 8, max: 15 }),
        moderatorUserId: users[i % 2].id,
        targetUserId: pick(users).id,
        targetContentId: randomInt(1, POST_COUNT),
    }));
    await batchInsert(prisma.moderationLog, modData);
    console.log(`  -> ${modData.length} moderation logs`);
    // #endregion

    // #region EventPosts
    console.log("  Creating event posts/likes/comments...");
    let eventPostCount = 0;
    let eventPostLikeCount = 0;
    let eventPostCommentCount = 0;
    const eventPostCommentLikedPairs = new Set<string>();
    let eventPostCommentLikeCount = 0;
    await runInChunks(eventList, 20, async (event) => {
        const batchELikes: { userId: number; eventPostId: number; reactionType: ReactionType }[] = [];
        const batchECommentLikes: { userId: number; eventPostCommentId: number }[] = [];
        for (let p = 0; p < randomInt(3, 10); p++) {
            const author = pick(users);
            const epost = await prisma.eventPost.create({
                data: {
                    content: g.postContent(),
                    mediaUrl: Math.random() > 0.6 ? g.imageUrl() : null,
                    eventId: event.id,
                    userId: author.id,
                    createdAt: randomDate(new Date("2025-01-01"), new Date()),
                },
            });
            eventPostCount++;
            for (const liker of pickMany(users, randomInt(2, 15))) {
                const key = `epl-${liker.id}-${epost.id}`;
                if (!likedPairs.has(key)) {
                    likedPairs.add(key);
                    batchELikes.push({ userId: liker.id, eventPostId: epost.id, reactionType: pick(reactionTypes) });
                    eventPostLikeCount++;
                }
            }
            for (let c = 0; c < randomInt(0, 6); c++) {
                const epComment = await prisma.eventPostComment.create({
                    data: {
                        content: g.comment(),
                        eventPostId: epost.id,
                        userId: pick(users).id,
                    },
                });
                eventPostCommentCount++;
                for (const liker of pickMany(users, randomInt(0, 4))) {
                    const key = `epcl-${liker.id}-${epComment.id}`;
                    if (!eventPostCommentLikedPairs.has(key)) {
                        eventPostCommentLikedPairs.add(key);
                        batchECommentLikes.push({ userId: liker.id, eventPostCommentId: epComment.id });
                        eventPostCommentLikeCount++;
                    }
                }
            }
        }
        if (batchELikes.length > 0) await prisma.eventPostLike.createMany({ data: batchELikes });
        if (batchECommentLikes.length > 0) await prisma.eventPostCommentLike.createMany({ data: batchECommentLikes });
    });
    console.log(`  -> ${eventPostCount} event posts, ${eventPostLikeCount} likes, ${eventPostCommentCount} comments, ${eventPostCommentLikeCount} comment likes`);
    // #endregion

    // #region EventHashtags
    console.log("  Creating event hashtags...");
    const eventHashtagPairs = new Set<string>();
    const eventHashtagData: { eventId: number; hashtagId: number }[] = [];
    for (const event of eventList) {
        for (const h of pickMany(hashtags, randomInt(1, 3))) {
            const key = `eh-${event.id}-${h.id}`;
            if (!eventHashtagPairs.has(key)) {
                eventHashtagPairs.add(key);
                eventHashtagData.push({ eventId: event.id, hashtagId: h.id });
            }
        }
    }
    await batchInsert(prisma.eventHashtag, eventHashtagData);
    console.log(`  -> ${eventHashtagData.length} event hashtags`);
    // #endregion

    // #region GroupPostCommentLikes
    console.log("  Creating group post comment likes...");
    let groupPostCommentLikeCount = 0;
    const groupCommentLikedPairs = new Set<string>();
    // Fetch a sample of group post comments to like
    const groupPostComments = await prisma.groupPostComment.findMany({ take: 2000, select: { id: true } });
    await runInChunks(groupPostComments, 50, async (c) => {
        for (const liker of pickMany(users, randomInt(0, 5))) {
            const key = `gpcl-${liker.id}-${c.id}`;
            if (!groupCommentLikedPairs.has(key)) {
                groupCommentLikedPairs.add(key);
                await prisma.groupPostCommentLike.create({
                    data: { userId: liker.id, groupPostCommentId: c.id, reactionType: pick(reactionTypes) },
                }).catch(() => {});
                groupPostCommentLikeCount++;
            }
        }
    });
    console.log(`  -> ${groupPostCommentLikeCount} group post comment likes`);
    // #endregion

    // #region PagePostCommentLikes
    console.log("  Creating page post comment likes...");
    let pagePostCommentLikeCount = 0;
    const pageCommentLikedPairs = new Set<string>();
    const pagePostComments = await prisma.pagePostComment.findMany({ take: 2000, select: { id: true } });
    await runInChunks(pagePostComments, 50, async (c) => {
        for (const liker of pickMany(users, randomInt(0, 5))) {
            const key = `ppcl-${liker.id}-${c.id}`;
            if (!pageCommentLikedPairs.has(key)) {
                pageCommentLikedPairs.add(key);
                await prisma.pagePostCommentLike.create({
                    data: { userId: liker.id, pagePostCommentId: c.id, reactionType: pick(reactionTypes) },
                }).catch(() => {});
                pagePostCommentLikeCount++;
            }
        }
    });
    console.log(`  -> ${pagePostCommentLikeCount} page post comment likes`);
    // #endregion

    // #region Albums
    console.log("  Creating albums and photos...");
    let albumCount = 0;
    let albumPhotoCount = 0;
    const albumOwners = pickMany(users, Math.min(200 * SCALE, users.length));
    await runInChunks(albumOwners, 50, async (u) => {
        const albumsPerUser = randomInt(1, 3);
        for (let a = 0; a < albumsPerUser; a++) {
            const album = await prisma.album.create({
                data: {
                    name: g.albumName(),
                    description: Math.random() > 0.5 ? g.bio() : null,
                    coverUrl: g.imageUrl(),
                    privacy: pick([PostPrivacy.Public, PostPrivacy.Public, PostPrivacy.FriendsOnly, PostPrivacy.OnlyMe]),
                    userId: u.id,
                    createdAt: randomDate(new Date("2024-01-01"), new Date()),
                },
            });
            albumCount++;
            const photoCount = randomInt(3, 8);
            for (let p = 0; p < photoCount; p++) {
                await prisma.albumPhoto.create({
                    data: {
                        photoUrl: g.imageUrl(),
                        caption: Math.random() > 0.6 ? g.comment() : null,
                        order: p,
                        albumId: album.id,
                        createdAt: randomDate(new Date("2024-01-01"), new Date()),
                    },
                });
                albumPhotoCount++;
            }
        }
    });
    console.log(`  -> ${albumCount} albums, ${albumPhotoCount} album photos`);
    // #endregion

    // #region Videos
    console.log("  Creating videos, likes, comments, hashtags...");
    const VIDEO_COUNT = 300 * SCALE;
    const videos: { id: number }[] = [];
    await runInChunks(Array.from({ length: VIDEO_COUNT }, (_, i) => i), 50, async (i) => {
        const author = users[i % users.length];
        const video = await prisma.video.create({
            data: {
                title: g.videoTitle(),
                description: g.videoDesc(),
                url: g.videoUrl(i),
                thumbnailUrl: g.thumbnailUrl(),
                duration: randomInt(60, 3600),
                views: randomInt(0, 50000),
                privacy: pick([PostPrivacy.Public, PostPrivacy.Public, PostPrivacy.FriendsOnly, PostPrivacy.OnlyMe]),
                authorId: author.id,
                createdAt: randomDate(new Date("2024-06-01"), new Date()),
            },
        });
        videos.push(video);
    });

    const videoLikedPairs = new Set<string>();
    const videoLikeData: { userId: number; videoId: number }[] = [];
    const videoCommentData: { content: string; userId: number; videoId: number; createdAt: Date }[] = [];
    const videoHashtagData: { videoId: number; hashtagId: number }[] = [];
    const videoHashtagPairs = new Set<string>();
    let videoLikeCount = 0, videoCommentCount = 0, videoHashtagCount = 0;
    for (const video of videos) {
        for (const liker of pickMany(users, randomInt(5, 25))) {
            const key = `vl-${liker.id}-${video.id}`;
            if (!videoLikedPairs.has(key)) {
                videoLikedPairs.add(key);
                videoLikeData.push({ userId: liker.id, videoId: video.id });
                videoLikeCount++;
            }
        }
        for (let c = 0; c < randomInt(2, 10); c++) {
            videoCommentData.push({ content: g.comment(), userId: pick(users).id, videoId: video.id, createdAt: randomDate(new Date("2024-06-01"), new Date()) });
            videoCommentCount++;
        }
        for (const h of pickMany(hashtags, randomInt(1, 3))) {
            const key = `vh-${video.id}-${h.id}`;
            if (!videoHashtagPairs.has(key)) {
                videoHashtagPairs.add(key);
                videoHashtagData.push({ videoId: video.id, hashtagId: h.id });
                videoHashtagCount++;
            }
        }
    }
    await batchInsert(prisma.videoLike, videoLikeData);
    await batchInsert(prisma.videoComment, videoCommentData);
    await batchInsert(prisma.videoHashtag, videoHashtagData);
    console.log(`  -> ${VIDEO_COUNT} videos, ${videoLikeCount} video likes, ${videoCommentCount} video comments, ${videoHashtagCount} video hashtags`);
    // #endregion

    // #region Blogs
    console.log("  Creating blogs, likes, hashtags...");
    const BLOG_COUNT = 300 * SCALE;
    const blogs: { id: number }[] = [];
    await runInChunks(Array.from({ length: BLOG_COUNT }, (_, i) => i), 50, async (i) => {
        const author = users[i % users.length];
        const blogTitle = g.blogTitle();
        const slugBase = slugify(blogTitle);
        const blog = await prisma.blog.create({
            data: {
                slug: `${slugBase}-${author.id}-${i}`,
                title: blogTitle,
                content: g.blogContent(),
                excerpt: g.blogExcerpt(),
                coverImageUrl: Math.random() > 0.3 ? g.imageUrl() : null,
                published: Math.random() > 0.2,
                authorId: author.id,
                createdAt: randomDate(new Date("2024-01-01"), new Date()),
            },
        });
        blogs.push(blog);
    });

    const blogLikedPairs = new Set<string>();
    const blogLikeData: { userId: number; blogId: number }[] = [];
    const blogHashtagData: { blogId: number; hashtagId: number }[] = [];
    const blogHashtagPairs = new Set<string>();
    let blogLikeCount = 0, blogHashtagCount = 0;
    for (const blog of blogs) {
        for (const liker of pickMany(users, randomInt(5, 20))) {
            const key = `bl-${liker.id}-${blog.id}`;
            if (!blogLikedPairs.has(key)) {
                blogLikedPairs.add(key);
                blogLikeData.push({ userId: liker.id, blogId: blog.id });
                blogLikeCount++;
            }
        }
        for (const h of pickMany(hashtags, randomInt(1, 3))) {
            const key = `bh-${blog.id}-${h.id}`;
            if (!blogHashtagPairs.has(key)) {
                blogHashtagPairs.add(key);
                blogHashtagData.push({ blogId: blog.id, hashtagId: h.id });
                blogHashtagCount++;
            }
        }
    }
    await batchInsert(prisma.blogLike, blogLikeData);
    await batchInsert(prisma.blogHashtag, blogHashtagData);
    console.log(`  -> ${BLOG_COUNT} blogs, ${blogLikeCount} blog likes, ${blogHashtagCount} blog hashtags`);
    // #endregion

    // #region Marketplace
    console.log("  Creating marketplace listings...");
    const listingCategories = Object.values(ListingCategory);
    const listingConditions = Object.values(ListingCondition);
    const listingStatuses = [ListingStatus.Active, ListingStatus.Active, ListingStatus.Active, ListingStatus.Reserved, ListingStatus.Sold];
    const offerStatuses = Object.values(OfferStatus);
    const LISTING_COUNT = 300 * SCALE;
    const listings: { id: number; sellerId: number }[] = [];
    await runInChunks(Array.from({ length: LISTING_COUNT }, (_, i) => i), 50, async (i) => {
        const seller = users[i % users.length];
        const listing = await prisma.marketplaceListing.create({
            data: {
                title: g.listingTitle(),
                description: g.listingDesc(),
                price: parseFloat((randomInt(5, 2000) + Math.random()).toFixed(2)),
                isFree: Math.random() > 0.95,
                category: pick(listingCategories),
                condition: pick(listingConditions),
                status: pick(listingStatuses),
                location: g.location(),
                slug: `listing-${seller.id}-${i}`,
                viewCount: randomInt(0, 5000),
                sellerId: seller.id,
                createdAt: randomDate(new Date("2024-01-01"), new Date()),
                images: {
                    create: Array.from({ length: randomInt(1, 4) }, (_, o) => ({
                        url: g.imageUrl(),
                        order: o,
                    })),
                },
            },
        });
        listings.push({ id: listing.id, sellerId: seller.id });
    });

    const listingSavedPairs = new Set<string>();
    const listingSaveData: { userId: number; listingId: number }[] = [];
    const listingOfferData: { amount: number; message: string | null; status: OfferStatus; buyerId: number; listingId: number }[] = [];
    const listingMsgData: { content: string; senderId: number; listingId: number; createdAt: Date }[] = [];
    for (const listing of listings) {
        for (const saver of pickMany(users.filter((u) => u.id !== listing.sellerId), randomInt(1, 10))) {
            const key = `ls-${saver.id}-${listing.id}`;
            if (!listingSavedPairs.has(key)) {
                listingSavedPairs.add(key);
                listingSaveData.push({ userId: saver.id, listingId: listing.id });
            }
        }
        for (let o = 0; o < randomInt(0, 3); o++) {
            const buyer = pick(users.filter((u) => u.id !== listing.sellerId));
            listingOfferData.push({
                amount: parseFloat((randomInt(1, 1800) + Math.random()).toFixed(2)),
                message: Math.random() > 0.5 ? g.message() : null,
                status: pick(offerStatuses),
                buyerId: buyer.id,
                listingId: listing.id,
            });
        }
        for (let m = 0; m < randomInt(0, 5); m++) {
            const sender = pick(users.filter((u) => u.id !== listing.sellerId));
            listingMsgData.push({ content: g.message(), senderId: sender.id, listingId: listing.id, createdAt: randomDate(new Date("2024-01-01"), new Date()) });
        }
    }
    await batchInsert(prisma.listingSave, listingSaveData);
    await batchInsert(prisma.listingOffer, listingOfferData);
    await batchInsert(prisma.listingMessage, listingMsgData);
    console.log(`  -> ${LISTING_COUNT} listings, ${listingSaveData.length} saves, ${listingOfferData.length} offers, ${listingMsgData.length} messages`);
    // #endregion

    // #region Memories
    console.log("  Creating memories...");
    const memoryData: { note: string | null; userId: number; postId: number | null; createdAt: Date }[] = [];
    for (const u of users) {
        for (let m = 0; m < randomInt(2, 5); m++) {
            memoryData.push({
                note: Math.random() > 0.4 ? g.comment() : null,
                userId: u.id,
                postId: Math.random() > 0.5 ? pick(posts).id : null,
                createdAt: randomDate(new Date("2023-01-01"), new Date()),
            });
        }
    }
    await batchInsert(prisma.memory, memoryData);
    console.log(`  -> ${memoryData.length} memories`);
    // #endregion

    console.log(`\nSeeding complete! SCALE=${SCALE} → (${400 * SCALE} users, ${800 * SCALE} posts, ${200 * SCALE} groups, ${200 * SCALE} pages, ${200 * SCALE} events, ${300 * SCALE} videos, ${300 * SCALE} blogs, ${300 * SCALE} listings)`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
