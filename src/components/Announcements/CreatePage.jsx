import React from 'react'
import { useState } from 'react'
import Teamchannelpicker from './Teamchannelpicker'
import { SEVERITY_CONFIG,ALL_SEVERITIES } from './healpers'
export default function CreatePage({ onPublish }) {
    const [title,      setTitle]      = useState("");
    const [content,    setContent]    = useState("");
    const [severity,   setSeverity]   = useState("info");
    const [toFeed,     setToFeed]     = useState(true);
    const [toTeams,    setToTeams]    = useState(false);
    const [teamId,     setTeamId]     = useState("");
    const [channelId,  setChannelId]  = useState("");
    const [error,      setError]      = useState("");

    function validation(){
        if(!title.trim()) return "Please add a title";
        if(!content.trim()) return "Please add some content"
        if(!toFeed && !toTeams) return "Select atleast one destination"
        if(toTeams && !teamId) return "Select a team"
        if(toTeams&& !channelId) return "Select a channel"
        return null;
    }
    function handlepublish(){
        const validateerror=validation();
        if(validateerror){setError(validateerror); return}

        const newannouncement={
            id:Date.now(),
            title:title.trim(),
            content:content.trim(),
            severity,
            createdby:"you",
            createdat: new Date().toISOString(),
            teamId:toTeams?teamId:null,
            channelId:toTeams?channelId:null,
            teamsmessageid:null,
        };

        onPublish(newannouncement);
        resetform()
    }
    function resetform(){
        setTitle("")
        setContent("")
        setSeverity("info")
        setToFeed(true)
        setToTeams(false)
        setTeamId("")
        setChannelId("")
        setError("")
    }
    return (
        <div className='flex flex-col gap-5'>
            <div className='form-group'>
                <label htmlFor="ann-title" className='form-label'>
                    Title
                </label>
                <input
                    type="text"
                    id="ann-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className='input-control'
                />
            </div>
            <div className='form-group'>
                <label htmlFor="ann-content" className='form-label'>
                    Content
                </label>
                <textarea
                    id="ann-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    className='input-control resize-y'
                ></textarea>
            </div>
            <div className='form-group'>
                <span className='form-label'>
                    Severity
                </span>
                <div className='flex gap-2 flex-wrap'>
                    {ALL_SEVERITIES.map((sev) => {
                        const config = SEVERITY_CONFIG[sev];
                        const isactive = severity === sev;
                        return (
                            <button
                                key={sev}
                                onClick={() => setSeverity(sev)}
                                className={`px-4 py-1.5 rounded-full text-sm border transition-colors
                                ${
                                    isactive
                                        ? `${config.badgeBg} ${config.badgeText} border-transparent font-medium`
                                        : `bg-white text-gray-500 border-gray-200 hover:border-gray-300`
                                }
                                `}
                            >
                                {config.label}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className='border-t border-gray-100 pt-5 flex flex-col gap-3'>
                <span className='form-label'>Publish to</span>
                <label className='flex items-center gap-2 text-sm text-gray-700 cursor-pointer'>
                    <input
                        type="checkbox"
                        checked={toFeed}
                        onChange={(e) => setToFeed(e.target.checked)}
                        className='accent-gray-800'
                    />
                    Internal feed
                </label>
                <label className='flex items-center gap-2 text-sm text-gray-700 cursor-pointer'>
                    <input
                        type="checkbox"
                        checked={toTeams}
                        onChange={(e) => setToTeams(e.target.checked)}
                        className='accent-gray-800'
                    />
                    Microsoft Teams
                </label>
                {toTeams && (
                    <div className='bg-gray-50 rounded-xl p-4 border border-gray-100'>
                        <Teamchannelpicker
                            teamId={teamId}
                            channelId={channelId}
                            onChange={({ teamId: tid, channelId: cid }) => {
                                setTeamId(tid);
                                setChannelId(cid);
                            }}
                        />
                    </div>
                )}
            </div>
            {error && (
                <p className='text-sm text-red-600'>{error}</p>
            )}
            <div className='flex justify-end'>
                <button
                    onClick={handlepublish}
                    className='btn btn-primary'
                >
                    Publish
                </button>
            </div>
        </div>
    );
}
