import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const { fullName, studentPin, grade, teacherId } = await req.json();

        // Use Admin Client to bypass RLS
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Check if the student already exists anywhere in the school
        const { data: existingStudent } = await supabaseAdmin
            .from("children")
            .select("id")
            .eq("full_name", fullName.trim())
            .eq("student_pin", studentPin)
            .single();

        if (existingStudent) {
            // 🚨 Student exists! Just update their record to assign them to this teacher
            const { error } = await supabaseAdmin
                .from("children")
                .update({
                    teacher_id: teacherId,
                    class_name: grade,
                    is_approved: true
                })
                .eq("id", existingStudent.id);

            if (error) throw error;
            return NextResponse.json({ success: true, message: "Linked existing student to your roster." });
        }

        // 2. Student doesn't exist. Create a brand new record.
        const { error: insertError } = await supabaseAdmin
            .from("children")
            .insert({
                teacher_id: teacherId,
                full_name: fullName.trim(),
                class_name: grade,
                student_pin: studentPin,
                is_approved: true
            });

        if (insertError) throw insertError;

        return NextResponse.json({ success: true, message: "Created new student successfully." });

    } catch (error: any) {
        console.error("Add Student Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}