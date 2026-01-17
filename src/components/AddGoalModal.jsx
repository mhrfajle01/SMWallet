import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useApp } from '../context/AppContext';

const AddGoalModal = ({ show, onHide }) => {
  const { addGoal } = useApp();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('0');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount) return;
    
    await addGoal({
      name,
      targetAmount,
      savedAmount
    });
    setName('');
    setTargetAmount('');
    setSavedAmount('0');
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create Savings Goal</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Goal Name</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="e.g. New Phone, Vacation" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Target Amount</Form.Label>
            <Form.Control 
              type="number" 
              placeholder="0.00" 
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
          </Form.Group>
           <Form.Group className="mb-3">
            <Form.Label>Already Saved (Optional)</Form.Label>
            <Form.Control 
              type="number" 
              placeholder="0.00" 
              value={savedAmount}
              onChange={(e) => setSavedAmount(e.target.value)}
            />
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button variant="secondary" className="me-2" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="btn-primary-custom">
              Add Goal
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddGoalModal;
