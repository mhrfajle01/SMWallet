import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import StatusModal from './StatusModal';

const QuickDepositModal = ({ show, onHide, wallet }) => {
  const { addIncome } = useApp();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState({ show: false, message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return;

    await addIncome({
      walletId: wallet.id,
      amount,
      source: 'Quick Deposit',
      date: new Date().toISOString().split('T')[0],
      walletName: wallet.name
    });

    setAmount('');
    setStatus({ show: true, type: 'success', message: `Added funds to ${wallet.name}!` });
  };

  const handleStatusClose = () => {
    setStatus({ ...status, show: false });
    if (status.type === 'success') onHide();
  };

  if (!wallet) return null;

  return (
    <>
      <Modal show={show} onHide={onHide} centered contentClassName="modal-custom" size="sm">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Quick Deposit</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <p className="text-muted small mb-3">Add funds directly to <strong>{wallet.name}</strong>.</p>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Control 
                type="number" 
                placeholder="Amount (0.00)" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
                className="text-center fw-bold fs-4"
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100 btn-primary-custom">
              Add Money
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <StatusModal 
        show={status.show} 
        onHide={handleStatusClose}
        type={status.type}
        message={status.message}
      />
    </>
  );
};

export default QuickDepositModal;
