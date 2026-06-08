import React, { useState } from 'react';
import Modal from "../../../../components/ui/Modal";
import UserAvatar from "../../../../components/ui/UserAvatar";
import { useApp } from "../../../../context/AppContext";

export default function ProjectDetailModal({ show, onClose, project }) {
  const { users, teams, tasks, projects } = useApp();

  const [selectedTeamInPopup, setSelectedTeamInPopup] = useState(null);
  const [tasksCollapsed, setTasksCollapsed] = useState(false);
  const [membersCollapsed, setMembersCollapsed] = useState(true);
  const [projectPopupTaskTab, setProjectPopupTaskTab] = useState('Open');
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);

  if (!show || !project) return null;

  const proj = project;
  const members = users.filter(u => (proj.members || []).includes(u.id));
  const projTasks = tasks.filter(t => t.projectId === proj.id);
  const projTeams = teams.filter(t => (proj.teams || []).includes(t.id));
  const activeBugsCount = projTasks.filter(t =>
    (t.type === 'Bug' || t.type === 'BUG' || t.bugNumber) && t.status !== 'Completed'
  ).length;

  const getUserInfo = (userId) => users.find(u => u.id === userId);

  return (
    <>
      <Modal isOpen={show} onClose={onClose} maxWidth="560px">
        <div className="modal-header" style={{ borderBottom: `3px solid ${proj.color}` }}>
          <div>
            <h3 className="modal-title">{proj.name}</h3>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {proj.client && <>{proj.client}&nbsp;•&nbsp;</>}
              <span style={{ color: proj.color, fontWeight: 700 }}>{proj.status || 'Active'}</span>
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '1.25rem' }}>

          {/* Active Bugs */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Bugs</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: activeBugsCount > 0 ? '#ff4d4f' : '#10b981' }}>{activeBugsCount}</span>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {[
              { label: 'Members', value: members.length },
              { label: 'Tasks', value: projTasks.length },
              { label: 'Done', value: projTasks.filter(t => t.status === 'Completed').length },
            ].map(({ label, value }) => (
              <div key={label} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: proj.color }}>{value}</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Teams */}
          <div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Assigned Teams</span>
            {projTeams.length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>No teams assigned</span>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {projTeams.map(t => {
                  const isActive = selectedTeamInPopup?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTeamInPopup(isActive ? null : t)}
                      style={{
                        fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '8px',
                        border: `1px solid ${isActive ? proj.color : '#e2e8f0'}`,
                        backgroundColor: isActive ? `${proj.color}22` : 'transparent',
                        color: isActive ? proj.color : '#64748b',
                        fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Team drill-down */}
          {selectedTeamInPopup && (() => {
            const lead = getUserInfo(selectedTeamInPopup.leadId);
            const teamMembers = users.filter(u => selectedTeamInPopup.members.includes(u.id));
            return (
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>
                  {selectedTeamInPopup.name} — Members
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {lead && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.6rem', borderRadius: '8px', backgroundColor: `${proj.color}18`, border: `1px solid ${proj.color}44` }}>
                      <UserAvatar name={lead.name} size={28} />
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{lead.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{lead.role}</div>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: `${proj.color}33`, color: proj.color, fontWeight: 700 }}>LEAD</span>
                    </div>
                  )}
                  {teamMembers.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <UserAvatar name={m.name} size={28} />
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{m.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Members collapsible */}
          <div>
            <button
              onClick={() => setMembersCollapsed(!membersCollapsed)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', color: '#1e293b', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', padding: '0.5rem 0' }}
            >
              <span>Project Members ({members.length})</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{membersCollapsed ? '▶ Show' : '▼ Hide'}</span>
            </button>
            {!membersCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                {members.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <UserAvatar name={m.name} size={28} />
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{m.name}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{m.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks collapsible */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <button
              onClick={() => setTasksCollapsed(!tasksCollapsed)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', color: '#1e293b', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', padding: '0.5rem 0' }}
            >
              <span>Project Tasks ({projTasks.length})</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{tasksCollapsed ? '▶ Show' : '▼ Hide'}</span>
            </button>

            {!tasksCollapsed && (() => {
              const taskTabs = ['Open', 'In Progress', 'Completed', 'Backlog'];
              const filteredTasks = projTasks.filter(t => t.status === projectPopupTaskTab);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
                    {taskTabs.map(tab => (
                      <button
                        key={tab}
                        onClick={() => setProjectPopupTaskTab(tab)}
                        style={{
                          padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer',
                          border: `1px solid ${projectPopupTaskTab === tab ? proj.color : '#e2e8f0'}`,
                          backgroundColor: projectPopupTaskTab === tab ? `${proj.color}15` : 'transparent',
                          color: projectPopupTaskTab === tab ? proj.color : '#64748b',
                        }}
                      >
                        {tab} ({projTasks.filter(t => t.status === tab).length})
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
                    {filteredTasks.length === 0 ? (
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', padding: '1rem 0' }}>No {projectPopupTaskTab.toLowerCase()} tasks.</div>
                    ) : filteredTasks.map(t => {
                      const assignee = getUserInfo(t.assignedTo);
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTaskDetail(t)}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, textDecoration: t.status === 'Completed' ? 'line-through' : 'none', color: t.status === 'Completed' ? '#94a3b8' : '#1e293b' }}>{t.name}</div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{t.taskNumber} • {t.priority}</div>
                          </div>
                          <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#64748b' }}>
                            <div>{assignee ? assignee.name.split(' ')[0] : 'Unassigned'}</div>
                            <div>{t.logged}h / {t.eta}h</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

        </div>
      </Modal>

      {/* TASK DETAIL — nested modal */}
      {selectedTaskDetail && (() => {
        const t = selectedTaskDetail;
        const assignee = users.find(u => u.id === t.assignedTo);
        const proj2 = projects.find(p => p.id === t.projectId);
        const pct = t.eta ? Math.min(100, Math.round((t.logged / t.eta) * 100)) : 0;
        return (
          <Modal isOpen={!!selectedTaskDetail} onClose={() => setSelectedTaskDetail(null)} maxWidth="480px">
            <div className="modal-header" style={{ borderBottom: `3px solid ${proj2?.color || '#e2e8f0'}` }}>
              <div>
                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 700 }}>{t.taskNumber || 'TASK'}</span>
                <h3 className="modal-title" style={{ marginTop: '0.4rem' }}>{t.name}</h3>
              </div>
              <button className="modal-close" onClick={() => setSelectedTaskDetail(null)}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem' }}>
                {[
                  { label: 'Project', value: proj2?.name || 'Unassigned', color: proj2?.color },
                  { label: 'Assigned To', value: assignee?.name || 'Unassigned' },
                  { label: 'Priority', value: t.priority, color: t.priority === 'Critical' ? '#ff4d4f' : t.priority === 'High' ? '#ffa940' : undefined },
                  { label: 'Status', value: t.status },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '2px' }}>{label}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: color || '#1e293b' }}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                  <span style={{ color: '#64748b' }}>Hours Logged / Estimate</span>
                  <span>{t.logged}h / {t.eta}h ({pct}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: proj2?.color || '#0010AE', borderRadius: '4px' }} />
                </div>
              </div>

              {t.etaDate && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  <span style={{ color: '#94a3b8' }}>Target Date</span>
                  <span style={{ fontWeight: 600 }}>{new Date(t.etaDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedTaskDetail(null)} style={{ width: '100%' }}>Close</button>
            </div>
          </Modal>
        );
      })()}
    </>
  );
}