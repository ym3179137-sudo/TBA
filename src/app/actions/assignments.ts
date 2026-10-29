"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createAssignment(data: {
    title: string;
    description?: string;
    type: "doc" | "form";
    target_grade?: string;
    target_student_id?: string;
    settings: { lockMode?: boolean; questions?: any[] };
}) {
    const supabase = await createClient();

    // 1. Verify the user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // 2. Fetch their role from the database
    const { data: profile } = await supabase
        .from("tba_profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single();

    if (!profile) throw new Error("Profile not found");

    // 🚨 3. THE RESTRICTION: Block Parents from Lock Mode
    if (data.settings?.lockMode && profile.role === 'parent') {
        throw new Error("ACCESS DENIED: Parents are not authorized to enable Lock Mode.");
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

    // 5. Save the assignment to the database
    const { data: newAssignment, error } = await supabase
        .from("assignments")
        .insert({
            teacher_id: user.id,
            title: data.title,
            description: data.description,
            type: data.type,
            target_grade: data.target_grade || null,
            target_student_id: data.target_student_id || null,
            settings: data.settings,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    // Refresh the teacher's dashboard
    revalidatePath("/teacher/assignments");
    return newAssignment;
}