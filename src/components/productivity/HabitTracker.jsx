import React, { useState } from 'react';
import { Card, Button, Form, Row, Col, Badge } from 'react-bootstrap';
import { useProductivity } from '../../context/ProductivityContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaCheck, FaCalendarAlt, FaFire } from 'react-icons/fa';
import '../../Productivity.css';

const HabitTracker = () => {
  const { habits, habitLogs, addHabit, deleteHabit, toggleHabit } = useProductivity();
  const [showAdd, setShowAdd] = useState(false);
  const [newHabit, setNewHabit] = useState('');

  const today = new Date().toISOString().split('T')[0];
  
  // Get last 7 days for the mini-grid
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newHabit.trim()) return;
    addHabit(newHabit);
    setNewHabit('');
    setShowAdd(false);
  };

  const calculateStreak = (habitId) => {
    let streak = 0;
    const sortedLogs = habitLogs
        .filter(l => l.habitId === habitId && l.status)
        .map(l => l.date)
        .sort((a, b) => new Date(b) - new Date(a));
    
    // Simple streak logic for demonstration
    return sortedLogs.length; 
  };

  return (
    <div className="prod-container pb-5">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
            <h2 className="prod-title mb-1">Habit Tracker</h2>
            <p className="prod-subtitle mb-0">Build consistency, change your life.</p>
        </div>
        <Button variant="primary" size="sm" className="rounded-pill px-4 shadow-sm" onClick={() => setShowAdd(!showAdd)}>
            <FaPlus className="me-2" /> New Habit
        </Button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-4">
            <Card className="prod-card border-0 p-3">
              <Form onSubmit={handleAdd} className="d-flex gap-2">
                <Form.Control 
                  placeholder="What habit do you want to start?" 
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  className="prod-input"
                  autoFocus
                />
                <Button type="submit" variant="primary" className="rounded-pill px-4">Add</Button>
              </Form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Row className="g-4">
        {habits.length > 0 ? (
          habits.map((habit) => {
            const isCompletedToday = habitLogs.some(l => l.habitId === habit.id && l.date === today && l.status);
            const streak = calculateStreak(habit.id);

            return (
              <Col key={habit.id} xs={12}>
                <Card className="prod-card">
                  <Card.Body className="p-4">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                      <div className="d-flex align-items-center gap-3">
                        <div 
                            className={`prod-checkbox ${isCompletedToday ? 'active' : ''}`}
                            onClick={() => toggleHabit(habit.id, today)}
                            style={{ width: '32px', height: '32px' }}
                        >
                          {isCompletedToday && <FaCheck />}
                        </div>
                        <div>
                          <h5 className="mb-1 fw-bold prod-title">{habit.title}</h5>
                          <div className="d-flex gap-2 align-items-center">
                              <Badge bg="warning" className="prod-badge bg-opacity-10 text-warning d-flex align-items-center gap-1">
                                  <FaFire /> {streak} day streak
                              </Badge>
                              <small className="prod-subtitle">Daily goal</small>
                          </div>
                        </div>
                      </div>

                      {/* Mini Weekly Grid */}
                      <div className="d-flex gap-2 align-items-center bg-light bg-opacity-50 p-2 rounded-4">
                        {last7Days.map((date) => {
                          const done = habitLogs.some(l => l.habitId === habit.id && l.date === date && l.status);
                          const isT = date === today;
                          return (
                            <div 
                                key={date} 
                                className="text-center"
                                style={{ width: '30px' }}
                            >
                                <div className="prod-subtitle mb-1" style={{ fontSize: '0.6rem' }}>
                                    {new Date(date).toLocaleDateString('en-US', { weekday: 'narrow' })}
                                </div>
                                <div 
                                    className={`rounded-circle mx-auto ${done ? 'bg-primary' : 'bg-secondary bg-opacity-10'}`}
                                    style={{ 
                                        width: '12px', 
                                        height: '12px', 
                                        border: isT ? '2px solid var(--prod-accent)' : 'none',
                                        opacity: done ? 1 : 0.5
                                    }}
                                />
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-end">
                          <FaTrash 
                            className="text-danger opacity-25 cursor-pointer hover-opacity-100" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => deleteHabit(habit.id)}
                          />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })
        ) : (
          <Col xs={12}>
            <div className="text-center py-5 bg-light rounded-5 border-dashed border-2">
                <FaCalendarAlt size={48} className="text-muted opacity-25 mb-3" />
                <h5 className="prod-title opacity-50">No habits tracked yet</h5>
                <p className="prod-subtitle">Consistency is the key to success. Start today!</p>
                <Button variant="outline-primary" size="sm" className="rounded-pill mt-2" onClick={() => setShowAdd(true)}>
                    Create First Habit
                </Button>
            </div>
          </Col>
        )}
      </Row>

      <style>{`
        .border-dashed { border-style: dashed !important; }
        .hover-opacity-100:hover { opacity: 1 !important; }
      `}</style>
    </div>
  );
};

export default HabitTracker;
