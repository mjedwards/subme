import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
	const isStaffRoute = req.nextUrl.pathname.startsWith("/scan");

	if (!isStaffRoute) return NextResponse.next();

	const hasSession = req.cookies.get("sb-access-token");
	if (!hasSession) return NextResponse.redirect(new URL("/login", req.url));

	return NextResponse.next();
}
