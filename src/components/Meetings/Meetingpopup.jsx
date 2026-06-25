import React from 'react'
import { X } from 'lucide-react';
import { MeetingAttachments } from './MeetingAttachements';
import { useApp } from '../../context/AppContext'; // <-- 1. Import useApp context

export default function Meetingpopup({ isOpen, onClose, teamsLink }) {
    const { currentUser } = useApp(); // <-- 2. Retrieve current user info

    if (!isOpen) return null;

    
    const isOrganizer = teamsLink?.organizerId && String(teamsLink.organizerId) === String(currentUser?.id);
    const isAdmin = currentUser?.role === 'Admin';
    const canManage = isAdmin || isOrganizer;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
            <div className='w-full max-w-3xl rounded-xl bg-white shadow-xl'>
                <div className='flex items-center justify-between border border-b p-5'>
                    <h2 className='text-xl font-semibold'>
                        Meeting Detail
                    </h2>
                    <button onClick={onClose}>
                        <X size={14}/>
                    </button>
                </div>

                <div className='space-y-8 p-6'>
                    {/* Join Meeting Link */}
                    <section>
                        <h3 className='mb-3 text-lg font-medium'>
                            Join Meeting
                        </h3>
                        <button
                            onClick={() => window.open(teamsLink?.joinUrl || "#", "_blank")}
                            className='rounded-md bg-blue-600 px-5 py-2 text-white'
                        >
                            Join Teams Meeting
                        </button>
                    </section>

                   
                    <section>
                        <MeetingAttachments 
                            meetingId={teamsLink?.id} 
                            canManage={canManage} 
                        />
                    </section>
                </div>
            </div>
        </div>
    )
}