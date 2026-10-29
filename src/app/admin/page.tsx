import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UserActions from "./user-actions";
import { approveChild } from "./actions";
import AutoRefresh from "./auto-refresh";
import UploadForm from "./UploadForm";
import MeetingControl from "./MeetingControl";
import { ShieldAlert, Activity, CheckCircle, Baby, BrainCircuit, Users, HardDrive } from "lucide-react";

export default async function AdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/sign-in");

    // 1. Fetch Security Alerts
    const { data: alerts } = await supabase
        .from("security_alerts")
        .select("*")
        .eq("is_resolved", false)
        .order("created_at", { ascending: false });

    // 2. Fetch Live Activity Logs
    const { data: logs } = await supabase
        .from("audit_logs")
        .select("*, tba_profiles(full_name, role)")
        .order("created_at", { ascending: false })
        .limit(50);

    // 3. Fetch AI Teacher Oversight Logs
    const { data: teacherLogs } = await supabase
        .from("audit_logs")
        .select("*, tba_profiles(full_name)")
        .in("action", ["TEACHER_LEFT_APP", "GRADED_WITHOUT_FEEDBACK"])
        .order("created_at", { ascending: false })
        .limit(10);

    // 4. Fetch All Users
    const { data: usersData, error } = await supabase.rpc("get_all_users");
    const users = usersData as any[] | null;

    // 5. Fetch Pending Children
    const { data: pendingChildren } = await supabase
        .from("children")
        .select("*")
        .eq("is_approved", false)
        .order("created_at", { ascending: false });

    if (error) return <div className="p-8 text-red-600">Error loading users: {error.message}</div>;

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-24">
            <AutoRefresh />

            {/* 🚀 HEADER */}
            <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400"><ShieldAlert size={24} /></div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Command Center</h1>
                            <p className="text-xs text-slate-400">Admin Dashboard</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 mt-8 space-y-8">

                {/* 🚨 TOP ROW: SECURITY & LIVE MEETING */}
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                                <ShieldAlert className="text-red-400" /> Live Security Threats
                            </h2>
                            {alerts && alerts.length > 0 ? (
                                <div className="space-y-4">
                                    {alerts.map((alert) => (
                                        <div key={alert.id} className="bg-red-950/30 border border-red-900/50 p-4 rounded-2xl flex justify-between items-center">
                                            <div>
                                                <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">{alert.alert_type}</span>
                                                <p className="mt-2 text-sm text-red-200 font-medium">{alert.message}</p>
                                            </div>
                                            <form action={async () => {
                                                "use server";
                                                const supabase = await createClient();
                                                await supabase.from("security_alerts").update({ is_resolved: true }).eq("id", alert.id);
                                            }}>
                                                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-xl transition-colors">Resolve</button>
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

                        {/* AI OVERSIGHT */}
                        <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-3xl p-6">
                            <h2 className="text-lg font-bold text-indigo-300 flex items-center gap-2 mb-4">
                                <BrainCircuit className="text-indigo-400" /> AI Teacher Oversight
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                {teacherLogs?.map(log => (
                                    <div key={log.id} className={`p-4 rounded-2xl border ${log.action === 'TEACHER_LEFT_APP' ? 'border-amber-900/50 bg-amber-950/20' : 'border-red-900/50 bg-red-950/20'}`}>
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
                        </div>
                    </div>

                    {/* RIGHT COLUMN: LIVE MEETING CONTROL */}
                    <div className="space-y-6">
                        <MeetingControl />

                        {/* QUICK STATS */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Users className="text-emerald-400" /> User Stats</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                    <p className="text-3xl font-extrabold text-white">{users?.length || 0}</p>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Total Users</p>
                                </div>
                                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                    <p className="text-3xl font-extrabold text-amber-400">{pendingChildren?.length || 0}</p>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Pending Kids</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 👶 PENDING STUDENT APPROVALS */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                    <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2 mb-4">
                        <Baby /> Pending Approvals
                    </h2>
                    {pendingChildren && pendingChildren.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingChildren.map((child) => (
                                <div key={child.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-white">{child.full_name}</p>
                                        <p className="text-xs text-slate-400">{child.class_name}</p>
                                    </div>
                                    <form action={approveChild}>
                                        <input type="hidden" name="childId" value={child.id} />
                                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl transition-colors">
                                            <CheckCircle size={20} />
                                        </button>
                                    </form>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm">No pending approvals. All students verified!</p>
                    )}
                </div>

                {/* 🎮 UPLOADER & LOGS */}
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><HardDrive className="text-blue-400" /> 3D Model Uploader</h2>
                        <UploadForm />
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-[500px] flex flex-col">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4"><Activity className="text-indigo-400" /> System Logs</h2>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                            {logs?.map((log) => (
                                <div key={log.id} className="flex items-start gap-3 text-sm p-3 rounded-xl bg-slate-950 border border-slate-800/50">
                                    <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${log.action.includes('FAILED') ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                    <div>
                                        <p className="text-slate-300"><strong className="text-white">{log.tba_profiles?.full_name || "System"}</strong> {log.action}</p>
                                        <p className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 👥 USER MANAGEMENT */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-hidden">
                    <h2 className="text-lg font-bold text-white mb-6">User Management</h2>
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
                </div>

            </div>
        </main>
    );
}