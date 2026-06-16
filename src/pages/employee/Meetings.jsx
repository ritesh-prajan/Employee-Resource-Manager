// pages/employee/Meetings.jsx
import Part from '#components/Meetings/Part.jsx';
import Schedulemeeting from '#components/Meetings/Schedulemeeting.jsx';
import React, { useState } from 'react';
import { LIVE_SYNCS, UPCOMING_SYNCS, HISTORY_SYNCS } from "../../components/mock_dataset/Data_admin_meetings";
import { Video, Calendar, CheckCircle2,Plus } from "lucide-react";

const tabs = ["Live Now", "Upcoming Syncs", "Completed History"];

export default function Meetings() { 
    const [live] = useState(LIVE_SYNCS || []);
    const [upcoming] = useState(UPCOMING_SYNCS || []);
    const [completed] = useState(HISTORY_SYNCS || []);
    const [schedule,setschedule]=useState(false);
    const [activetab, setactivetab] = useState("Live Now");

    const getTabLabel = (tab) => {
        switch(tab) {
            case "Live Now":
                return `Live Now (${live.length})`;
            case "Upcoming Syncs":
                return `Upcoming Syncs (${upcoming.length})`;
            case "Completed History":
                return `Completed History (${completed.length})`;
            default:
                return tab;
        }
    };

    return (
        <div className="w-full flex flex-col gap-4" style={{ zoom: 0.8 }}>
            <div className="mx-auto w-full flex flex-col gap-4" style={{ maxWidth: "1000px" }}>
                <h1 className='text-2xl font-bold'>Meetings</h1>
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <Schedulemeeting/>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {tabs.map((tab) => {
                            const isActive = activetab === tab;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setactivetab(tab)}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition cursor-pointer flex items-center ${
                                        isActive
                                            ? "bg-[#0010AE] text-white shadow-sm"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    {tab === "Live Now" && (
                                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block mr-1.5 shrink-0"></span>
                                    )}
                                    {getTabLabel(tab)}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                {activetab === "Live Now" ? (
                    live.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-sm">
                            <Video className="mx-auto text-slate-300 mb-2" size={32} />
                            <p className="text-sm font-medium">No live syncs active right now.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 w-full">
                            {live.map((l) => (
                                <Part data={l} key={l.id} />
                            ))}
                        </div>
                    )
                ) : activetab === "Upcoming Syncs" ? (
                    upcoming.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-sm">
                            <Calendar className="mx-auto text-slate-300 mb-2" size={32} />
                            <p className="text-sm font-medium">No upcoming syncs scheduled.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 w-full">
                            {upcoming.map((u) => (
                                <Part data={u} key={u.id} />
                            ))}
                        </div>
                    )
                ) : (
                    completed.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-sm">
                            <CheckCircle2 className="mx-auto text-slate-300 mb-2" size={32} />
                            <p className="text-sm font-medium">No meeting history found.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 w-full">
                            {completed.map((h) => (
                                <Part data={h} key={h.id} isCompleted={true} />
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}