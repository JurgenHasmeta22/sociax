import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = [
    "/feed",
    "/profile",
    "/groups",
    "/people",
    "/pages",
    "/events",
    "/saved",
    "/memories",
    "/settings",
    "/messages",
];

export async function proxy(req: NextRequest) {
    const token = await getToken({ req });
    const isAuthenticated = !!token;
    const { pathname } = req.nextUrl;

    if ((pathname.startsWith("/login") || pathname.startsWith("/register")) && isAuthenticated) {
        return NextResponse.redirect(new URL("/feed", req.url));
    }

    const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

    if (isProtected && !isAuthenticated) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/login",
        "/register",
        "/feed/:path*",
        "/profile/:path*",
        "/groups/:path*",
        "/people/:path*",
        "/pages/:path*",
        "/events/:path*",
        "/saved/:path*",
        "/memories/:path*",
        "/settings/:path*",
    ],
};
