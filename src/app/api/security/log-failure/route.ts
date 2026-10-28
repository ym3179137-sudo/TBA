import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        // Get the real IP from the Vercel/Next.js headers
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown IP";

        // Use a service role key to bypass RLS and insert the log
        // (Make sure SUPABASE_SERVICE_ROLE_KEY is in your .env.local)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Log the failure
        await supabaseAdmin.from("audit_logs").insert({
            action: "LOGIN_FAILED",
            details: { attempted_email: email },
            ip_address: ip,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to log" }, { status: 500 });
    }
}