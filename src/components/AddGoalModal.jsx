import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { FaShieldAlt } from 'react-icons/fa';

const AddGoalModal = ({ show, onHide }) => {
  const { addGoal } = useApp();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('0');
  const [isEmergency, setIsEmergency] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount) return;
    
    await addGoal({
      name,
      targetAmount,
      savedAmount,
      isEmergency
    });
    setName('');
    setTargetAmount('');
    setSavedAmount('0');
    setIsEmergency(false);
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

          <Form.Group className="mb-4">
            <div className="p-3 rounded-4 bg-info bg-opacity-10 border border-info border-opacity-25">
                <Form.Check 
                    type="switch"
                    id="emergency-toggle"
                    label={
                        <div className="ms-2">
                            <div className="fw-bold small d-flex align-items-center gap-2">
                                <FaShieldAlt className="text-info" /> Mark as Emergency Fund
                            </div>
                            <div className="x-small text-muted mt-1">Activating this shield reduces health loss from overspending when 100% funded!</div>
                        </div>
                    }
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                />
            </div>
          </Form.Group>

          <div className="d-flex justify-content-end pt-2">
            <Button variant="secondary" className="me-2 rounded-pill px-4" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="rounded-pill px-4 fw-bold shadow-sm">
              Add Goal
            </Button>
          </div>
        </Form>
      </Modal.Body>
      <style>{`
        .x-small { font-size: 0.7rem; }
      `}</style>
    </Modal>
  );
};

export default AddGoalModal;
