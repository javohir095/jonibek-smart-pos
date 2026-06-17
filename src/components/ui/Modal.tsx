import React, { ReactNode } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

export default function Modal({ title, onClose, children, width = 480 }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Yopish">×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
