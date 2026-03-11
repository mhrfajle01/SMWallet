import React, { useState } from 'react';
import { Card, Button, Form, Row, Col, Badge, Dropdown } from 'react-bootstrap';
import { useProductivity } from '../../context/ProductivityContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaCheck, FaTasks, FaChevronRight, FaClock, FaEllipsisV } from 'react-icons/fa';
import '../../Productivity.css';

const TodoManager = () => {
  const { todos, addTodo, toggleTodo, deleteTodo } = useProductivity();
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'Medium', dueDate: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    addTodo(newTask.title, newTask.priority, newTask.dueDate);
    setNewTask({ title: '', priority: 'Medium', dueDate: '' });
    setShowAdd(false);
  };

  const getPriorityColor = (p) => {
    switch(p) {
        case 'High': return 'danger';
        case 'Medium': return 'warning';
        case 'Low': return 'info';
        default: return 'secondary';
    }
  };

  const sortedTodos = [...todos].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const priorities = { 'High': 0, 'Medium': 1, 'Low': 2 };
      return priorities[a.priority] - priorities[b.priority];
  });

  return (
    <div className="prod-container pb-5">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
            <h2 className="prod-title mb-1">Tasks</h2>
            <p className="prod-subtitle mb-0">Organize your day, one task at a time.</p>
        </div>
        <Button variant="primary" size="sm" className="rounded-pill px-4 shadow-sm" onClick={() => setShowAdd(!showAdd)}>
            <FaPlus className="me-2" /> New Task
        </Button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-4">
            <Card className="prod-card border-0 p-4">
              <Form onSubmit={handleAdd}>
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Control 
                      placeholder="What needs to be done?" 
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      className="prod-input py-2 px-3 fs-5"
                      autoFocus
                      required
                    />
                  </Col>
                  <Col md={5}>
                    <Form.Label className="prod-subtitle fw-bold small uppercase">Priority</Form.Label>
                    <div className="d-flex gap-2">
                        {['Low', 'Medium', 'High'].map(p => (
                            <Button 
                                key={p}
                                variant={newTask.priority === p ? getPriorityColor(p) : 'outline-secondary'}
                                size="sm"
                                className="rounded-pill flex-grow-1"
                                onClick={() => setNewTask({...newTask, priority: p})}
                            >
                                {p}
                            </Button>
                        ))}
                    </div>
                  </Col>
                  <Col md={5}>
                    <Form.Label className="prod-subtitle fw-bold small uppercase">Due Date</Form.Label>
                    <Form.Control 
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                        className="prod-input"
                    />
                  </Col>
                  <Col md={2} className="d-flex align-items-end">
                    <Button type="submit" variant="primary" className="w-100 rounded-pill py-2 fw-bold">Create</Button>
                  </Col>
                </Row>
              </Form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="prod-card border-0">
        <div className="pb-2">
          {sortedTodos.length > 0 ? (
            sortedTodos.map((todo) => (
              <div key={todo.id} className="prod-list-item d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3 flex-grow-1">
                  <div 
                      className={`prod-checkbox ${todo.completed ? 'active' : ''}`}
                      onClick={() => toggleTodo(todo.id, todo.completed)}
                  >
                    {todo.completed && <FaCheck size={12} />}
                  </div>
                  <div className={todo.completed ? 'text-decoration-line-through opacity-50' : 'flex-grow-1'}>
                    <div className="fw-bold prod-title d-flex align-items-center gap-2">
                        {todo.title}
                        {!todo.completed && (
                            <Badge bg={getPriorityColor(todo.priority)} className="prod-badge bg-opacity-10 text-capitalize" style={{ fontSize: '0.65rem', color: `var(--bs-${getPriorityColor(todo.priority)})` }}>
                                {todo.priority}
                            </Badge>
                        )}
                    </div>
                    <div className="prod-subtitle d-flex align-items-center gap-3">
                        {todo.dueDate && (
                            <span className="d-flex align-items-center gap-1">
                                <FaClock size={10} /> {new Date(todo.dueDate).toLocaleDateString()}
                            </span>
                        )}
                        <span className="opacity-50">#personal</span>
                    </div>
                  </div>
                </div>
                
                <Dropdown align="end">
                  <Dropdown.Toggle variant="link" className="text-muted p-0 border-0 shadow-none no-caret">
                    <FaEllipsisV />
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="shadow-lg border-0 rounded-4">
                    <Dropdown.Item className="text-danger" onClick={() => deleteTodo(todo.id)}>
                        <FaTrash className="me-2" /> Delete Task
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            ))
          ) : (
            <div className="text-center py-5">
                <FaTasks size={48} className="text-muted opacity-25 mb-3" />
                <h5 className="prod-title opacity-50">Clean slate!</h5>
                <p className="prod-subtitle">You don't have any tasks for today.</p>
            </div>
          )}
        </div>
      </Card>

      <style>{`
        .no-caret::after { display: none !important; }
        .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06); }
      `}</style>
    </div>
  );
};

export default TodoManager;
