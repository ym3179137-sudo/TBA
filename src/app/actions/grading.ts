"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function gradeSubmission(submissionId: string, newScore: number, feedback: string) {
    const supabase = await createClient();

    // 1. Verify the user is a teacher
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("tba_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
        throw new Error("Only teachers can grade assignments.");
    }

    // 2. Update the submission
    const { error } = await supabase
        .from("submissions")
        .update({
            score: newScore,
            teacher_feedback: feedback,
            is_graded: true
        })
        .eq("id", submissionId);

    if (error) throw new Error(error.message);

    revalidatePath("/teacher/assignments");
    return { success: true };
}