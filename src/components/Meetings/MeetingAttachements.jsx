import React from 'react';
import { useMeetingAttachments } from '../../hooks/useMeetingAttachments';
import { attachmentService } from '../../services/attachmentService';
import { Paperclip, Download, Trash2, UploadCloud } from 'lucide-react';

export function MeetingAttachments({ meetingId, canManage }) {
  const { attachments, isLoading, uploadAttachment, deleteAttachment, isRealId } = useMeetingAttachments(meetingId);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadAttachment.mutate(file);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this file?')) {
      deleteAttachment.mutate(id);
    }
  };

  if (!isRealId) {
    return (
      <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--foreground)', marginBottom: '0.25rem' }}>
          <Paperclip size={14} /> Attachments
        </h4>
        Attachments are only supported for scheduled database meetings.
      </div>
    );
  }

  if (isLoading) return <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Loading attachments...</div>;

  return (
    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Paperclip size={14} /> Attachments ({attachments.length})
      </h4>
      
      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
        {attachments.map(att => (
          <div key={att.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'var(--secondary)', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--foreground)' }}>{att.fileName}</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <a 
                href={attachmentService.downloadUrl(att.id)}
                download
                title="Download"
                style={{ padding: '4px', display: 'flex', color: 'var(--primary)' }}
              >
                <Download size={14} />
              </a>
              {canManage && (
                <button 
                  onClick={() => handleDelete(att.id)}
                  title="Delete"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', padding: '4px' }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Upload button */}
      {canManage && (
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '0.75rem', padding: '0.5rem', border: '1px dashed var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
          <UploadCloud size={16} />
          {uploadAttachment.isPending ? 'Uploading...' : 'Upload File'}
          <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploadAttachment.isPending} />
        </label>
      )}
    </div>
  );
}