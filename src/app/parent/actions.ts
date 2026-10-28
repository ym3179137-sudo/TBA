"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createChild(formData: FormData): Promise<void> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const fullName = formData.get("fullName") as string;
    const birthDate = formData.get("birthDate") as string;

    if (!fullName) throw new Error("Child's name is required");

    const { error } = await supabase.from("children").insert({
        parent_id: user.id,
        full_name: fullName,
        birth_date: birthDate || null,
    });

    if (error) {
        console.error(error);
        throw new Error(error.message);
    }

    revalidatePath("/parent");
}