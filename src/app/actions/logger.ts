"use server";

import { createClient } from "@supabase/supabase-js";

const getAdminClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

/**
 * Logs a standard activity event to the audit_logs table.
 */
export async function logEvent(action: string, details: any = {}) {
    const supabaseAdmin = getAdminClient();
    await supabaseAdmin.from("audit_logs").insert({
        action,
        details
    });
}

/**
 * Creates a high-priority security alert.
 */
export async function logSecurityAlert(alertType: string, message: string, ipAddress: string = "System Logged") {
    const supabaseAdmin = getAdminClient();
    await supabaseAdmin.from("security_alerts").insert({
        alert_type: alertType,
        message,
        ip_address: ipAddress
    });
}