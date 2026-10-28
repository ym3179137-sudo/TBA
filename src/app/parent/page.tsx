"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { UserPlus, LogOut, CheckCircle, Clock, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ParentPage() {
    const [children, setChildren] = useState<any[]>([]);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [className, setClassName] = useState("KG1");
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        fetchChildren();
    }, []);

    async function fetchChildren() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("children").select("*").eq("parent_id", user.id).order("created_at", { ascending: false });
        if (data) setChildren(data);
    }

    async function handleAddChild(e: React.FormEvent) {
        e.preventDefault();
        if (pin.length !== 4 || isNaN(Number(pin))) return alert("PIN must be 4 numbers.");

        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return alert("You must be logged in.");

        const fullName = `${firstName.trim()} ${lastName.trim()}`;

        const { error } = await supabase.from("children").insert({
            parent_id: user.id,
            full_name: fullName,
            class_name: className,
            student_pin: pin,
            is_approved: false
        });

        setLoading(false);

        if (error) {
            if (error.code === '23505') {
                alert("A student with this exact name and PIN already exists. Please choose a different PIN.");
            } else {
                alert(error.message);
            }
        } else {
            setFirstName(""); setLastName(""); setPin("");
            fetchChildren();
        }
    }

    async function handleDeleteChild(id: string) {
        if (!confirm("Are you sure you want to delete this child?")) return;
        const { error } = await supabase.from("children").delete().eq("id", id);
        if (error) alert(error.message);
        else fetchChildren();
    }

    async function handleSignOut() {
        await supabase.auth.signOut();
        document.cookie = "tba_login_time=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push("/sign-in");
        router.refresh();
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <nav className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">P</div>
                    <span className="font-bold text-lg">Parent Portal</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900">Home</Link>
                    <button onClick={handleSignOut} className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                        <LogOut className="w-4 h-4" /> Sign out
                    </button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto p-8">
                <div className="grid md:grid-cols-2 gap-8">

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 h-fit">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <UserPlus className="text-emerald-500 w-6 h-6" /> Add a Child
                        </h2>

                        <form onSubmit={handleAddChild} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                                    <input placeholder="e.g., Leo" value={firstName} onChange={e => setFirstName(e.target.value)} required className="w-full border rounded-xl px-4 py-3 bg-slate-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                                    <input placeholder="e.g., Smith" value={lastName} onChange={e => setLastName(e.target.value)} required className="w-full border rounded-xl px-4 py-3 bg-slate-50" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Class Level</label>
                                <select value={className} onChange={e => setClassName(e.target.value)} className="w-full border rounded-xl px-4 py-3 bg-slate-50">
                                    <option value="Pre-K">Pre-K</option>
                                    <option value="KG1">KG1</option>
                                    <option value="KG2">KG2</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">4-Digit Student PIN</label>
                                <input type="text" maxLength={4} placeholder="e.g., 1234" value={pin} onChange={e => setPin(e.target.value)} required className="w-full border rounded-xl px-4 py-3 bg-slate-50 text-center tracking-[0.5em] font-bold text-lg" />
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-md disabled:opacity-50 mt-4">
                                {loading ? "Adding..." : "Add Child"}
                            </button>
                        </form>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold mb-6">My Children</h2>
                        {children.length === 0 ? (
                            <div className="bg-white p-8 rounded-3xl shadow-sm border text-center">
                                <p className="text-slate-500">No children added yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {children.map((child) => (
                                    <div key={child.id} className="bg-white p-6 rounded-2xl shadow-sm border flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-lg text-slate-900">{child.full_name}</p>
                                            <p className="text-sm text-slate-500 font-medium mt-1">Class: {child.class_name || "N/A"}</p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {child.is_approved ? (
                                                <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                                                    <CheckCircle className="w-4 h-4" /> Approved
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-sm font-bold text-amber-700 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
                                                    <Clock className="w-4 h-4" /> Pending Admin
                                                </span>
                                            )}

                                            {/* 🗑️ DELETE BUTTON */}
                                            <button onClick={() => handleDeleteChild(child.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </main>
    );
}