import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./sign-out-button";

export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/sign-in");

    const { data: profile } = await supabase
        .from("tba_profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single();

    if (profile?.role === "admin") redirect("/admin");
    if (profile?.role === "teacher") redirect("/teacher");
    if (profile?.role === "parent") redirect("/parent");

    return (
        <main className="p-8">
            <h1 className="text-2xl font-bold">Welcome, {profile?.full_name}</h1>
            <p className="text-slate-600">Role: {profile?.role}</p>
            <SignOutButton />
        </main>
    );
}