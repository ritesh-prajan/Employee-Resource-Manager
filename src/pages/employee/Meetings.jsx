import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import Schedulemeeting from '../../components/Meetings/Schedulemeeting';
import DataTable from '../../components/ui/DataTable';
import { Video, Trash2, Search } from 'lucide-react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
const tabs = ["Personal Meetings", "Meetings for Everyone"];

export default function Meetings() { 
  const { currentUser } = useApp();
  // TODO: replace with API call
  const [live, setLive] = useState([]);
  const [pendingcancelmeeting,setpendingcancelmeeting]=useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [activetab, setactivetab] = useState("Personal Meetings");
  const [searchQuery, setSearchQuery] = useState("");

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
        joinUrl: "https://teams.microsoft.com/l/meetup-join/mock-1on1"
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
        joinUrl: "https://teams.microsoft.com/l/meetup-join/mock-review"
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
        joinUrl: "https://teams.microsoft.com/l/meetup-join/mock-retro"
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
    return activetab === "Personal Meetings" ? personalMeetings : everyoneMeetings;
  }, [activetab, personalMeetings, everyoneMeetings]);

  const getTabLabel = (tab) => {
    if (tab === "Personal Meetings") {
      return `Personal Meetings (${personalMeetings.length})`;
    } else {
      return `Meetings for Everyone (${everyoneMeetings.length})`;
    }
  };

  const columns = [
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
        const initials = (() => {
          const parts = name.trim().split(/\s+/);
          return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
        })();
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="user-initials-badge" style={{ width: 26, height: 26, fontSize: '0.62rem', flexShrink: 0 }}>{initials}</div>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--canvas)', zoom: 'var(--page-zoom, 0.9)' }}>
      
      {/* Search and Schedule Header Div */}
      <div style={{ borderRadius: '1rem', border: '1px solid var(--border)', backgroundColor: 'var(--card)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            
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

            {/* Tabs */}
            <div style={{ display: 'inline-flex', backgroundColor: 'var(--secondary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              {tabs.map((tab) => {
                const isActive = activetab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setactivetab(tab)}
                    style={{
                      padding: '0.4rem 0.95rem', fontSize: '0.72rem', fontWeight: 600,
                      borderRadius: '6px', border: 'none', cursor: 'pointer',
                      backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                      color: isActive ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {getTabLabel(tab)}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Schedule Meeting Button Component */}
          <div>
            <Schedulemeeting onSchedule={handleSchedule} />
          </div>
        </div>
      </div>

      {/* DataTable */}
      <div style={{ borderRadius: '1rem', border: '1px solid var(--border)', backgroundColor: 'var(--card)', padding: '0px', overflow: 'hidden' }}>
        <DataTable Data={activeMeetingsList} columns={columns} onRowClick={handleRowClick} />
      </div>
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

    </div>
  );
}