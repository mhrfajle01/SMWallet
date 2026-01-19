import React, { useState } from 'react';
import { Card, Row, Col, ProgressBar, Button, ListGroup, Badge, Form } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { usePlanner } from '../context/PlannerContext';
import { FaCalendarCheck, FaCheckCircle, FaFire, FaTasks, FaClock, FaPlus, FaTrash, FaRegCircle, FaEdit, FaTint, FaMinus } from 'react-icons/fa';
import AddTaskModal from './AddTaskModal';
import AddHabitModal from './AddHabitModal';
import EditTaskModal from './EditTaskModal';

const PlannerView = ({ activeTab = 'home' }) => {
  const { tasks, habits, waterStats, toggleTask, deleteTask, toggleHabitForToday, deleteHabit, getDailyStats, getTodayStr, updateWater } = usePlanner();
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  const today = getTodayStr();
  const todaysTasks = tasks.filter(t => t.date === today);
  const stats = getDailyStats();

  // Water Logic
  const handleAddWater = () => updateWater(waterStats.current + 1);
  const handleRemoveWater = () => updateWater(waterStats.current - 1);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const getPriorityColor = (p) => {
    if (p === 'High') return 'danger';
    if (p === 'Medium') return 'warning';
    return 'info';
  };

  const showTasks = activeTab === 'home' || activeTab === 'tasks';
  const showHabits = activeTab === 'home' || activeTab === 'habits';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="pb-5"
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">
            {activeTab === 'home' ? 'Working Duty Plan' : activeTab === 'tasks' ? 'All Tasks' : 'Habit Tracker'}
          </h4>
          <p className="text-muted small mb-0">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="d-flex gap-2">
          {showHabits && (
            <Button variant="outline-primary" onClick={() => setShowAddHabit(true)} className="rounded-pill d-none d-md-block">
               + Habit
            </Button>
          )}
          {showTasks && (
            <Button variant="primary" onClick={() => setShowAddTask(true)} className="btn-primary-custom rounded-pill">
              <FaPlus className="me-2" /> New Task
            </Button>
          )}
        </div>
      </div>

      <Row className="g-4">
        {/* Main Content Column */}
        <Col lg={showTasks && showHabits ? 8 : 12}>
          
          {/* Daily Stats - Only on Home */}
          {activeTab === 'home' && (
            <motion.div variants={itemVariants}>
              <Card className="custom-card border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">Daily Progress</h5>
                    <Badge bg="primary" className="rounded-pill px-3 py-2">{Math.round(stats.taskProgress)}% Done</Badge>
                  </div>
                  <ProgressBar now={stats.taskProgress} variant="primary" className="rounded-pill" style={{ height: '12px' }} />
                  <Row className="mt-4 g-3">
                    <Col xs={4}>
                      <div className="text-center p-3 bg-light rounded-4">
                        <div className="text-primary h4 mb-1"><FaCheckCircle /></div>
                        <div className="small fw-bold">{stats.completedTasks}</div>
                        <div className="text-muted" style={{ fontSize: '0.6rem' }}>COMPLETED</div>
                      </div>
                    </Col>
                    <Col xs={4}>
                      <div className="text-center p-3 bg-light rounded-4">
                        <div className="text-warning h4 mb-1"><FaClock /></div>
                        <div className="small fw-bold">{stats.totalTasks - stats.completedTasks}</div>
                        <div className="text-muted" style={{ fontSize: '0.6rem' }}>PENDING</div>
                      </div>
                    </Col>
                    <Col xs={4}>
                      <div className="text-center p-3 bg-light rounded-4">
                        <div className="text-success h4 mb-1"><FaFire /></div>
                        <div className="small fw-bold">{habits.filter(h => h.streak > 0).length}</div>
                        <div className="text-muted" style={{ fontSize: '0.6rem' }}>ACTIVE HABITS</div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </motion.div>
          )}

          {/* Hydration Card - New Feature */}
          <motion.div variants={itemVariants} className="mb-4">
            <Card className="custom-card border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' }}>
               <Card.Body className="p-4 d-flex justify-content-between align-items-center">
                 <div>
                   <div className="d-flex align-items-center mb-2">
                     <div className="bg-white p-2 rounded-circle me-3 text-primary shadow-sm">
                       <FaTint />
                     </div>
                     <div>
                       <h5 className="fw-bold mb-0 text-primary-dark">Hydration</h5>
                       <small className="text-primary-dark opacity-75">Daily Goal: {waterStats.goal} Glasses</small>
                     </div>
                   </div>
                 </div>
                 <div className="d-flex align-items-center gap-3">
                    <Button variant="white" className="rounded-circle p-0 d-flex align-items-center justify-content-center shadow-sm text-primary" style={{ width: '40px', height: '40px', background: 'white' }} onClick={handleRemoveWater}>
                      <FaMinus size={12} />
                    </Button>
                    <div className="text-center">
                      <h3 className="fw-bold mb-0 text-primary-dark">{waterStats.current}</h3>
                      <small className="text-primary-dark opacity-75" style={{ fontSize: '0.65rem' }}>GLASSES</small>
                    </div>
                    <Button variant="primary" className="rounded-circle p-0 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '40px', height: '40px' }} onClick={handleAddWater}>
                      <FaPlus size={12} />
                    </Button>
                 </div>
               </Card.Body>
            </Card>
          </motion.div>

          {/* Tasks List */}
          {showTasks && (
            <motion.div variants={itemVariants}>
              <Card className="custom-card border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">Tasks & Duties</h5>
                    {!activeTab === 'home' && <Button variant="link" size="sm" onClick={() => setShowAddTask(true)}>+ New</Button>}
                  </div>
                  {todaysTasks.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <FaCalendarCheck size={32} className="opacity-25 mb-2" />
                      <p className="small">No tasks for today. Enjoy your day!</p>
                    </div>
                  ) : (
                    <ListGroup variant="flush">
                      {todaysTasks.map(task => (
                        <ListGroup.Item key={task.id} className="px-0 py-3 border-bottom bg-transparent d-flex align-items-center group-hover-parent">
                          <div 
                            className={`rounded-circle border me-3 d-flex align-items-center justify-content-center transition-all ${task.completed ? 'bg-primary border-primary text-white' : 'text-transparent'}`}
                            style={{ width: '24px', height: '24px', cursor: 'pointer', minWidth: '24px' }}
                            onClick={() => toggleTask(task.id, task.completed)}
                          >
                            {task.completed && <FaCheckCircle size={14} />}
                          </div>
                          <div className="flex-grow-1" style={{ opacity: task.completed ? 0.5 : 1 }}>
                            <div className={`fw-medium ${task.completed ? 'text-decoration-line-through text-muted' : ''}`}>{task.title}</div>
                            <div className="text-muted small d-flex align-items-center gap-3">
                              {task.time && <span><FaClock className="me-1" size={10} /> {formatTime(task.time)}</span>}
                              <Badge bg="light" text="dark" className="border fw-normal">{task.category}</Badge>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                             <Badge bg={getPriorityColor(task.priority)} className="rounded-pill fw-normal d-none d-sm-inline-block" style={{ opacity: 0.8 }}>{task.priority}</Badge>
                             <Button variant="link" className="text-secondary p-1" onClick={() => setEditingTask(task)}><FaEdit size={14} /></Button>
                             <Button variant="link" className="text-danger p-1" onClick={() => deleteTask(task.id)}><FaTrash size={14} /></Button>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </motion.div>
          )}
        </Col>

        {/* Habits Sidebar */}
        {showHabits && (
          <Col lg={showTasks && showHabits ? 4 : 12}>
            <motion.div variants={itemVariants}>
              <Card className="custom-card border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                     <h5 className="fw-bold mb-0">Habit Tracker</h5>
                     <Button variant="link" size="sm" onClick={() => setShowAddHabit(true)}>+ Add</Button>
                  </div>
                  
                  <div className="d-flex flex-column gap-3">
                    {habits.map(habit => {
                      const isDoneToday = (habit.completedDates || []).includes(today);
                      return (
                        <div key={habit.id} className="p-3 border rounded-4 bg-white position-relative overflow-hidden">
                          <div className="d-flex justify-content-between align-items-center mb-2 position-relative" style={{ zIndex: 2 }}>
                            <div className="d-flex align-items-center gap-2">
                               <div 
                                 onClick={() => toggleHabitForToday(habit.id)}
                                 className="d-flex align-items-center justify-content-center rounded-circle text-white transition-all shadow-sm"
                                 style={{ 
                                   width: '24px', 
                                   height: '24px', 
                                   cursor: 'pointer',
                                   backgroundColor: isDoneToday ? habit.color : '#e2e8f0' 
                                 }}
                               >
                                 <FaCheckCircle size={14} style={{ opacity: isDoneToday ? 1 : 0 }} />
                               </div>
                               <span className={`fw-bold ${isDoneToday ? 'text-muted' : ''}`}>{habit.name}</span>
                            </div>
                            <div className="text-warning small d-flex align-items-center fw-bold">
                              <FaFire className="me-1" /> {habit.streak}
                              <Button variant="link" className="text-muted p-0 ms-2" style={{ opacity: 0.2 }} onClick={() => deleteHabit(habit.id)}>
                                <FaTrash size={10} />
                              </Button>
                            </div>
                          </div>
                          {/* Weekly Dots Visualization */}
                          <div className="d-flex gap-1 ms-4 ps-2">
                            {[6, 5, 4, 3, 2, 1, 0].map(daysAgo => {
                              const d = new Date(today); // Use safe today date
                              d.setDate(d.getDate() - daysAgo);
                              const dStr = d.toISOString().split('T')[0];
                              const isCompleted = (habit.completedDates || []).includes(dStr);
                              return (
                                <div 
                                  key={daysAgo} 
                                  className="rounded-circle" 
                                  title={dStr}
                                  style={{ 
                                    width: '8px', 
                                    height: '8px', 
                                    backgroundColor: isCompleted ? habit.color : '#e2e8f0',
                                    opacity: isCompleted ? 1 : 0.5
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {habits.length === 0 && (
                       <div className="text-center text-muted small py-4 border border-dashed rounded-4">
                         No habits tracked yet.
                       </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        )}
      </Row>

      <AddTaskModal show={showAddTask} onHide={() => setShowAddTask(false)} />
      <AddHabitModal show={showAddHabit} onHide={() => setShowAddHabit(false)} />
      {editingTask && (
        <EditTaskModal 
          show={!!editingTask} 
          onHide={() => setEditingTask(null)} 
          task={editingTask} 
        />
      )}
    </motion.div>
  );
};

export default PlannerView;