import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useApp } from '../context/AppContext';

const EditGoalModal = ({ show, onHide, goal }) => {
  const { updateGoal } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    savedAmount: ''
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name,
        targetAmount: goal.targetAmount,
        savedAmount: goal.savedAmount
      });
    }
  }, [goal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateGoal(goal.id, formData);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Update Goal</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Goal Name</Form.Label>
            <Form.Control 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Target Amount</Form.Label>
            <Form.Control 
              type="number" 
              value={formData.targetAmount}
              onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
              required
            />
          </Form.Group>
           <Form.Group className="mb-3">
            <Form.Label>Saved Amount</Form.Label>
            <Form.Control 
              type="number" 
              value={formData.savedAmount}
              onChange={(e) => setFormData({...formData, savedAmount: e.target.value})}
              required
            />
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button variant="secondary" className="me-2" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="btn-primary-custom">
              Save Changes
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditGoalModal;
