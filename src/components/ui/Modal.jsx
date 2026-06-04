import react from 'react';
export default function Modal({isOpen, onClose, children , maxWidth='500px'}){
    if (!isOpen) return null;
    return(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth}}>
                {children}
            </div>
        </div>
    )
}