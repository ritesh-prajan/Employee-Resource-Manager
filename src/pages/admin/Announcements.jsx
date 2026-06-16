// pages/admin/Announcements.jsx
import React, { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import DataTable from "../../components/ui/DataTable";
import CreatePage from "../../components/Announcements/CreatePage";
import AnnouncementDetailsModal from "../../components/Announcements/AnnouncementDetailsModal";
import { MOCK_ANNOUNCEMENTS } from "../../components/mock_dataset/Data_admin_alert";
import { SEVERITY_CONFIG, ALL_SEVERITIES, timeago, getteambyid, getchannelbyid } from "../../components/Announcements/healpers";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
  const [activeTab, setActiveTab] = useState("Feed"); // "Feed" or "Create"
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailAnnouncement, setDetailAnnouncement] = useState(null);

  const handlePublish = (newAnnouncement) => {
    setAnnouncements((prev) => [newAnnouncement, ...prev]);
    setActiveTab("Feed");
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(a => {
      if (activeFilter !== "all" && a.severity !== activeFilter) return false;
      if (searchQuery) {
        if (!a.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !a.content.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [announcements, activeFilter, searchQuery]);

  const columns = [
    {
      accessorKey: 'title',
      header: 'TITLE',
      cell: ({ row }) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 700, color: 'var(--primary)', cursor: 'pointer' }}>{row.original.title}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '350px' }}>{row.original.content}</span>
        </div>
      ),
    },
    {
      id: 'severity',
      header: 'SEVERITY',
      cell: ({ row }) => {
        const config = SEVERITY_CONFIG[row.original.severity];
        if (!config) return null;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.badgeBg} ${config.badgeText}`}>
            <i className={`${config.icon} mr-1`}></i>
            {config.label}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdBy',
      header: 'CREATED BY',
      cell: ({ getValue }) => (
        <span style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>{getValue()}</span>
      ),
    },
    {
      id: 'target',
      header: 'TARGET',
      cell: ({ row }) => {
        const team = getteambyid(row.original.teamId);
        const channel = getchannelbyid(row.original.teamId, row.original.channelId);
        return (
          <span style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
             {team?.name || 'All'} {channel ? `> ${channel.name}` : ''}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'CREATED',
      cell: ({ getValue }) => (
        <span style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)' }}>
          {timeago(getValue())}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--canvas)', zoom: '0.9' }}>
      <div style={{ borderRadius: '1rem', border: '1px solid var(--border)', backgroundColor: 'var(--card)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.5rem 0.85rem', width: '280px' }}>
              <Search size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', color: 'var(--foreground)' }}
              />
            </div>
            
            {activeTab === "Feed" && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setActiveFilter("all")}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          activeFilter === "all"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      All
                    </button>
                    {ALL_SEVERITIES.map((sev) => {
                      const config = SEVERITY_CONFIG[sev];
                      return (
                        <button
                          key={sev}
                          onClick={() => setActiveFilter(sev)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              activeFilter === sev
                              ? `${config.badgeBg} ${config.badgeText} border-transparent`
                              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {config.label}
                        </button>
                      );
                    })}
                </div>
            )}
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setActiveTab(activeTab === "Feed" ? "Create" : "Feed")}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '0.75rem', padding: '0.6rem 1.5rem' }}
          >
            {activeTab === "Feed" ? (
                <>
                    <Plus size={16} /> Create Announcement
                </>
            ) : "Back to Feed"}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "Feed" ? (
            <motion.div
              key="announcements-table"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <DataTable
                Data={filteredAnnouncements}
                columns={columns}
                onRowClick={(ann) => setDetailAnnouncement(ann)}
              />
            </motion.div>
        ) : (
            <motion.div
              key="create-announcement"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <CreatePage onPublish={handlePublish} />
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <AnnouncementDetailsModal
        isOpen={!!detailAnnouncement}
        onClose={() => setDetailAnnouncement(null)}
        announcement={detailAnnouncement}
      />
    </div>
  );
}