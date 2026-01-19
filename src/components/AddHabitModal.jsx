import React, { useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { usePlanner } from '../context/PlannerContext';

const AddHabitModal = ({ show, onHide }) => {
  const { addHabit } = usePlanner();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return;
    
    addHabit(name, color);
    setName('');
    onHide();
  };

  const colors = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
  ];

  return (
    <Modal show={show} onHide={onHide} centered contentClassName="border-0 shadow-lg rounded-4">
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold">New Habit</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-4">
            <Form.Label>Habit Name</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="e.g. Read 30 mins" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              autoFocus
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Color Tag</Form.Label>
            <div className="d-flex gap-2">
              {colors.map(c => (
                <div 
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    backgroundColor: c, 
                    cursor: 'pointer',
                    border: color === c ? '3px solid #000' : '1px solid #ddd',
                    borderRadius: '50%'
                  }}
                />
              ))}
            </div>
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100 rounded-pill py-2">
            Start Tracking
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddHabitModal;
