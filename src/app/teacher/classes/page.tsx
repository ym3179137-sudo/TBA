"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Plus, Users, BookOpen, CheckCircle, Loader2, UserPlus, ShieldAlert } from "lucide-react";

export default function TeacherClassManager() {
    const router = useRouter();
    const supabase = createClient();

    const [classes, setClasses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [newClassName, setNewClassName] = useState("");

    // Add Student States
    const [newStudentName, setNewStudentName] = useState("");
    const [newStudentClassId, setNewStudentClassId] = useState("");
    const [newStudentPin, setNewStudentPin] = useState("");

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [addingStudent, setAddingStudent] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push("/sign-in");

        const { data: classData } = await supabase
            .from("teacher_classes")
            .select("*")
            .eq("teacher_id", user.id)
            .order("created_at", { ascending: true });

        if (classData) {
            setClasses(classData);
            if (classData.length > 0 && !newStudentClassId) {
                setNewStudentClassId(classData[0].id);
            }
        }

        const { data: studentData, error } = await supabase
            .from("children")
            .select("id, full_name, class_id, class_name")
            .eq("teacher_id", user.id)
            .eq("is_approved", true)
            .order("full_name", { ascending: true });

        if (error) console.error("Error fetching students:", error);
        if (studentData) setStudents(studentData);

        setLoading(false);
    }

    async function createClass() {
        if (!newClassName.trim()) return;
        setCreating(true);

        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from("teacher_classes").insert({
            teacher_id: user?.id,
            name: newClassName
        });

        setNewClassName("");
        setCreating(false);
        fetchData();
    }

    async function addNewStudent(e: React.FormEvent) {
        e.preventDefault();
        if (!newStudentName.trim() || newStudentPin.length !== 4 || !newStudentClassId) {
            return alert("Please enter a name, select a class, and enter a 4-digit PIN.");
        }
        setAddingStudent(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("You must be logged in.");
            setAddingStudent(false);
            return;
        }

        try {
            const res = await fetch("/api/teacher/add-student", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: newStudentName,
                    studentPin: newStudentPin,
                    classId: newStudentClassId,
                    teacherId: user.id
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert("✅ " + data.message);
            setNewStudentName("");
            setNewStudentPin("");

            // 🚨 Instantly update UI with the new student
            if (data.student) {
                setStudents(prev => {
                    const exists = prev.find(s => s.id === data.student.id);
                    if (exists) {
                        return prev.map(s => s.id === data.student.id ? data.student : s);
                    }
                    return [...prev, data.student];
                });
            }

            fetchData(); // Sync everything

        } catch (err: any) {
            alert("Failed to add student: " + err.message);
        } finally {
            setAddingStudent(false);
        }
    }

    async function assignStudent(studentId: string, classId: string) {
        const className = classes.find(c => c.id === classId)?.name || null;
        const { error } = await supabase.from("children").update({ class_id: classId, class_name: className }).eq("id", studentId);
        if (error) alert(error.message);
        fetchData();
    }

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

    const unassignedStudents = students.filter(s => !s.class_id);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
            <div className="max-w-6xl mx-auto">

                <Link href="/teacher" prefetch={false} className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white mb-6">
                    <ArrowLeft size={16} /> Back to Hub
                </Link>

                <h1 className="text-3xl font-extrabold text-white mb-8 flex items-center gap-3">
                    <Users className="text-indigo-400 w-8 h-8" /> Class Manager
                </h1>

                <div className="grid md:grid-cols-3 gap-8">

                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Create a Class Group</h2>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="e.g., Lovely Students"
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-indigo-500"
                                />
                                <button
                                    onClick={createClass}
                                    disabled={creating}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                                >
                                    {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} Create Class
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                <UserPlus className="text-emerald-400" size={20} /> Add Student
                            </h2>
                            <form onSubmit={addNewStudent} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Student Full Name"
                                    value={newStudentName}
                                    onChange={(e) => setNewStudentName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-emerald-500"
                                />

                                <select
                                    value={newStudentClassId}
                                    onChange={(e) => setNewStudentClassId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-emerald-500"
                                >
                                    <option value="" disabled>Select a class...</option>
                                    {classes.length === 0 && <option value="">Create a class first!</option>}
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>

                                <input
                                    type="text"
                                    maxLength={4}
                                    placeholder="4-Digit PIN"
                                    value={newStudentPin}
                                    onChange={(e) => setNewStudentPin(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-emerald-500 text-center tracking-widest font-bold"
                                />
                                <button
                                    type="submit"
                                    disabled={addingStudent || classes.length === 0}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {addingStudent ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />} Add to Roster
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-6">

                        {unassignedStudents.length > 0 && (
                            <div className="bg-amber-900/20 border border-amber-500/30 rounded-3xl p-6">
                                <h2 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                                    <ShieldAlert size={20} /> New Students Needing a Class Group
                                </h2>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {unassignedStudents.map(student => (
                                        <div key={student.id} className="flex flex-col bg-slate-950 p-4 rounded-xl border border-amber-500/20 gap-3">
                                            <div>
                                                <span className="font-bold text-white block">{student.full_name}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {classes.map(cls => (
                                                    <button
                                                        key={cls.id}
                                                        onClick={() => assignStudent(student.id, cls.id)}
                                                        className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-lg font-bold transition-colors"
                                                    >
                                                        + {cls.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {classes.length === 0 ? (
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center">
                                <p className="text-slate-500">Create a class group on the left to start organizing your students.</p>
                            </div>
                        ) : (
                            classes.map((cls) => (
                                <div key={cls.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <BookOpen className="text-emerald-400" size={20} />
                                        <h3 className="font-bold text-lg text-white">{cls.name}</h3>
                                        <span className="bg-slate-800 text-xs px-2 py-1 rounded-full text-slate-400 ml-auto">
                                            {students.filter(s => s.class_id === cls.id).length} Students
                                        </span>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {students.filter(s => s.class_id === cls.id).map(student => (
                                            <div key={student.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                                                <span className="font-medium text-sm text-white">{student.full_name}</span>
                                                <button
                                                    onClick={() => assignStudent(student.id, "")}
                                                    className="text-xs text-red-400 hover:text-red-300 font-bold"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                        {students.filter(s => s.class_id === cls.id).length === 0 && (
                                            <p className="text-slate-600 text-sm italic col-span-2">No students assigned to this group yet.</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}