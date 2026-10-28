"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function savePresentation(title: string, deck: any, designPrompt: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase.from("lessons").insert({
        teacher_id: user.id,
        title: title,
        topic: designPrompt,
        content: deck,
        status: 'draft',
    }).select().single();

    if (error) throw new Error(error.message);
    revalidatePath("/teacher");
    return data.id;
}