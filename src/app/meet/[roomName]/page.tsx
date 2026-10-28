'use client';

import dynamic from 'next/dynamic';

const MeetingClient = dynamic(() => import('./meeting-client'), {
    ssr: false,
    loading: () => (
        <div className="flex h-screen w-screen items-center justify-center bg-[#202124] text-white">
            Loading meeting…
        </div>
    ),
});

export default function MeetingPage() {
    return <MeetingClient />;
}