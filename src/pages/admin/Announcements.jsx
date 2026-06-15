// pages/admin/Announcements.jsx
import { useState } from "react";
import { MOCK_ANNOUNCEMENTS } from "../../components/mock_dataset/Data_admin_alert";
import Feedpage from "../../components/Announcements/Feedpage";

const tabs = ["Feed", "New announcement"];

export default function Announcements() {
    const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
    const [activeTab, setActiveTab] = useState("Feed");

    function handlePublish(newAnnouncement) {
        setAnnouncements((prev) => [newAnnouncement, ...prev]);
        setActiveTab("Feed");
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-gray-900">Announcements</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {announcements.length} announcement{announcements.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <div className="flex border-b border-gray-200 mb-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2.5 text-sm border-b-2 transition-colors
                            ${
                                activeTab === tab
                                    ? "border-gray-900 text-gray-900 font-medium"
                                    : "border-transparent text-gray-400 hover:text-gray-600"
                            }
                            `}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                {activeTab === "Feed" ? (
                    <Feedpage announcement={announcements} />
                ) : (
                    <div>TEST 2</div>
                )}
            </div>
        </div>
    );
}