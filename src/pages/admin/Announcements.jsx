// pages/admin/Announcements.jsx
import { useState } from "react";
import { MOCK_ANNOUNCEMENTS } from "../../components/mock_dataset/Data_admin_alert";
import Feedpage from "../../components/Announcements/Feedpage";
import CreatePage from "#components/Announcements/CreatePage.jsx";

const tabs = ["Feed", "New announcement"];

export default function Announcements() {
    const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
    const [activeTab, setActiveTab] = useState("Feed");

    function handlePublish(newAnnouncement) {
        setAnnouncements((prev) => [newAnnouncement, ...prev]);
        setActiveTab("Feed");
    }

    return (
        <div className="w-full flex flex-col gap-4" style={{ zoom: 0.8 }}>
            <div className="mx-auto w-full flex flex-col gap-4" style={{ maxWidth: "1000px" }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Announcements</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Review internal company announcements and publish new alerts to your teams
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                                    activeTab === tab
                                        ? "bg-slate-900 text-white shadow-sm font-medium"
                                        : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Render Active View */}
                {activeTab === "Feed" ? (
                    <Feedpage announcement={announcements} />
                ) : (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <CreatePage onPublish={handlePublish} />
                    </div>
                )}
            </div>
        </div>
    );
}