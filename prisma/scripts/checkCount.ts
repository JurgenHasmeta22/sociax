import "dotenv/config";
import { prisma } from "../config/prisma";
async function main() {
	console.log("users:", await prisma.user.count());
	console.log("groups:", await prisma.group.count());
	console.log("events:", await prisma.event.count());
	await prisma.$disconnect();
}
main();