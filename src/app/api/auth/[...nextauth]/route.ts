import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcrypt";
import { prisma } from "../../../../../prisma/config/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

export const dynamic = "force-dynamic";

process.env.NEXTAUTH_URL =
	process.env.NODE_ENV === "production"
		? (process.env.NEXT_PUBLIC_PROJECT_URL ?? "http://localhost:4000")
		: "http://localhost:4000";

export const authOptions: NextAuthOptions = {
	adapter: PrismaAdapter(prisma),
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
		}),
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				emailOrUsername: { label: "Email or Username", type: "text" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.emailOrUsername || !credentials?.password) {
					throw new Error("Invalid credentials");
				}

				const user = await prisma.user.findFirst({
					where: {
						OR: [
							{ email: credentials.emailOrUsername },
							{ userName: credentials.emailOrUsername },
						],
					},
				});

				if (!user || !user.password) {
					throw new Error("Invalid credentials");
				}

				if (!user.active) {
					throw new Error("Account is not active");
				}

				const isPasswordValid = await compare(
					credentials.password,
					user.password,
				);

				if (!isPasswordValid) {
					throw new Error("Invalid credentials");
				}

				return {
					id: user.id.toString(),
					email: user.email,
					name: user.name ?? user.userName,
				};
			},
		}),
	],
	session: {
		strategy: "jwt",
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
			}
			return token;
		},
		async session({ session, token }) {
			if (token && session.user) {
				(session.user as typeof session.user & { id: string }).id =
					token.id as string;
			}
			return session;
		},
	},
	pages: {
		signIn: "/login",
		error: "/login",
	},
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
