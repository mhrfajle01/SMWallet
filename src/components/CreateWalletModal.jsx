import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useApp } from '../context/AppContext';

const CreateWalletModal = ({ show, onHide }) => {
  const { addWallet } = useApp();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState('asset');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || (type === 'asset' && !balance)) return;
    
    await addWallet(name, balance || 0, type);
    setName('');
    setBalance('');
    setType('asset');
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create New Wallet</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Wallet Type</Form.Label>
            <Form.Select 
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-3"
            >
              <option value="asset">Normal Wallet (Savings/Cash)</option>
              <option value="liability">Staff ID Card (Postpaid/Debit)</option>
            </Form.Select>
            <Form.Text className="text-muted">
              {type === 'liability' 
                ? "This tracks debt. Expenses will accumulate and you can settle them later."
                : "Standard wallet where you add money before spending."}
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Wallet Name</Form.Label>
            <Form.Control 
              type="text" 
              placeholder={type === 'liability' ? "e.g. Staff ID Card" : "e.g. Personal Cash"} 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>{type === 'liability' ? 'Initial Balance (usually 0)' : 'Initial Balance'}</Form.Label>
            <Form.Control 
              type="number" 
              placeholder="0.00" 
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required={type === 'asset'}
            />
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button variant="secondary" className="me-2" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="btn-primary-custom">
              Create Wallet
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CreateWalletModal;
