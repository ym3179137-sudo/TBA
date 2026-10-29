import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // 1. Verify the user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 2. Fetch their role
        const { data: profile } = await supabase
            .from("tba_profiles")
            .select("role, full_name")
            .eq("id", user.id)
            .single();

        if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

        const data = await req.json();

        // 🚨 3. THE RESTRICTION: Block Parents from Lock Mode
        if (data.settings?.lockMode && profile.role === 'parent') {
            return NextResponse.json({ error: "ACCESS DENIED: Parents are not authorized to enable Lock Mode." }, { status: 403 });
        }

        // 🚨 4. LOG THE EVENT: If a Teacher enables Lock Mode, alert the Admin
        if (data.settings?.lockMode && profile.role === 'teacher') {
            await supabase.from("audit_logs").insert({
                action: "TEACHER_ENABLED_LOCK_MODE",
                details: {
                    teacher_name: profile.full_name,
                    assignment_title: data.title
                }
            });
        }

        // 5. Save the assignment
        const { data: newAssignment, error } = await supabase
            .from("assignments")
            .insert({
                teacher_id: user.id,
                title: data.title,
                type: data.type,
                target_grade: data.target_grade || null,
                target_student_id: data.target_student_id || null,
                settings: data.settings,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);

        return NextResponse.json({ success: true, assignment: newAssignment });

    } catch (error: any) {
        console.error("Assignment Creation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}