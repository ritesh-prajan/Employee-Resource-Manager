import React from 'react';
import Modal from './Modal';

export default function ConfirmDialog({isOpen,onClose,onConfirm,title,message}){
    return (
  <Modal isOpen={isOpen} onClose={onClose} maxWidth="400px">
    <div className="modal-header">
      <h3 className="modal-title">{title}</h3>
    </div>
    <p style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
      {message}
    </p>
    <div className="modal-footer">
      <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
      <button className="btn btn-danger" onClick={onConfirm}>Confirm</button>
    </div>
  </Modal>
);
}