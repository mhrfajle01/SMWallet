import React, { useEffect } from 'react';
import { Modal, Button, Card } from 'react-bootstrap';
import { FaCheckCircle, FaTimesCircle, FaWallet } from 'react-icons/fa';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { playSound } from '../utils/soundEffects';

const StatusModal = ({ show, onHide, type = "success", title, message, impactData }) => {
  const isSuccess = type === "success";

  useEffect(() => {
    if (show) {
      playSound(isSuccess ? 'success' : 'error');
      
      if (isSuccess && impactData?.isGoal) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#fbbf24']
        });
      }
    }
  }, [show, isSuccess, impactData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
    }).format(amount);
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered 
      size={impactData ? "md" : "sm"}
      contentClassName="border-0 shadow-lg rounded-4 text-center"
    >
      <Modal.Body className="p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-${isSuccess ? 'success' : 'danger'} mb-3`}
        >
          {isSuccess ? <FaCheckCircle size={60} /> : <FaTimesCircle size={60} />}
        </motion.div>
        
        <h4 className="fw-bold mb-2">{title || (isSuccess ? "Awesome!" : "Error")}</h4>
        <p className="text-muted mb-4">{message}</p>

        {isSuccess && impactData && (
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-light border-0 rounded-4 mb-4 overflow-hidden">
              <Card.Body className="p-3">
                <div className="d-flex align-items-center justify-content-center mb-2 text-primary">
                  <FaWallet className="me-2" />
                  <span className="small fw-bold text-uppercase tracking-wider">Wallet Update</span>
                </div>
                <div className="d-flex justify-content-between align-items-center px-2">
                  <div className="text-start">
                    <div className="small text-muted">{impactData.walletName}</div>
                    <div className={`fw-bold ${impactData.isIncome ? 'text-success' : 'text-danger'}`}>
                      {impactData.isIncome ? '+' : '-'}{formatCurrency(impactData.amount)}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="small text-muted">New Balance</div>
                    <div className="fw-bold text-success">{formatCurrency(impactData.newBalance)}</div>
                  </div>
                </div>
                {impactData.isGoal && (
                   <div className="mt-3 pt-2 border-top border-white">
                      <div className="small fw-bold text-success uppercase">Goal Progress Boosted! 🚀</div>
                   </div>
                )}
              </Card.Body>
            </Card>
          </motion.div>
        )}
        
        <Button 
          variant={isSuccess ? "primary" : "danger"} 
          className="rounded-pill px-5 py-2 fw-bold shadow-sm btn-primary-custom" 
          onClick={onHide}
        >
          {isSuccess ? "Got it!" : "Try Again"}
        </Button>
      </Modal.Body>
    </Modal>
  );
};

export default StatusModal;