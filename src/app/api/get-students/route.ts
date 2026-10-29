import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    // Use the admin client to bypass RLS securely on the server
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
        .from("children")
        .select("id, full_name, class_name")
        .eq("is_approved", true) // Only fetch approved students
        .order("full_name", { ascending: true });

    if (error) {
        console.error("Error fetching students:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ students: data });
}