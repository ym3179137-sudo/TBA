import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED = ["/dashboard", "/admin", "/teacher", "/parent", "/student"];
const AUTH_PAGES = ["/sign-in", "/sign-up"];

export async function middleware(request: NextRequest) {
    const { response, user, supabase } = await updateSession(request);
    const path = request.nextUrl.pathname;

    // 🌐 1. Extract IP Address
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Unknown IP";
    response.headers.set("x-user-ip", ip);

    // 🎒 2. STUDENT AUTH BYPASS (Fix for the redirect loop)
    const studentId = request.cookies.get("student_id")?.value;
    const isStudentRoute = path.startsWith("/student") && !path.startsWith("/student-login");

    if (isStudentRoute && studentId) {
        // If they have a student cookie, let them view the student dashboard!
        return response;
    }

    // ⏰ 3. 24-Hour Logout Logic
    if (user) {
        const loginTimeCookie = request.cookies.get("tba_login_time");
        if (loginTimeCookie) {
            const loginTime = parseInt(loginTimeCookie.value);
            const now = Date.now();
            const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

            if (now - loginTime > TWENTY_FOUR_HOURS) {
                await supabase.auth.signOut();
                const url = request.nextUrl.clone();
                url.pathname = "/sign-in";
                url.searchParams.set("message", "Your 24-hour session expired. Please log in again.");
                const redirectRes = NextResponse.redirect(url);
                response.cookies.getAll().forEach(c => redirectRes.cookies.set(c));
                redirectRes.cookies.delete("tba_login_time");
                return redirectRes;
            }
        } else {
            response.cookies.set("tba_login_time", Date.now().toString(), { maxAge: 86400, path: "/" });
        }
    }

    const isProtected = PROTECTED.some((p) => path === p || path.startsWith(p + "/"));
    const isAuthPage = AUTH_PAGES.some((p) => path === p);

    // 🚫 4. Route Protection for Admins/Teachers/Parents
    if (!user && isProtected && !isStudentRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/sign-in";
        url.searchParams.set("next", path);
        return NextResponse.redirect(url);
    }

    // 🔄 5. Role-Based Redirection
    if (user && isAuthPage) {
        const { data: profile } = await supabase.from("tba_profiles").select("role").eq("id", user.id).single();
        const url = request.nextUrl.clone();

        if (profile?.role === "admin") url.pathname = "/admin";
        else if (profile?.role === "teacher") url.pathname = "/teacher";
        else if (profile?.role === "student") url.pathname = "/student";
        else url.pathname = "/parent";

        return NextResponse.redirect(url);
    }

    // 🔒 6. Prevent cross-role access (Admins/Teachers)
    if (user) {
        const { data: profile } = await supabase.from("tba_profiles").select("role").eq("id", user.id).single();
        const role = profile?.role;

        if (path.startsWith("/admin") && role !== "admin") return NextResponse.redirect(new URL("/dashboard", request.url));
        if (path.startsWith("/teacher") && role !== "teacher" && role !== "admin") return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};