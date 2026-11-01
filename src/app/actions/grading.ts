"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { logEvent } from "./logger"; // 🚨 Import Logger

// Helper to initialize the Admin Client (bypasses RLS for teacher actions)
const getAdminClient = () => {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

/**
 * 🚨 1. GRADE SUBMISSION
 * Updates the score and feedback for a specific student submission.
 */
export async function gradeSubmission(submissionId: string, newScore: number, feedback: string) {
    const supabase = await createClient();

    // Verify the user is a teacher or admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("tba_profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single();

    if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
        throw new Error("Only teachers can grade assignments.");
    }

    const supabaseAdmin = getAdminClient();
    const { error } = await supabaseAdmin
        .from("submissions")
        .update({
            score: Number(newScore), // Force it to be a number
            teacher_feedback: feedback,
            is_graded: true
        })
        .eq("id", submissionId);

    if (error) throw new Error(error.message);

    // 🚨 LOG TO ADMIN
    await logEvent("TEACHER_GRADED_SUBMISSION", {
        teacher_name: profile.full_name,
        submissionId,
        newScore
    });

    revalidatePath("/teacher/assignments");
    revalidatePath("/teacher/grades");
    return { success: true };
}

/**
 * 🚨 2. DELETE ASSIGNMENT
 * Deletes an assignment AND all of its associated student submissions.
 */
export async function deleteAssignment(assignmentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase.from("tba_profiles").select("full_name").eq("id", user.id).single();

    const supabaseAdmin = getAdminClient();

    // 1. Delete all submissions for this assignment first (Prevent FK errors)
    await supabaseAdmin.from("submissions").delete().eq("assignment_id", assignmentId);

    // 2. Delete the assignment itself
    const { error } = await supabaseAdmin.from("assignments").delete().eq("id", assignmentId);

    if (error) throw new Error(error.message);

    // 🚨 LOG TO ADMIN
    await logEvent("TEACHER_DELETED_ASSIGNMENT", {
        teacher_name: profile?.full_name,
        assignmentId
    });

    revalidatePath("/teacher/assignments");
    revalidatePath("/teacher/grades");
    return { success: true };
}

/**
 * 🚨 3. DELETE SUBMISSION
 * Deletes a single student's submission (e.g., if they need to retake it).
 */
export async function deleteSubmission(submissionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase.from("tba_profiles").select("full_name").eq("id", user.id).single();

    const supabaseAdmin = getAdminClient();
    const { error } = await supabaseAdmin.from("submissions").delete().eq("id", submissionId);

    if (error) throw new Error(error.message);

    // 🚨 LOG TO ADMIN
    await logEvent("TEACHER_DELETED_SUBMISSION", {
        teacher_name: profile?.full_name,
        submissionId
    });

    revalidatePath("/teacher/assignments");
    revalidatePath("/teacher/grades");
    return { success: true };
}

/**
 * 🚨 4. PUBLISH ASSIGNMENT
 * Changes a draft assignment to "published" so students can see it.
 */
export async function publishAssignment(assignmentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase.from("tba_profiles").select("full_name").eq("id", user.id).single();

    const supabaseAdmin = getAdminClient();

    const { error } = await supabaseAdmin
        .from("assignments")
        .update({ status: 'published' })
        .eq("id", assignmentId);

    if (error) throw new Error(error.message);

    // 🚨 LOG TO ADMIN
    await logEvent("TEACHER_PUBLISHED_ASSIGNMENT", {
        teacher_name: profile?.full_name,
        assignmentId
    });

    revalidatePath("/teacher/assignments");
    return { success: true };
}