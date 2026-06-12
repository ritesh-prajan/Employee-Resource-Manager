import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ETAExtensionModal({ show, onClose, onSubmit, etaDate, setEtaDate, etaReason, setEtaReason }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!etaDate || !etaReason) return;
    onSubmit();
  };

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
              <h3 className="modal-title">Request ETA Extension</h3>
              <button className="modal-close" onClick={onClose}>×</button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Submit an extension request to your Lead. Requires an audit-compliant justification.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">New Proposed ETA Date</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={etaDate}
                  onChange={(e) => setEtaDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Justification / Obstacles</label>
                <textarea
                  className="form-input"
                  placeholder="Describe specific roadblocks (e.g. credentials delay, external library bugs)..."
                  value={etaReason}
                  onChange={(e) => setEtaReason(e.target.value)}
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