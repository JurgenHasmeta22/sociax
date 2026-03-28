import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "fs";
import path from "path";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
    const url = process.env.DATABASE_URL ?? "";

    if (url.startsWith("file:")) {
        const fileUrl = url.slice("file:".length);
        const filePath = path.isAbsolute(fileUrl) ? fileUrl : path.join(process.cwd(), fileUrl);
        const dir = path.dirname(filePath);
        
        try {
            fs.mkdirSync(dir, { recursive: true });
        } catch (e) {
            // ignore directory creation errors; adapter will report if opening fails
        }
    }

    const adapter = new PrismaBetterSqlite3({ url });
    
    return new PrismaClient({
        adapter,
        log:
            process.env.NODE_ENV === "development"
                ? ["query", "info", "warn", "error"]
                : ["warn", "error"],
        errorFormat: "pretty",
    });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;