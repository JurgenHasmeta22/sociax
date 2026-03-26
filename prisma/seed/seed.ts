import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashSync } from "bcrypt";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Seeding database...");

    await prisma.user.upsert({
        where: { email: "admin@sociax.dev" },
        update: {},
        create: {
            email: "admin@sociax.dev",
            userName: "admin",
            name: "Admin",
            password: hashSync("admin123", 10),
            active: true,
            role: "Admin",
        },
    });

    await prisma.user.upsert({
        where: { email: "user@sociax.dev" },
        update: {},
        create: {
            email: "user@sociax.dev",
            userName: "testuser",
            name: "Test User",
            password: hashSync("test123", 10),
            active: true,
            role: "User",
        },
    });

    console.log("Seed complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
