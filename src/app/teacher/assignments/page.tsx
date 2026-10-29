import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // 1. Verify user authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse the incoming payload
        const payload = await req.json();

        // 3. Save to Database
        const { data, error } = await supabase.from("assignments").insert({
            teacher_id: user.id,
            title: payload.title,
            type: payload.type,
            // 🚨 Save the array of class IDs
            target_class_ids: payload.target_class_ids || [],
            target_student_id: payload.target_student_id || null,
            settings: payload.settings,
        }).select().single();

        if (error) {
            console.error("Database Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, assignment: data });

    } catch (err: any) {
        console.error("Server Error:", err);
        return NextResponse.json({ error: err.message || "Internal Error" }, { status: 500 });
    }
}