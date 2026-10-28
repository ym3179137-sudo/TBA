import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UserActions from "./user-actions";
import { approveChild } from "./actions";
import AutoRefresh from "./auto-refresh";
import UploadForm from "./UploadForm";
import { ShieldAlert, Activity, ExternalLink, CheckCircle, Baby, BrainCircuit } from "lucide-react";

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
        <main className="p-8 max-w-7xl mx-auto space-y-12 text-slate-900 bg-slate-50 min-h-screen">
            <AutoRefresh /> {/* ⏱️ THE 5-SECOND LIVE REFRESH */}

            {/* 🚨 SECURITY PANEL */}
            <section>
                <h1 className="text-3xl font-extrabold flex items-center gap-3 mb-6">
                    <ShieldAlert className="w-8 h-8 text-red-600" /> Live Security Threats
                </h1>
                {alerts && alerts.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        {alerts.map((alert) => (
                            <div key={alert.id} className="bg-red-50 border-2 border-red-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
                                <div>
                                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">{alert.alert_type}</span>
                                    <p className="mt-3 font-medium text-red-900">{alert.message}</p>
                                    <p className="text-sm text-red-700 mt-2 flex items-center gap-2">
                                        <strong>Attacker IP:</strong>
                                        <a href={`https://ipinfo.io/${alert.ip_address}`} target="_blank" rel="noreferrer" className="underline flex items-center gap-1 hover:text-red-900">
                                            {alert.ip_address} <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </p>
                                </div>
                                <form action={async () => {
                                    "use server";
                                    const supabase = await createClient();
                                    await supabase.from("security_alerts").update({ is_resolved: true }).eq("id", alert.id);
                                }}>
                                    <button type="submit" className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-colors">
                                        Resolve Alert
                                    </button>
                                </form>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-emerald-800 flex items-center gap-3">
                        <ShieldAlert className="w-6 h-6" /> No active threats detected. The system is secure.
                    </div>
                )}
            </section>

            {/* 🤖 AI TEACHER OVERSIGHT */}
            <section className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <BrainCircuit className="w-6 h-6 text-indigo-600" /> AI Teacher Oversight Report
                </h2>
                <p className="text-sm text-indigo-700 mb-4">The AI monitors teacher behavior for quality assurance.</p>

                <div className="grid md:grid-cols-2 gap-4">
                    {teacherLogs?.map(log => (
                        <div key={log.id} className={`p-4 rounded-xl border-l-4 ${log.action === 'TEACHER_LEFT_APP' ? 'border-amber-500 bg-amber-50' : 'border-red-500 bg-red-50'}`}>
                            <p className="font-bold text-slate-800">{log.tba_profiles?.full_name}</p>
                            <p className="text-sm text-slate-600">
                                {log.action === 'TEACHER_LEFT_APP'
                                    ? "⚠️ Teacher switched tabs/left the app during an active session."
                                    : "❌ Teacher graded an assignment without providing feedback."}
                            </p>
                            <p className="text-xs text-slate-400 mt-2">{new Date(log.created_at).toLocaleString()}</p>
                        </div>
                    ))}
                    {(!teacherLogs || teacherLogs.length === 0) && (
                        <p className="text-slate-500 text-sm italic">All teachers are performing optimally. No suspicious activity.</p>
                    )}
                </div>
            </section>

            {/* 🎮 3D AVATAR UPLOADER */}
            <section className="bg-white p-6 rounded-2xl border shadow-sm">
                <h2 className="text-2xl font-bold mb-4">Upload 3D Character (GLB)</h2>
                <p className="text-slate-500 mb-6 text-sm">Upload character models for students to buy. Our system scans the file signature to block malicious viruses.</p>
                <UploadForm />
            </section>

            {/* 👶 PENDING STUDENT APPROVALS */}
            <section>
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-4 text-amber-600">
                    <Baby className="w-6 h-6" /> Pending Student Approvals
                </h2>
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                    {pendingChildren && pendingChildren.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-4 font-medium">Student Name</th>
                                    <th className="p-4 font-medium">Class</th>
                                    <th className="p-4 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingChildren.map((child) => (
                                    <tr key={child.id} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="p-4 font-medium">{child.full_name}</td>
                                        <td className="p-4">{child.class_name}</td>
                                        <td className="p-4">
                                            <form action={approveChild}>
                                                <input type="hidden" name="childId" value={child.id} />
                                                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
                                                    <CheckCircle className="w-4 h-4" /> Approve Child
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-6 text-slate-500 text-center">No pending approvals. All students are verified!</div>
                    )}
                </div>
            </section>

            {/* 🕵️ ACTIVITY FEED */}
            <section>
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                    <Activity className="w-6 h-6 text-emerald-600" /> Live System Activity
                </h2>
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                    <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b sticky top-0 z-10">
                                <tr>
                                    <th className="p-4 font-semibold text-slate-600">Time</th>
                                    <th className="p-4 font-semibold text-slate-600">User</th>
                                    <th className="p-4 font-semibold text-slate-600">Action</th>
                                    <th className="p-4 font-semibold text-slate-600">IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs?.map((log) => (
                                    <tr key={log.id} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="p-4 text-xs text-slate-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                                        <td className="p-4 font-medium">{log.tba_profiles?.full_name || "Unknown/Login Attempt"}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${log.action.includes('FAILED') || log.action.includes('LEFT') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-mono text-blue-600">{log.ip_address}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* 👥 USER MANAGEMENT */}
            <section>
                <h2 className="text-2xl font-bold mb-4">User Management</h2>
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="p-4 font-medium">Name</th>
                                <th className="p-4 font-medium">Email</th>
                                <th className="p-4 font-medium">Role</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users?.map((u) => (
                                <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50">
                                    <td className="p-4">{u.full_name || "—"}</td>
                                    <td className="p-4">{u.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                u.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                                                    u.role === 'student' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {u.is_banned ? <span className="text-red-600 font-bold">Banned</span> : <span className="text-emerald-600">Active</span>}
                                    </td>
                                    <td className="p-4">
                                        {u.id !== user.id ? (
                                            <UserActions userId={u.id} currentRole={u.role} isBanned={u.is_banned || false} />
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">That's you</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

        </main>
    );
}