"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "./logger"; // 🚨 Import Logger

export async function createAssignment(data: {
    title: string;
    description?: string;
    type: "doc" | "form";
    target_grade?: string;
    target_student_id?: string;
    status?: 'draft' | 'published';
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
        .maybeSingle();

    if (!profile) throw new Error("Profile not found. Please re-login.");

    // 🚨 3. THE RESTRICTION: Block Parents from Lock Mode
    if (data.settings?.lockMode && profile.role === 'parent') {
        throw new Error("ACCESS DENIED: Parents are not authorized to enable Lock Mode.");
    }

    // 🚨 4. LOG THE EVENT: If a Teacher enables Lock Mode, alert the Admin
    if (data.settings?.lockMode && profile.role === 'teacher') {
        try {
            await logEvent("TEACHER_ENABLED_LOCK_MODE", {
                teacher_name: profile.full_name,
                assignment_title: data.title
            });
        } catch (e) {
            console.log("Audit log failed, but continuing...");
        }
    }

    // 5. Save the assignment to the database with the Status
    const { data: newAssignment, error } = await supabase
        .from("assignments")
        .insert({
            teacher_id: user.id,
            title: data.title,
            description: data.description || "",
            type: data.type,
            target_grade: data.target_grade || null,
            target_student_id: data.target_student_id || null,
            status: data.status || 'draft',
            settings: data.settings,
        })
        .select()
        .single();

    if (error) {
        console.error("Supabase Insert Error:", error);
        throw new Error(error.message);
    }

    // 🚨 6. LOG THE CREATION
    await logEvent("TEACHER_CREATED_ASSIGNMENT", {
        teacher_name: profile.full_name,
        title: data.title,
        type: data.type,
        status: data.status
    });

    // Refresh the teacher's pages
    revalidatePath("/teacher/assignments");
    revalidatePath("/teacher/grades");
    return newAssignment;
}