"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createChild(formData: FormData): Promise<void> {
    const supabase = await createClient();

    // 1. Verify Authentication (Must be logged in)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated. Please sign in.");

    // 2. Extract Data safely
    const fullName = formData.get("fullName") as string;
    const birthDate = formData.get("birthDate") as string;
    const classLevel = formData.get("className") as string;
    const studentPin = formData.get("studentPin") as string;

    if (!fullName || fullName.trim().length < 2) {
        throw new Error("Child's full name is required.");
    }

    // 3. Insert securely (linking directly to the logged-in parent)
    // The RLS policy will double-check this, but we enforce it in code too.
    const { error } = await supabase.from("children").insert({
        parent_id: user.id,       // 🚨 Securely tied to the logged-in parent
        full_name: fullName.trim(),
        birth_date: birthDate || null,
        class_name: classLevel || "KG1",
        student_pin: studentPin || null,
        is_approved: false        // Must be approved by admin
    });

    if (error) {
        console.error("Supabase Insert Error:", error);

        // Handle duplicate PIN error gracefully
        if (error.code === '23505') {
            throw new Error("A student with this exact name and PIN already exists. Please choose a different PIN.");
        }

        throw new Error(error.message);
    }

    // 4. Refresh the UI so the new child appears immediately
    revalidatePath("/parent");
}

export async function deleteChild(childId: string): Promise<void> {
    const supabase = await createClient();

    // 1. Verify Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated.");

    // 2. Delete securely (The RLS policy ensures they can only delete their OWN children)
    const { error } = await supabase
        .from("children")
        .delete()
        .eq("id", childId)
        .eq("parent_id", user.id); // Extra safety check

    if (error) {
        console.error("Delete Error:", error);
        throw new Error(error.message);
    }

    revalidatePath("/parent");
}