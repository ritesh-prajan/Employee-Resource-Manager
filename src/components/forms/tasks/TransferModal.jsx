import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TransferModal({ show, onClose, onSubmit, users, currentUser, transferTarget, setTransferTarget, transferReason, setTransferReason }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!transferTarget || !transferReason) return;
    onSubmit(e);
  };

  const availableUsers = users.filter(u => u.id !== currentUser?.id && u.status === 'Active');

  return (
    <AnimatePresence>
      {show && (
        <div className="modal-overlay">
          <motion.div
            className="modal-content liquid-glass-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ maxWidth: '850px' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Request Task Transfer</h3>
              <button className="modal-close" onClick={onClose}>×</button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Request to transfer this task to another team member. Your lead will review and approve.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Transfer To</label>
                <select
                  className="form-input"
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                  required
                >
                  <option value="">Select team member...</option>
                  {availableUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} — {u.designation}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Transfer</label>
                <textarea
                  className="form-input"
                  placeholder="Explain why this task should be transferred (e.g. skill mismatch, bandwidth issue)..."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}