import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import StatusModal from './StatusModal';

const TransferModal = ({ show, onHide }) => {
  const { wallets, transferFunds } = useApp();
  const [sourceId, setSourceId] = useState('');
  const [destId, setDestId] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState({ show: false, message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sourceId || !destId || !amount) return;
    if (sourceId === destId) {
      setStatus({ show: true, type: 'error', message: 'Source and Destination cannot be the same.' });
      return;
    }

    await transferFunds(sourceId, destId, amount);
    setSourceId('');
    setDestId('');
    setAmount('');
    setStatus({ show: true, type: 'success', message: 'Transfer successful!' });
  };

  const handleStatusClose = () => {
    setStatus({ ...status, show: false });
    if (status.type === 'success') onHide();
  };

  return (
    <>
      <Modal show={show} onHide={onHide} centered contentClassName="modal-custom">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Transfer Funds</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <p className="text-muted small mb-4">Move money instantly between your wallets.</p>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>From (Source)</Form.Label>
              <Form.Select 
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                required
              >
                <option value="">Select Source Wallet...</option>
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.remaining})</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>To (Destination)</Form.Label>
              <Form.Select 
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                required
              >
                <option value="">Select Destination Wallet...</option>
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.remaining})</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Amount</Form.Label>
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
              <Button variant="primary" type="submit" className="btn-primary-custom">
                Transfer Now
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
      />
    </>
  );
};

export default TransferModal;
