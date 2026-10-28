"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function approveChild(formData: FormData) {
    const childId = formData.get("childId") as string;
    const supabase = await createClient();

    const { error } = await supabase
        .from("children")
        .update({ is_approved: true })
        .eq("id", childId);

    if (error) {
        console.error("Approval Error:", error);
        throw new Error(error.message);
    }

    revalidatePath("/admin");
}