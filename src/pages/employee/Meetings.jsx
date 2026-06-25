import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import Schedulemeeting from '../../components/Meetings/Schedulemeeting';
import DataTable from '../../components/ui/DataTable';
import { Video, Trash2, Search, Plus, ExternalLink, FileText, Edit2, X, Save } from 'lucide-react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useLinks, useCreateLink, useUpdateLink, useDeleteLink } from '../../hooks/useLinks';

const MAIN_TABS = ["Link Room", "Knowledge"];

export default function Meetings() { 
  const { currentUser, users = [] } = useApp();
  const toast = useToast();

  // ── Main tab state ──
  const [mainTab, setMainTab] = useState("Link Room");

  // ── Link Room (meetings) state ──
  // TODO: replace with API call
  const [live, setLive] = useState([]);
  const [pendingcancelmeeting,setpendingcancelmeeting]=useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [meetingSubTab, setMeetingSubTab] = useState("Personal Meetings");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Knowledge tab state ──
  const [knowledgeSearch, setKnowledgeSearch] = useState("");
  const [knowledgePage, setKnowledgePage] = useState(0);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [pendingDeleteLink, setPendingDeleteLink] = useState(null);

  // ── Knowledge API hooks ──
  const linksQuery = useLinks({
    filename: knowledgeSearch || undefined,
    page: knowledgePage,
    size: 10,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  const createLinkMutation = useCreateLink();
  const updateLinkMutation = useUpdateLink();
  const deleteLinkMutation = useDeleteLink();

  // ── Link Room handlers ──
  const deleteMeeting = (id) => {
    setLive(prev => prev.filter(m => m.id !== id));
    setUpcoming(prev => prev.filter(m => m.id !== id));
    setCompleted(prev => prev.filter(m => m.id !== id));
  };

  const handleSchedule = (newMeet) => {
    setUpcoming(prev => [newMeet, ...prev]);
  };

  const handleRowClick = (meeting) => {
    if (meeting.joinUrl && meeting.joinUrl !== '#') {
      window.open(meeting.joinUrl, '_blank');
    }
  };

  const initials = useMemo(() => {
    if (!currentUser?.name) return '';
    const parts = currentUser.name.trim().split(/\s+/);
    return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
  }, [currentUser]);

  const personalMockMeetings = useMemo(() => {
    if (!currentUser) return [];
    const name = currentUser.name || "User";
    const userInitials = initials || "U";
    return [
      {
        id: "personal-live-1",
        duration: 30,
        host: name,
        title: "1-on-1 Performance & Goal Alignment Sync",
        description: "Reviewing active tasks, roadmap scoping, and professional development milestones.",
        project: { label: "General", color: "blue" },
        linkedTask: "TASK-1001",
        attendees: [userInitials, "AR", "PN"],
        scheduledAt: new Date(Date.now() - 5 * 60000).toISOString(),
        joinUrl: "#"
      },
      {
        id: "personal-upcoming-1",
        duration: 45,
        host: "Priya Nair",
        title: "Weekly Code Quality & Lint Review",
        description: "Aligning on styling standards, ESList setups, and custom DataTable wrappers.",
        project: { label: "Engineering", color: "purple" },
        linkedTask: "TASK-1002",
        attendees: ["PN", userInitials],
        scheduledAt: new Date(Date.now() + 2 * 3600000).toISOString(),
        joinUrl: "#"
      },
      {
        id: "personal-history-1",
        duration: 60,
        host: name,
        title: "Architecture Refactoring Retrospective",
        description: "De-briefing the transition to TanStack Query and cleaning local state providers.",
        project: { label: "Infrastructure", color: "green" },
        linkedTask: "TASK-1003",
        attendees: [userInitials, "VM", "SW"],
        scheduledAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        joinUrl: "#"
      }
    ];
  }, [currentUser, initials]);

  const allMeetings = useMemo(() => {
    const combined = [...live, ...upcoming, ...completed, ...personalMockMeetings];
    return combined.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
  }, [live, upcoming, completed, personalMockMeetings]);

  const personalMeetings = useMemo(() => {
    return allMeetings.filter(m => 
      m.host === currentUser?.name || 
      (m.attendees && m.attendees.includes(initials))
    );
  }, [allMeetings, currentUser, initials]);

  const everyoneMeetings = useMemo(() => {
    return allMeetings;
  }, [allMeetings]);

  const activeMeetingsList = useMemo(() => {
    return meetingSubTab === "Personal Meetings" ? personalMeetings : everyoneMeetings;
  }, [meetingSubTab, personalMeetings, everyoneMeetings]);

  const getMeetingTabLabel = (tab) => {
    if (tab === "Personal Meetings") {
      return `Personal Meetings (${personalMeetings.length})`;
    } else {
      return `Meetings for Everyone (${everyoneMeetings.length})`;
    }
  };

  // ── Meeting columns ──
  const meetingColumns = [
    {
      accessorKey: 'title',
      header: 'MEETING TOPIC',
      cell: ({ row }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.original.title}</span>
          {row.original.description && (
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{row.original.description}</span>
          )}
        </div>
      ),
    },
    {
      id: 'host',
      header: 'HOST',
      cell: ({ row }) => {
        const name = row.original.host || 'Host';
        const hostInitials = (() => {
          const parts = name.trim().split(/\s+/);
          return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
        })();
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="user-initials-badge" style={{ width: 26, height: 26, fontSize: '0.62rem', flexShrink: 0 }}>{hostInitials}</div>
            <span style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>{name}</span>
          </div>
        );
      },
    },
    {
      id: 'scheduledAt',
      header: 'SCHEDULED TIME',
      cell: ({ row }) => {
        if (!row.original.scheduledAt) return <span style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>—</span>;
        const start = new Date(row.original.scheduledAt);
        const formatTime = (date) => {
          let hours = date.getHours();
          const minutes = date.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12;
          hours = hours ? hours : 12;
          const minStr = minutes < 10 ? '0' + minutes : minutes;
          return `${hours < 10 ? '0' : ''}${hours}:${minStr < 10 ? '0' : ''}${minStr} ${ampm}`;
        };
        const monthStr = start.toLocaleDateString("en-US", { month: 'short' });
        const dayStr = start.getDate();
        return (
          <span style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
            {formatTime(start)} ({monthStr} {dayStr})
          </span>
        );
      },
    },
    {
      id: 'duration',
      header: 'DURATION',
      cell: ({ row }) => {
        const d = row.original.duration;
        return (
          <span style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
            {d ? `${d} mins` : '—'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setpendingcancelmeeting(row.original);
            }}
            className="text-red-500 hover:text-red-700 transition"
            title="Cancel/Delete Meeting"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <Trash2 size={16} />
          </button>
        );
      },
    },
  ];

  // ── Knowledge helpers ──
  const getUserName = (userId) => {
    const u = users.find(u => String(u.id) === String(userId));
    return u?.name || `User #${userId}`;
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
  };

  // Extract links from Spring Page response
  const linksData = linksQuery.data?.content || linksQuery.data || [];
  const totalPages = linksQuery.data?.totalPages || 1;
  const totalElements = linksQuery.data?.totalElements ?? linksData.length;

  const handleKnowledgeRowClick = (link) => {
    if (link.filelink) {
      window.open(link.filelink, '_blank');
    }
  };

  const handleCreateLink = async (data) => {
    try {
      await createLinkMutation.mutateAsync(data);
      toast.success('Link added successfully');
      setShowAddLinkModal(false);
    } catch (err) {
      toast.error('Failed to add link: ' + (err.message || 'Unknown error'));
    }
  };

  const handleUpdateLink = async (id, data) => {
    try {
      await updateLinkMutation.mutateAsync({ id, data });
      toast.success('Link updated successfully');
      setEditingLink(null);
    } catch (err) {
      toast.error('Failed to update link: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteLink = async () => {
    if (!pendingDeleteLink) return;
    try {
      await deleteLinkMutation.mutateAsync(pendingDeleteLink.id);
      toast.success('Link deleted successfully');
    } catch (err) {
      toast.error('Failed to delete link: ' + (err.message || 'Unknown error'));
    }
    setPendingDeleteLink(null);
  };

  // ── Knowledge columns ──
  const knowledgeColumns = [
    {
      accessorKey: 'filename',
      header: 'FILE NAME',
      cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            background: 'color-mix(in oklch, var(--primary) 10%, transparent)',
            border: '1px solid color-mix(in oklch, var(--primary) 20%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <FileText size={15} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>
              {row.original.filename}
            </span>
            {row.original.filelink && (
              <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                {row.original.filelink}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'createdBy',
      header: 'ADDED BY',
      cell: ({ row }) => {
        const creatorId = row.original.createdBy?.id || row.original.createdBy;
        const creatorName = row.original.createdBy?.name || getUserName(creatorId);
        const creatorInitials = getUserInitials(creatorName);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="user-initials-badge" style={{ width: 26, height: 26, fontSize: '0.62rem', flexShrink: 0 }}>{creatorInitials}</div>
            <span style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>{creatorName}</span>
          </div>
        );
      },
    },
    {
      id: 'createdAt',
      header: 'ADDED ON',
      cell: ({ row }) => {
        const dateStr = row.original.createdAt;
        if (!dateStr) return <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>—</span>;
        const d = new Date(dateStr);
        return (
          <span style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
            {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const link = row.original;
        const isOwner = String(link.createdBy?.id || link.createdBy) === String(currentUser?.id);
        const isAdmin = currentUser?.role === 'Admin';
        const isLead = currentUser?.role === 'Team Lead' || currentUser?.role === 'Sub Lead';
        const canModify = isOwner || isAdmin || isLead;

        return (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={(e) => { e.stopPropagation(); window.open(link.filelink, '_blank'); }}
              title="Open link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--primary)' }}
            >
              <ExternalLink size={15} />
            </button>
            {canModify && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingLink(link); }}
                  title="Edit link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--muted-foreground)' }}
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setPendingDeleteLink(link); }}
                  title="Delete link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#ef4444' }}
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--canvas)', zoom: 'var(--page-zoom, 0.9)' }}>
      
      {/* ── Main Tabs: Link Room | Knowledge ── */}
      <div style={{ borderRadius: '1rem', border: '1px solid var(--border)', backgroundColor: 'var(--card)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            
            {/* Main Tab Switcher */}
            <div style={{ display: 'inline-flex', backgroundColor: 'var(--secondary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              {MAIN_TABS.map((tab) => {
                const isActive = mainTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setMainTab(tab)}
                    style={{
                      padding: '0.45rem 1.1rem', fontSize: '0.78rem', fontWeight: 650,
                      borderRadius: '6px', border: 'none', cursor: 'pointer',
                      backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                      color: isActive ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Sub-controls change based on active main tab */}
            {mainTab === "Link Room" && (
              <>
                {/* Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.5rem 0.85rem', width: '280px' }}>
                  <Search size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Search meetings..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', color: 'var(--foreground)' }}
                  />
                </div>

                {/* Meeting sub-tabs */}
                <div style={{ display: 'inline-flex', backgroundColor: 'var(--secondary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  {["Personal Meetings", "Meetings for Everyone"].map((tab) => {
                    const isActive = meetingSubTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setMeetingSubTab(tab)}
                        style={{
                          padding: '0.4rem 0.95rem', fontSize: '0.72rem', fontWeight: 600,
                          borderRadius: '6px', border: 'none', cursor: 'pointer',
                          backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                          color: isActive ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {getMeetingTabLabel(tab)}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {mainTab === "Knowledge" && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.5rem 0.85rem', width: '280px' }}>
                <Search size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search links..."
                  value={knowledgeSearch}
                  onChange={e => { setKnowledgeSearch(e.target.value); setKnowledgePage(0); }}
                  style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', color: 'var(--foreground)' }}
                />
              </div>
            )}
          </div>

          {/* Right-side actions */}
          <div>
            {mainTab === "Link Room" && (
              <Schedulemeeting onSchedule={handleSchedule} />
            )}
            {mainTab === "Knowledge" && (
              <button
                onClick={() => setShowAddLinkModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1rem', borderRadius: '9px', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 650,
                  background: 'var(--primary)', color: 'var(--primary-foreground)',
                  border: 'none', transition: 'opacity 0.15s',
                }}
              >
                <Plus size={15} /> Add Link
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      {mainTab === "Link Room" && (
        <div style={{ borderRadius: '1rem', border: '1px solid var(--border)', backgroundColor: 'var(--card)', padding: '0px', overflow: 'hidden' }}>
          <DataTable Data={activeMeetingsList} columns={meetingColumns} onRowClick={handleRowClick} />
        </div>
      )}

      {mainTab === "Knowledge" && (
        <div style={{ borderRadius: '1rem', border: '1px solid var(--border)', backgroundColor: 'var(--card)', padding: '0px', overflow: 'hidden' }}>
          {linksQuery.isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>
              Loading links...
            </div>
          ) : linksQuery.isError ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444', fontSize: '0.85rem' }}>
              Failed to load links: {linksQuery.error?.message || 'Unknown error'}
            </div>
          ) : linksData.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '14px', margin: '0 auto 1rem',
                background: 'color-mix(in oklch, var(--primary) 8%, transparent)',
                border: '1px solid color-mix(in oklch, var(--primary) 15%, transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileText size={24} style={{ color: 'var(--primary)', opacity: 0.6 }} />
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)' }}>
                No links found
              </p>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                {knowledgeSearch ? 'Try a different search term' : 'Click "Add Link" to share a resource'}
              </p>
            </div>
          ) : (
            <>
              <DataTable Data={linksData} columns={knowledgeColumns} onRowClick={handleKnowledgeRowClick} />
              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '0.5rem', padding: '0.75rem 1rem',
                  borderTop: '1px solid var(--border)',
                }}>
                  <button
                    onClick={() => setKnowledgePage(p => Math.max(0, p - 1))}
                    disabled={knowledgePage === 0}
                    style={{
                      padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
                      border: '1px solid var(--border)', cursor: knowledgePage === 0 ? 'default' : 'pointer',
                      background: 'var(--secondary)', color: 'var(--foreground)',
                      opacity: knowledgePage === 0 ? 0.4 : 1,
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>
                    Page {knowledgePage + 1} of {totalPages} · {totalElements} links
                  </span>
                  <button
                    onClick={() => setKnowledgePage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={knowledgePage >= totalPages - 1}
                    style={{
                      padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
                      border: '1px solid var(--border)', cursor: knowledgePage >= totalPages - 1 ? 'default' : 'pointer',
                      background: 'var(--secondary)', color: 'var(--foreground)',
                      opacity: knowledgePage >= totalPages - 1 ? 0.4 : 1,
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Meeting Cancel Confirm ── */}
      <ConfirmDialog
        isOpen={!!pendingcancelmeeting}
        onClose={()=>setpendingcancelmeeting(null)}
        onConfirm={()=>{
          if(pendingcancelmeeting){
            deleteMeeting(pendingcancelmeeting.id)
          }
          setpendingcancelmeeting(null);
        }}
        title="Cancel Meeting"
        message={`Are you sure you want to cancel/delete meeting "${pendingcancelmeeting?.title || ''}"?`}
      />

      {/* ── Delete Link Confirm ── */}
      <ConfirmDialog
        isOpen={!!pendingDeleteLink}
        onClose={() => setPendingDeleteLink(null)}
        onConfirm={handleDeleteLink}
        title="Delete Link"
        message={`Are you sure you want to delete "${pendingDeleteLink?.filename || ''}"? This action cannot be undone.`}
      />

      {/* ── Add Link Modal ── */}
      {showAddLinkModal && (
        <LinkFormModal
          onClose={() => setShowAddLinkModal(false)}
          onSubmit={handleCreateLink}
          isSubmitting={createLinkMutation.isPending}
        />
      )}

      {/* ── Edit Link Modal ── */}
      {editingLink && (
        <LinkFormModal
          link={editingLink}
          onClose={() => setEditingLink(null)}
          onSubmit={(data) => handleUpdateLink(editingLink.id, data)}
          isSubmitting={updateLinkMutation.isPending}
        />
      )}
    </div>
  );
}


// ─── Link Form Modal (Add / Edit) ─────────────────────────────────────────
function LinkFormModal({ link, onClose, onSubmit, isSubmitting }) {
  const [filename, setFilename] = useState(link?.filename || '');
  const [filelink, setFilelink] = useState(link?.filelink || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!filename.trim() || !filelink.trim()) return;
    onSubmit({ filename: filename.trim(), filelink: filelink.trim() });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        backgroundColor: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.18s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 24px 60px -8px rgba(0,0,0,0.22), 0 8px 20px -4px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          animation: 'scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, var(--primary), color-mix(in oklch, var(--primary) 60%, #8b5cf6))', width: '100%' }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem 1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'color-mix(in oklch, var(--primary) 12%, transparent)',
              border: '1px solid color-mix(in oklch, var(--primary) 25%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 750, color: 'var(--foreground)' }}>
              {link ? 'Edit Link' : 'Add Link'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--secondary)', border: '1px solid var(--border)',
              borderRadius: '8px', cursor: 'pointer', padding: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted-foreground)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              File Name *
            </label>
            <input
              type="text"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              placeholder="e.g. project_design.pdf"
              required
              className="input-control"
              style={{ fontSize: '0.85rem', padding: '0.55rem 0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              File Link (URL) *
            </label>
            <input
              type="url"
              value={filelink}
              onChange={e => setFilelink(e.target.value)}
              placeholder="https://..."
              required
              className="input-control"
              style={{ fontSize: '0.85rem', padding: '0.55rem 0.85rem' }}
            />
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1.15rem', borderRadius: '10px',
                border: '1px solid var(--border)', background: 'var(--secondary)',
                color: 'var(--foreground)', fontSize: '0.85rem', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !filename.trim() || !filelink.trim()}
              style={{
                padding: '0.55rem 1.35rem', borderRadius: '10px',
                border: 'none', background: 'var(--primary)',
                color: 'var(--primary-foreground)', fontSize: '0.85rem', fontWeight: 700,
                cursor: (isSubmitting || !filename.trim() || !filelink.trim()) ? 'default' : 'pointer',
                opacity: (isSubmitting || !filename.trim() || !filelink.trim()) ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}
            >
              <Save size={14} />
              {isSubmitting ? 'Saving...' : link ? 'Update' : 'Add Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}