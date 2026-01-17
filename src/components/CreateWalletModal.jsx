import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useApp } from '../context/AppContext';

const CreateWalletModal = ({ show, onHide }) => {
  const { addWallet } = useApp();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !balance) return;
    
    await addWallet(name, balance);
    setName('');
    setBalance('');
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
            <Form.Label>Wallet Name</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="e.g. Meals, Travel, Personal" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Initial Balance</Form.Label>
            <Form.Control 
              type="number" 
              placeholder="0.00" 
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
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
