"use client";
import { useState, useRef } from 'react';
import { useLockMode } from '@/hooks/useLockMode';

export default function DocAssignmentEditor({ assignment, studentId, onSave }: any) {
    const [content, setContent] = useState('');
    const [violations, setViolations] = useState<string[]>([]);
    const isLocked = assignment.settings?.lockMode === true;

    // 1. Lock Mode Hook
    const { violationCount } = useLockMode(isLocked, (reason) => {
        setViolations(prev => [...prev, reason]);
    });

    // 2. Paste Tracker
    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pastedText = e.clipboardData.getData('text');
        if (pastedText.length > 50) { // Threshold to ignore short copy-pastes
            e.preventDefault(); // Prevent the paste
            setViolations(prev => [...prev, `Pasted ${pastedText.length} characters`]);
            alert("Large pastes are not allowed in this assignment.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-3xl shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{assignment.title}</h1>
                {isLocked && (
                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold">
                        LOCK MODE ACTIVE
                    </span>
                )}
            </div>

            <textarea
                className="w-full h-96 p-4 border rounded-xl resize-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Start writing your answer here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
            />

            {violations.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <h3 className="text-sm font-bold text-red-600 mb-2">Integrity Violations Logged:</h3>
                    <ul className="list-disc pl-4 text-xs text-red-500">
                        {violations.map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                </div>
            )}

            <button
                onClick={() => onSave({ content, violations })}
                className="mt-6 bg-emerald-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-emerald-500 transition-all"
            >
                Submit Assignment
            </button>
        </div>
    );
}