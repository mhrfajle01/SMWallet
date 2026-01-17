import React, { useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaExclamationTriangle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../utils/soundEffects';

const ConfirmModal = ({ show, onHide, onConfirm, title, message, confirmText = "Delete", variant = "danger" }) => {
  useEffect(() => {
    if (show) playSound('error'); // Use 'error' sound for warning/confirmation
  }, [show]);

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered 
      contentClassName="border-0 shadow-lg rounded-4"
    >
      <Modal.Body className="p-4 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`bg-${variant} bg-opacity-10 text-${variant} rounded-circle d-inline-flex p-3 mb-3`}
        >
          <FaExclamationTriangle size={30} />
        </motion.div>
        
        <h5 className="fw-bold mb-2">{title || "Are you sure?"}</h5>
        <p className="text-muted mb-4">{message || "This action cannot be undone."}</p>
        
        <div className="d-flex gap-2 justify-content-center">
          <Button 
            variant="light" 
            className="rounded-pill px-4 fw-medium" 
            onClick={onHide}
          >
            Cancel
          </Button>
          <Button 
            variant={variant} 
            className="rounded-pill px-4 fw-medium text-white shadow-sm"
            onClick={() => {
              onConfirm();
              onHide();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ConfirmModal;
