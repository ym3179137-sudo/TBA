"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Plus, Users, BookOpen, CheckCircle, Loader2, UserPlus } from "lucide-react";

export default function TeacherClassManager() {
    const router = useRouter();
    const supabase = createClient();

    const [classes, setClasses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [newClassName, setNewClassName] = useState("");

    // New Student States
    const [newStudentName, setNewStudentName] = useState("");
    const [newStudentGrade, setNewStudentGrade] = useState("KG1");
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

        // Fetch teacher's classes
        const { data: classData } = await supabase
            .from("teacher_classes")
            .select("*")
            .eq("teacher_id", user.id)
            .order("created_at", { ascending: true });
        if (classData) setClasses(classData);

        // 🚨 FIX: Fetch ALL approved students, not just the ones assigned to this teacher
        const { data: studentData } = await supabase
            .from("children")
            .select("id, full_name, class_id, class_name")
            .eq("is_approved", true)
            .order("full_name", { ascending: true });

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

    // 🚨 Add a new student directly
    async function addNewStudent(e: React.FormEvent) {
        e.preventDefault();
        if (!newStudentName.trim() || newStudentPin.length !== 4) {
            return alert("Please enter a name and a 4-digit PIN.");
        }
        setAddingStudent(true);

        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from("children").insert({
            teacher_id: user?.id,
            full_name: newStudentName,
            class_name: newStudentGrade,
            student_pin: newStudentPin,
            is_approved: true // Auto-approve since the teacher is adding them
        });

        setAddingStudent(false);

        if (error) {
            alert("Failed to add student: " + error.message);
        } else {
            setNewStudentName("");
            setNewStudentPin("");
            fetchData();
        }
    }

    async function assignStudent(studentId: string, classId: string) {
        await supabase.from("children").update({ class_id: classId }).eq("id", studentId);
        fetchData();
    }

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

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

                    {/* LEFT COLUMN: Forms */}
                    <div className="space-y-6">

                        {/* Create Class Form */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Create a Class Group</h2>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="e.g., KG1 Blue Group"
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

                        {/* Add Student Form */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
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
                                    value={newStudentGrade}
                                    onChange={(e) => setNewStudentGrade(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-emerald-500"
                                >
                                    <option value="Pre-K">Pre-K</option>
                                    <option value="KG1">KG1</option>
                                    <option value="KG2">KG2</option>
                                    <option value="Grade 1">Grade 1</option>
                                </select>
                                <input
                                    type="text"
                                    maxLength={4}
                                    placeholder="4-Digit PIN (e.g. 1234)"
                                    value={newStudentPin}
                                    onChange={(e) => setNewStudentPin(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-emerald-500 text-center tracking-widest font-bold"
                                />
                                <button
                                    type="submit"
                                    disabled={addingStudent}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                                >
                                    {addingStudent ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />} Add to Roster
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Manage Students */}
                    <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <h2 className="text-xl font-bold text-white mb-6">Assign Students to Classes</h2>

                        {classes.length === 0 ? (
                            <p className="text-slate-500">Create a class first to start assigning students.</p>
                        ) : (
                            <div className="space-y-6">
                                {classes.map((cls) => (
                                    <div key={cls.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <BookOpen className="text-emerald-400" size={20} />
                                            <h3 className="font-bold text-lg text-white">{cls.name}</h3>
                                            <span className="bg-slate-800 text-xs px-2 py-1 rounded-full text-slate-400 ml-auto">
                                                {students.filter(s => s.class_id === cls.id).length} Students
                                            </span>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {students.map(student => (
                                                <div key={student.id} className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                                                    <span className="font-medium text-sm">{student.full_name}</span>
                                                    <button
                                                        onClick={() => assignStudent(student.id, student.class_id === cls.id ? null : cls.id)}
                                                        className={`p-1.5 rounded-lg transition-all ${student.class_id === cls.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                            {students.length === 0 && <p className="text-slate-600 text-sm col-span-2">No students in your roster yet.</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}