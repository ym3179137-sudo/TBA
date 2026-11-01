"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Helper for Admin Client to bypass RLS
const getAdminClient = () => {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

export async function gradeSubmission(submissionId: string, newScore: number, feedback: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

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

    revalidatePath("/teacher/assignments");
    revalidatePath("/teacher/grades");
    return { success: true };
}

export async function deleteAssignment(assignmentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const supabaseAdmin = getAdminClient();

    // 1. Delete all submissions for this assignment first
    await supabaseAdmin.from("submissions").delete().eq("assignment_id", assignmentId);

    // 2. Delete the assignment
    const { error } = await supabaseAdmin.from("assignments").delete().eq("id", assignmentId);
    if (error) throw new Error(error.message);

    revalidatePath("/teacher/assignments");
    revalidatePath("/teacher/grades");
    return { success: true };
}

export async function deleteSubmission(submissionId: string) {
    const supabaseAdmin = getAdminClient();
    const { error } = await supabaseAdmin.from("submissions").delete().eq("id", submissionId);
    if (error) throw new Error(error.message);
    revalidatePath("/teacher/assignments");
    revalidatePath("/teacher/grades");
    return { success: true };
}