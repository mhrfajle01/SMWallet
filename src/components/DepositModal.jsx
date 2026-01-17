import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import StatusModal from './StatusModal';
import { playSound } from '../utils/soundEffects';

const DepositModal = ({ show, onHide, goal }) => {
  const { wallets, depositToGoal } = useApp();
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [status, setStatus] = useState({ show: false, message: '' });
  const [impactData, setImpactData] = useState(null);

  useEffect(() => {
    if (show) playSound('pop');
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !walletId) return;
    
    const selectedWallet = wallets.find(w => w.id === walletId);
    const amountNum = Number(amount);

    setImpactData({
      walletName: selectedWallet?.name || 'Wallet',
      amount: amountNum,
      newBalance: (selectedWallet?.remaining || 0) - amountNum,
      isGoal: true
    });

    await depositToGoal(goal.id, walletId, amount);
    setAmount('');
    setWalletId('');
    setStatus({ show: true, type: 'success', message: `Successfully saved for ${goal.name}!` });
  };

  const handleStatusClose = () => {
    setStatus({ ...status, show: false });
    onHide(); // Close the deposit modal too after success
  };

  if (!goal) return null;

  return (
    <>
      <Modal show={show} onHide={onHide} centered contentClassName="modal-custom">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Deposit to {goal.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <p className="text-muted small mb-4">Move money from a wallet to your savings goal.</p>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Source Wallet</Form.Label>
              <Form.Select 
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                required
              >
                <option value="">Select Wallet...</option>
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.name} (Avail: {w.remaining})</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Amount to Save</Form.Label>
              <Form.Control 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={onHide}>
                Cancel
              </Button>
              <Button variant="success" type="submit" className="text-white">
                Confirm Deposit
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <StatusModal 
        show={status.show} 
        onHide={handleStatusClose}
        type={status.type}
        message={status.message}
        impactData={impactData}
      />
    </>
  );
};

export default DepositModal;
