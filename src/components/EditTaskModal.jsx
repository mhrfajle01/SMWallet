import React, { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { usePlanner } from '../context/PlannerContext';

const EditTaskModal = ({ show, onHide, task }) => {
  const { updateTask } = usePlanner();
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Work');
  const [priority, setPriority] = useState('Medium');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setTime(task.time || '');
      setDate(task.date || '');
      setCategory(task.category || 'Work');
      setPriority(task.priority || 'Medium');
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !task) return;
    
    updateTask(task.id, { title, time, date, category, priority });
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered contentClassName="border-0 shadow-lg rounded-4">
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold">Edit Duty/Task</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Task Title</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="e.g. Morning Meeting" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
          </Form.Group>

          <div className="d-flex gap-2 mb-3">
            <Form.Group className="flex-grow-1">
              <Form.Label>Date</Form.Label>
              <Form.Control 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required 
              />
            </Form.Group>
            <Form.Group className="flex-grow-1">
              <Form.Label>Time (Optional)</Form.Label>
              <Form.Control 
                type="time" 
                value={time} 
                onChange={(e) => setTime(e.target.value)} 
              />
            </Form.Group>
          </div>

          <div className="d-flex gap-2 mb-4">
             <Form.Group className="flex-grow-1">
              <Form.Label>Category</Form.Label>
              <Form.Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Study">Study</option>
                <option value="Health">Health</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="flex-grow-1">
              <Form.Label>Priority</Form.Label>
              <Form.Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </Form.Select>
            </Form.Group>
          </div>

          <Button variant="primary" type="submit" className="w-100 rounded-pill py-2">
            Save Changes
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditTaskModal;
