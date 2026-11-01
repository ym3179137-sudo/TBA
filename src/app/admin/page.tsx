"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    ShieldAlert, Users, HardDrive, Activity, CheckCircle,
    Video, Lock, ArrowRightLeft, BrainCircuit, Baby, UserPlus,
    Loader2, Settings, Database, Shield, Terminal, Zap, AlertTriangle
} from "lucide-react";
import UserActions from "./user-actions";
import UploadForm from "./UploadForm";
import { transferTeacherClasses } from "@/app/actions/admin-transfer";

export default function AdminPage() {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'users' | 'content'>('overview');
    const [loading, setLoading] = useState(true);

    const [alerts, setAlerts] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [pendingChildren, setPendingChildren] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
            if (!user) return router.push("/sign-in");

            const { data: alertsData } = await supabase.from("security_alerts").select("*").eq("is_resolved", false).order("created_at", { ascending: false });
            setAlerts(alertsData || []);

            const { data: logsData } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50);
            setLogs(logsData || []);

            const { data: pendingData } = await supabase.from("children").select("*").eq("is_approved", false);
            setPendingChildren(pendingData || []);

            const { data: teachersData } = await supabase.from("tba_profiles").select("id, full_name").eq("role", "teacher");
            setTeachers(teachersData || []);

            const { data: usersData } = await supabase.rpc("get_all_users");
            setUsers(usersData || []);

            const { data: settingsData } = await supabase.from("school_settings").select("*").single();
            setSettings(settingsData);

            setLoading(false);
        }
        fetchData();
    }, [supabase, router]);

    // 🚨 REAL-TIME LIVE FEED FOR ADMIN
    useEffect(() => {
        const channel = supabase.channel('admin-live-feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
                setLogs((prev) => [payload.new, ...prev].slice(0, 50)); // Keep last 50
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_alerts' }, (payload) => {
                setAlerts((prev) => [payload.new, ...prev]);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [supabase]);

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin w-10 h-10" /></div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-20">

            {/* HEADER */}
            <div className="bg-slate-900 border-b border-slate-800 p-6 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400"><ShieldAlert size={28} /></div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-white">Command Center</h1>
                            <p className="text-sm text-slate-400 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Monitoring Active
                            </p>
                        </div>
                    </div>

                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                        {[
                            { id: 'overview', label: 'Overview', icon: Activity },
                            { id: 'security', label: 'Security', icon: Shield },
                            { id: 'users', label: 'Users', icon: Users },
                            { id: 'content', label: 'Content', icon: Database },
                        ].map((tab) => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                                <tab.icon size={16} /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 space-y-8">

                {/* TAB: OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="grid lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">

                        {/* QUICK STATS */}
                        <div className="space-y-4">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Baby size={80} /></div>
                                <p className="text-slate-400 font-bold mb-1">Pending Approvals</p>
                                <p className="text-4xl font-black text-amber-400">{pendingChildren.length}</p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle size={80} /></div>
                                <p className="text-slate-400 font-bold mb-1">Unresolved Threats</p>
                                <p className="text-4xl font-black text-red-500">{alerts.length}</p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={80} /></div>
                                <p className="text-slate-400 font-bold mb-1">Total Users</p>
                                <p className="text-4xl font-black text-indigo-400">{users.length}</p>
                            </div>
                        </div>

                        {/* LIVE TERMINAL */}
                        <div className="lg:col-span-2 bg-black border border-slate-800 rounded-3xl p-6 shadow-2xl h-[500px] flex flex-col font-mono">
                            <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2 mb-4 border-b border-emerald-900 pb-4">
                                <Terminal size={20} /> LIVE PLATFORM ACTIVITY
                            </h2>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                {logs.map((log, i) => (
                                    <div key={i} className="text-sm flex gap-3 animate-in slide-in-from-left-2">
                                        <span className="text-slate-500 shrink-0">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                                        <span className="text-emerald-500 font-bold shrink-0">{log.action}</span>
                                        <span className="text-slate-300 truncate">
                                            {log.details ? JSON.stringify(log.details) : "No details"}
                                        </span>
                                    </div>
                                ))}
                                {logs.length === 0 && <p className="text-slate-600 italic">Waiting for activity...</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: SECURITY */}
                {activeTab === 'security' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6"><ShieldAlert className="text-red-400" /> Live Security Threats</h2>
                            {alerts.length === 0 ? (
                                <div className="bg-emerald-950/30 border border-emerald-900/50 p-6 rounded-2xl text-emerald-400 flex items-center gap-3"><CheckCircle className="w-6 h-6" /> System is secure. No active threats.</div>
                            ) : (
                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                    {alerts.map((alert) => (
                                        <div key={alert.id} className="bg-red-950/30 border border-red-900/50 p-4 rounded-xl flex justify-between items-center animate-in zoom-in">
                                            <div>
                                                <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">{alert.alert_type}</span>
                                                <p className="mt-2 text-sm text-red-200 font-medium">{alert.message}</p>
                                                <p className="text-xs text-red-500/50 mt-1">{new Date(alert.created_at).toLocaleString()} • {alert.ip_address}</p>
                                            </div>
                                            <button onClick={async () => {
                                                await supabase.from("security_alerts").update({ is_resolved: true }).eq("id", alert.id);
                                                setAlerts(alerts.filter(a => a.id !== alert.id));
                                            }} className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-xl shrink-0 ml-4">Resolve</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: USERS (Same as before) */}
                {activeTab === 'users' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        {/* ... Paste the exact same User Management, Pending Approvals, and Teacher Handover from the previous message here ... */}
                    </div>
                )}

                {/* TAB: CONTENT (Same as before) */}
                {activeTab === 'content' && (
                    <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
                        {/* ... Paste the exact same Uploader and AI Oversight from the previous message here ... */}
                    </div>
                )}

            </div>
        </div>
    );
}