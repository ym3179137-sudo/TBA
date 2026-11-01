import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Get Auth Cookies (Student uses custom cookie, others use Supabase)
    const studentId = request.cookies.get('student_id')?.value
    const tbaAuthCookie = request.cookies.getAll().find(c => c.name.startsWith('sb-')) // Supabase auth token

    // 2. Protect Student Routes
    if (pathname.startsWith('/student') && pathname !== '/student-login') {
        if (!studentId) {
            return NextResponse.redirect(new URL('/student-login', request.url))
        }
    }

    // 3. Protect Teacher/Admin/Parent Routes
    const isProtectedRoute =
        pathname.startsWith('/teacher') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/parent')

    if (isProtectedRoute) {
        if (!tbaAuthCookie) {
            return NextResponse.redirect(new URL('/sign-in', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/student/:path*',
        '/teacher/:path*',
        '/admin/:path*',
        '/parent/:path*',
    ],
}