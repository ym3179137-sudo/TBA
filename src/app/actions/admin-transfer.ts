"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function transferTeacherClasses(fromTeacherId: string, toTeacherId: string | null) {
    const supabase = await createClient();

    // 1. Transfer the custom classes
    // If toTeacherId is null, it becomes "unassigned"
    await supabase
        .from("teacher_classes")
        .update({ teacher_id: toTeacherId })
        .eq("teacher_id", fromTeacherId);

    // 2. Transfer the students
    await supabase
        .from("children")
        .update({ teacher_id: toTeacherId })
        .eq("teacher_id", fromTeacherId);

    // Refresh the admin dashboard to show the changes immediately
    revalidatePath("/admin");
}