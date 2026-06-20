import React from 'react';
import Modal from '../ui/Modal';
import { SEVERITY_CONFIG, timeago, getteambyid, getchannelbyid } from './healpers';

export default function AnnouncementDetailsModal({ isOpen, onClose, announcement }) {
  if (!isOpen || !announcement) return null;

  const config = SEVERITY_CONFIG[announcement.severity];
  const team = getteambyid(announcement.teamId);
  const channel = getchannelbyid(announcement.teamId, announcement.channelId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="600px">
      <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ paddingRight: '1rem' }}>
          {config && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium mb-3 inline-block ${config.badgeBg} ${config.badgeText}`}>
              <i className={`${config.icon} mr-1`}></i>
              {config.label}
            </span>
          )}
          <h3 className="modal-title" style={{ fontSize: '1.25rem', lineHeight: '1.4' }}>{announcement.title}</h3>
        </div>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '1.25rem' }}>
        
        {/* Metadata section */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--secondary)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
          <div style={{ flex: '1 1 45%' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.2rem' }}>
              Target
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
              {team?.name || 'All Company'} {channel ? `> ${channel.name}` : ''}
            </span>
          </div>

          <div style={{ flex: '1 1 45%' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.2rem' }}>
              Created By
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
              {announcement.createdBy}
            </span>
          </div>

          <div style={{ flex: '1 1 45%' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.2rem' }}>
              Posted
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--foreground)' }} title={new Date(announcement.createdAt).toLocaleString()}>
              {timeago(announcement.createdAt)}
            </span>
          </div>
        </div>

        {/* Content section */}
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
            Message Content
          </span>
          <div style={{ fontSize: '0.95rem', color: 'var(--foreground)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {announcement.content}
          </div>
        </div>

      </div>
    </Modal>
  );
}
