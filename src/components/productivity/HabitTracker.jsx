import React, { useState } from 'react';
import { Card, Button, Form, Modal, Row, Col, Badge } from 'react-bootstrap';
import { useProductivity } from '../../context/ProductivityContext';
import { FaPlus, FaCheck, FaFire, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';

const HabitTracker = () => {
  const { habits, habitLogs, addHabit, toggleHabit, deleteHabit } = useProductivity();
  const [showModal, setShowModal] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');

  // Generate last 7 days
  const getLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };
  const weekDates = getLast7Days();

  // Calculate Streak
  const getStreak = (habitId) => {
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];

    // Check today
    const hasToday = habitLogs.find(l => l.habitId === habitId && l.date === today && l.status);
    if (hasToday) streak++;

    // Check backwards
    let current = hasToday ? yesterday : new Date(); // Start checking from yesterday if today is done, else today (but strictly sequential check logic varies, usually streak implies consecutive days ending today or yesterday)
    
    // Simple logic: sort logs desc by date.
    const logs = habitLogs
      .filter(l => l.habitId === habitId && l.status)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (logs.length === 0) return 0;

    // ...complex streak logic omitted for brevity, using simple count for now or basic sequential check
    // Let's do a simple check
    let count = 0;
    let checkDate = new Date();
    
    // Align checkDate to latest log if it's today
    const latestLogDate = logs[0].date;
    if (latestLogDate === today) {
        count = 1;
        checkDate.setDate(checkDate.getDate() - 1);
    } else if (latestLogDate === yStr) {
        // Last log was yesterday, streak is active
        checkDate.setDate(checkDate.getDate() - 1); // Start checking from yesterday
    } else {
        return 0; // Streak broken
    }

    // Now iterate backwards
    for (let i = (latestLogDate === today ? 1 : 0); i < logs.length; i++) {
        const d = logs[i].date;
        const checkStr = checkDate.toISOString().split('T')[0];
        if (d === checkStr) {
            count++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break; 
        }
    }
    return count;
  };

  const getStatus = (habitId, date) => {
    const log = habitLogs.find(l => l.habitId === habitId && l.date === date);
    return log ? log.status : false;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (newHabitTitle.trim()) {
      await addHabit(newHabitTitle);
      setNewHabitTitle('');
      setShowModal(false);
    }
  };

  return (
    <div className="mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Habit Tracker</h4>
        <Button variant="primary" size="sm" className="rounded-pill px-3" onClick={() => setShowModal(true)}>
          <FaPlus className="me-2" /> New Habit
        </Button>
      </div>

      <Row className="g-3">
        {habits.map(habit => {
           const streak = getStreak(habit.id);
           return (
            <Col xs={12} key={habit.id}>
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-3">
                  <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3" style={{ minWidth: '200px' }}>
                      <div className={`p-3 rounded-circle ${streak > 0 ? 'bg-warning text-dark' : 'bg-light text-muted'}`}>
                        <FaFire />
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0">{habit.title}</h6>
                        <small className="text-muted">{streak} day streak</small>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between flex-grow-1 gap-1">
                      {weekDates.map((date, idx) => {
                        const status = getStatus(habit.id, date);
                        const isToday = date === new Date().toISOString().split('T')[0];
                        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                        
                        return (
                          <div key={date} className="text-center d-flex flex-column align-items-center" style={{ flex: 1 }}>
                            <small className="mb-1 text-muted" style={{ fontSize: '0.65rem' }}>{dayName}</small>
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() => toggleHabit(habit.id, date)}
                              className={`btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center ${status ? 'btn-success' : 'btn-light border'}`}
                              style={{ width: '32px', height: '32px', transition: 'all 0.2s' }}
                            >
                              {status && <FaCheck size={12} />}
                            </motion.button>
                          </div>
                        );
                      })}
                    </div>
                    
                    <Button variant="light" size="sm" className="text-danger border-0 ms-md-2" onClick={() => deleteHabit(habit.id)}>
                        <FaTimes />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
        {habits.length === 0 && (
          <Col xs={12}>
            <div className="text-center py-5 text-muted">
              <p>No habits yet. Start building your streak today!</p>
            </div>
          </Col>
        )}
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title>Create New Habit</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAdd}>
            <Form.Group className="mb-3">
              <Form.Label>Habit Name</Form.Label>
              <Form.Control 
                autoFocus
                placeholder="e.g. Read 30 mins, Gym, Drink Water" 
                value={newHabitTitle}
                onChange={e => setNewHabitTitle(e.target.value)}
              />
            </Form.Group>
            <Button type="submit" variant="primary" className="w-100 rounded-pill">Create Habit</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default HabitTracker;
