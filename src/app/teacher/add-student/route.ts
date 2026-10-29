import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const { fullName, studentPin, classId, teacherId } = await req.json();

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Fetch the class name from the classId
        const { data: classData } = await supabaseAdmin
            .from("teacher_classes")
            .select("name")
            .eq("id", classId)
            .single();

        const className = classData?.name || "Unassigned";

        // 2. Check if student exists
        const { data: existingStudent } = await supabaseAdmin
            .from("children")
            .select("id")
            .eq("full_name", fullName.trim())
            .eq("student_pin", studentPin)
            .single();

        if (existingStudent) {
            // Link existing student to this teacher and class
            const { error } = await supabaseAdmin
                .from("children")
                .update({
                    teacher_id: teacherId,
                    class_id: classId,
                    class_name: className,
                    is_approved: true
                })
                .eq("id", existingStudent.id);

            if (error) throw error;
            return NextResponse.json({ success: true, message: "Linked existing student to your class." });
        }

        // Create new student
        const { error: insertError } = await supabaseAdmin
            .from("children")
            .insert({
                teacher_id: teacherId,
                full_name: fullName.trim(),
                class_id: classId,
                class_name: className,
                student_pin: studentPin,
                is_approved: true
            });

        if (insertError) throw insertError;

        return NextResponse.json({ success: true, message: "Created new student successfully." });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}