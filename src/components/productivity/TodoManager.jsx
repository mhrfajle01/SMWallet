import React, { useState } from 'react';
import { Card, Form, Button, Badge, Row, Col, InputGroup } from 'react-bootstrap';
import { useProductivity } from '../../context/ProductivityContext';
import { FaPlus, FaTrash, FaCheckCircle, FaRegCircle, FaCalendarAlt, FaFlag } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const TodoManager = () => {
  const { todos, addTodo, toggleTodo, deleteTodo } = useProductivity();
  const [filter, setFilter] = useState('all'); // all, today, week, overdue
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    addTodo(newTask, priority, dueDate);
    setNewTask('');
    setPriority('Medium');
    setDueDate('');
  };

  const getFilteredTodos = () => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    return todos.filter(t => {
      if (filter === 'all') return true;
      if (filter === 'today') return t.dueDate === today;
      if (filter === 'overdue') return t.dueDate && t.dueDate < today && !t.completed;
      return true;
    });
  };

  const priorityColors = {
    High: 'danger',
    Medium: 'warning',
    Low: 'success'
  };

  return (
    <div className="mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Tasks & To-Dos</h4>
        <div className="d-flex gap-2">
            {['all', 'today', 'overdue'].map(f => (
                <Button 
                    key={f} 
                    size="sm" 
                    variant={filter === f ? 'primary' : 'light'} 
                    className="text-capitalize rounded-pill px-3"
                    onClick={() => setFilter(f)}
                >
                    {f}
                </Button>
            ))}
        </div>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Form onSubmit={handleAdd} className="d-flex gap-2 flex-wrap flex-md-nowrap">
            <Form.Control 
              placeholder="Add a new task..." 
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              className="border-0 bg-light fw-medium"
            />
            <InputGroup className="w-auto">
                <Form.Select 
                    value={priority} 
                    onChange={e => setPriority(e.target.value)}
                    className="border-0 bg-light text-muted"
                    style={{ maxWidth: '120px' }}
                >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                </Form.Select>
            </InputGroup>
            <Form.Control 
                type="date" 
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="border-0 bg-light text-muted w-auto"
            />
            <Button type="submit" variant="primary" className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                <FaPlus />
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <div className="d-flex flex-column gap-2">
        <AnimatePresence>
            {getFilteredTodos().map(todo => (
                <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    layout
                >
                    <Card className={`border-0 shadow-sm ${todo.completed ? 'opacity-50' : ''}`}>
                        <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-3">
                                <motion.div 
                                    whileTap={{ scale: 0.8 }}
                                    onClick={() => toggleTodo(todo.id, todo.completed)}
                                    className={`cursor-pointer ${todo.completed ? 'text-success' : 'text-muted'}`}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {todo.completed ? <FaCheckCircle size={22} /> : <FaRegCircle size={22} />}
                                </motion.div>
                                <div>
                                    <div className={`fw-medium ${todo.completed ? 'text-decoration-line-through text-muted' : ''}`}>
                                        {todo.title}
                                    </div>
                                    <div className="d-flex gap-2 align-items-center small text-muted mt-1">
                                        {todo.dueDate && (
                                            <span className={`d-flex align-items-center gap-1 ${!todo.completed && todo.dueDate < new Date().toISOString().split('T')[0] ? 'text-danger fw-bold' : ''}`}>
                                                <FaCalendarAlt size={10} /> {todo.dueDate}
                                            </span>
                                        )}
                                        <Badge bg={priorityColors[todo.priority]} text="white" className="fw-normal" style={{ fontSize: '0.65rem' }}>
                                            {todo.priority}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <Button variant="link" className="text-danger p-0 opacity-50 hover-opacity-100" onClick={() => deleteTodo(todo.id)}>
                                <FaTrash />
                            </Button>
                        </Card.Body>
                    </Card>
                </motion.div>
            ))}
        </AnimatePresence>
        {getFilteredTodos().length === 0 && (
            <div className="text-center py-5 text-muted opacity-50">
                No tasks found. Time to relax?
            </div>
        )}
      </div>
    </div>
  );
};

export default TodoManager;
