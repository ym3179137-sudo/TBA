import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import UserActions from "./user-actions";
import AutoRefresh from "./auto-refresh";
import UploadForm from "./UploadForm";
// 🚨 IMPORT THE TRANSFER ACTION
import { transferTeacherClasses } from "@/app/actions/admin-transfer";
import {
    ShieldAlert, Activity, CheckCircle, Baby, BrainCircuit,
    Users, HardDrive, Video, UserPlus, Lock, ArrowRightLeft
} from "lucide-react";

export default async function AdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/sign-in");

    // --- 1. FETCH DATA ---
    const { data: alerts } = await supabase
        .from("security_alerts")
        .select("*")
        .eq("is_resolved", false)
        .order("created_at", { ascending: false });

    const { data: logs } = await supabase
        .from("audit_logs")
        .select("*, tba_profiles(full_name, role)")
        .order("created_at", { ascending: false })
        .limit(50);

    const { data: teacherLogs } = await supabase
        .from("audit_logs")
        .select("*, tba_profiles(full_name)")
        .in("action", ["TEACHER_LEFT_APP", "GRADED_WITHOUT_FEEDBACK"])
        .order("created_at", { ascending: false })
        .limit(10);

    const { data: usersData, error } = await supabase.rpc("get_all_users");
    const users = usersData as any[] | null;

    // Fetch Pending Students (Waiting for Admin Approval)
    const { data: pendingChildren } = await supabase
        .from("children")
        .select("*")
        .eq("is_approved", false)
        .order("created_at", { ascending: false });

    // Fetch Teachers for Assignment Dropdown
    const { data: teachers } = await supabase
        .from("tba_profiles")
        .select("id, full_name")
        .eq("role", "teacher");

    // Fetch Meeting Settings
    const { data: schoolSettings } = await supabase
        .from("school_settings")
        .select("meetings_enabled_by_admin")
        .single();

    const meetingsEnabled = schoolSettings?.meetings_enabled_by_admin || false;

    if (error) return <div className="p-8 text-red-600">Error loading users: {error.message}</div>;

    return (
        <main className="p-8 max-w-7xl mx-auto space-y-12 text-slate-200 bg-slate-950 min-h-screen font-sans">
            <AutoRefresh /> {/* 5-Second Live Refresh */}

            {/* 🚀 HEADER */}
            <div className="border-b border-slate-800 pb-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400"><ShieldAlert size={28} /></div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-white">Command Center</h1>
                        <p className="text-sm text-slate-400">School Principal Dashboard</p>
                    </div>
                </div>
            </div>

            {/* 🚨 TOP ROW: MEETING CONTROL & SECURITY */}
            <div className="grid lg:grid-cols-3 gap-6">

                {/* MEETING MASTER SWITCH */}
                <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <Video className="text-indigo-400" /> Meeting Master Switch
                    </h2>
                    <p className="text-slate-400 text-sm mb-6">
                        If turned off, NO ONE (Teachers or Students) can start LiveKit video meetings.
                    </p>
                    <form action={async () => {
                        "use server";
                        const supabase = await createClient();
                        await supabase.from("school_settings").update({
                            meetings_enabled_by_admin: !meetingsEnabled
                        }).eq("id", 1);
                        revalidatePath("/admin");
                    }}>
                        <button
                            type="submit"
                            className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${meetingsEnabled
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                }`}
                        >
                            {meetingsEnabled ? (
                                <><Lock size={20} /> Turn OFF All Meetings</>
                            ) : (
                                <><Video size={20} /> Enable Meetings</>
                            )}
                        </button>
                    </form>
                    <div className="mt-4 text-center">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${meetingsEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            Status: {meetingsEnabled ? "LIVE" : "LOCKED"}
                        </span>
                    </div>
                </div>

                {/* SECURITY THREATS */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                        <ShieldAlert className="text-red-400" /> Live Security Threats
                    </h2>
                    {alerts && alerts.length > 0 ? (
                        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                            {alerts.map((alert) => (
                                <div key={alert.id} className="bg-red-950/30 border border-red-900/50 p-4 rounded-xl flex justify-between items-center">
                                    <div>
                                        <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">{alert.alert_type}</span>
                                        <p className="mt-2 text-sm text-red-200 font-medium">{alert.message}</p>
                                    </div>
                                    <form action={async () => {
                                        "use server";
                                        const supabase = await createClient();
                                        await supabase.from("security_alerts").update({ is_resolved: true }).eq("id", alert.id);
                                        revalidatePath("/admin");
                                    }}>
                                        <button type="submit" className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-xl">Resolve</button>
                                    </form>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-emerald-950/30 border border-emerald-900/50 p-6 rounded-2xl text-emerald-400 flex items-center gap-3">
                            <CheckCircle className="w-6 h-6" /> System is secure. No active threats.
                        </div>
                    )}
                </div>
            </div>

            {/* 👶 PENDING APPROVALS & TEACHER ASSIGNMENT */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2 mb-6">
                    <Baby /> Pending Student Approvals & Teacher Assignment
                </h2>

                {pendingChildren && pendingChildren.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        {pendingChildren.map((child) => (
                            <div key={child.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
                                <div>
                                    <p className="font-bold text-white text-lg">{child.full_name}</p>
                                    <p className="text-xs text-slate-400">Requested Grade: {child.class_name || "N/A"}</p>
                                </div>

                                <form action={async (formData) => {
                                    "use server";
                                    const teacherId = formData.get("teacherId");
                                    if (!teacherId) return;

                                    const supabase = await createClient();
                                    await supabase.from("children").update({
                                        teacher_id: teacherId,
                                        is_approved: true
                                    }).eq("id", child.id);

                                    revalidatePath("/admin");
                                }} className="flex gap-2">

                                    <select name="teacherId" required className="flex-1 bg-slate-900 text-white text-sm p-3 rounded-xl border border-slate-700 outline-none focus:border-emerald-500">
                                        <option value="">Assign to Teacher...</option>
                                        {teachers?.map(t => (
                                            <option key={t.id} value={t.id}>{t.full_name}</option>
                                        ))}
                                    </select>

                                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-3 rounded-xl transition-colors flex items-center gap-2">
                                        <UserPlus size={18} /> Approve
                                    </button>
                                </form>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 text-sm text-center py-6">No pending approvals. All students are assigned and verified!</p>
                )}
            </section>

            {/* 🚨 TEACHER HANDOVER SYSTEM */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                    <ArrowRightLeft className="text-blue-400" /> Teacher Handover & Substitutes
                </h2>
                <p className="text-sm text-slate-400 mb-6">
                    Transfer all classes and students from one teacher to another (e.g., for a substitute) or leave them unassigned if a teacher leaves.
                </p>

                <form action={async (formData) => {
                    "use server";
                    const fromId = formData.get("fromId") as string;
                    const toId = formData.get("toId") as string || null;
                    if (!fromId) return;

                    await transferTeacherClasses(fromId, toId);
                }} className="flex flex-col md:flex-row gap-4 items-end bg-slate-950 p-6 rounded-2xl border border-slate-800">

                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-slate-400 mb-2">From Teacher (Leaving/Absent)</label>
                        <select name="fromId" required className="w-full bg-slate-900 text-white text-sm p-3 rounded-xl border border-slate-700 outline-none focus:border-blue-500">
                            <option value="">Select Teacher...</option>
                            {teachers?.map(t => (
                                <option key={t.id} value={t.id}>{t.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-slate-400 mb-2">To Teacher (Substitute/New)</label>
                        <select name="toId" className="w-full bg-slate-900 text-white text-sm p-3 rounded-xl border border-slate-700 outline-none focus:border-emerald-500">
                            <option value="">Leave Unassigned (Archive)</option>
                            {teachers?.map(t => (
                                <option key={t.id} value={t.id}>{t.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                        Transfer Classes
                    </button>
                </form>
            </section>

            {/* 🤖 AI OVERSIGHT & UPLOADER */}
            <div className="grid lg:grid-cols-2 gap-6">
                <section className="bg-indigo-950/30 border border-indigo-900/50 rounded-3xl p-6">
                    <h2 className="text-xl font-bold text-indigo-300 flex items-center gap-2 mb-4">
                        <BrainCircuit className="text-indigo-400" /> AI Teacher Oversight
                    </h2>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {teacherLogs?.map(log => (
                            <div key={log.id} className={`p-4 rounded-xl border ${log.action === 'TEACHER_LEFT_APP' ? 'border-amber-900/50 bg-amber-950/20' : 'border-red-900/50 bg-red-950/20'}`}>
                                <p className="font-bold text-white">{log.tba_profiles?.full_name}</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {log.action === 'TEACHER_LEFT_APP' ? "⚠️ Left app during active session." : "❌ Graded without feedback."}
                                </p>
                            </div>
                        ))}
                        {(!teacherLogs || teacherLogs.length === 0) && (
                            <p className="text-slate-500 text-sm italic">All teachers are performing optimally.</p>
                        )}
                    </div>
                </section>

                <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <HardDrive className="text-blue-400" /> 3D Model Uploader
                    </h2>
                    <UploadForm />
                </section>
            </div>

            {/* 👥 USER MANAGEMENT */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-hidden">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Users className="text-indigo-400" /> User Management
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="border-b border-slate-800">
                            <tr>
                                <th className="p-4 font-semibold text-slate-400">Name</th>
                                <th className="p-4 font-semibold text-slate-400">Email</th>
                                <th className="p-4 font-semibold text-slate-400">Role</th>
                                <th className="p-4 font-semibold text-slate-400">Status</th>
                                <th className="p-4 font-semibold text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users?.map((u) => (
                                <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 font-medium text-white">{u.full_name || "—"}</td>
                                    <td className="p-4 text-slate-400">{u.email}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                                            u.role === 'teacher' ? 'bg-blue-500/20 text-blue-400' :
                                                u.role === 'student' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-emerald-500/20 text-emerald-400'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {u.is_banned ? <span className="text-red-400 font-bold bg-red-400/10 px-2 py-1 rounded">Banned</span> : <span className="text-emerald-400 font-medium">Active</span>}
                                    </td>
                                    <td className="p-4">
                                        {u.id !== user.id ? (
                                            <UserActions userId={u.id} currentRole={u.role} isBanned={u.is_banned || false} />
                                        ) : (
                                            <span className="text-xs text-slate-500 italic">You</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* SYSTEM ACTIVITY LOGS */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-[500px] flex flex-col">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                    <Activity className="text-indigo-400" /> System Activity Logs
                </h2>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {logs?.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 text-sm p-3 rounded-xl bg-slate-950 border border-slate-800/50">
                            <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${log.action.includes('FAILED') || log.action.includes('LEFT') ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            <div>
                                <p className="text-slate-300"><strong className="text-white">{log.tba_profiles?.full_name || "System"}</strong> {log.action}</p>
                                <p className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}