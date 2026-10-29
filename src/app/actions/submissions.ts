"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function submitAssignment(data: {
    assignmentId: string;
    assignmentTitle: string;
    studentId: string;
    content: any;
    violations: string[];
}) {
    const supabase = await createClient();

    // 1. Calculate Integrity Score (Starts at 100, minus 10 for every violation)
    const integrityScore = Math.max(0, 100 - (data.violations.length * 10));

    // 2. Save the Submission
    const { error } = await supabase.from("submissions").insert({
        assignment_id: data.assignmentId,
        student_id: data.studentId,
        content: data.content,
        violations: data.violations,
        integrity_score: integrityScore,
    });

    if (error) {
        // If they already submitted, update their existing submission instead
        if (error.code === '23505') {
            await supabase.from("submissions").update({
                content: data.content,
                violations: data.violations,
                integrity_score: integrityScore,
                submitted_at: new Date().toISOString()
            }).eq("assignment_id", data.assignmentId).eq("student_id", data.studentId);
        } else {
            throw new Error(error.message);
        }
    }

    // 🚨 3. THE ADMIN ALERT: If 5 or more violations, send to Security Alerts
    if (data.violations.length >= 5) {
        // Use the Admin client to bypass RLS and ensure the alert is saved
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch the student's name for the alert
        const { data: student } = await supabaseAdmin
            .from("children")
            .select("full_name")
            .eq("id", data.studentId)
            .single();

        await supabaseAdmin.from("security_alerts").insert({
            alert_type: "ACADEMIC_DISHONESTY",
            message: `Student ${student?.full_name || "Unknown"} triggered ${data.violations.length} integrity violations on assignment: "${data.assignmentTitle}".`,
            ip_address: "System Logged",
        });
    }

    return { success: true, score: integrityScore };
}