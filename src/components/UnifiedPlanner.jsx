import React, { useState, useMemo } from 'react';
import { Container, Nav, Card, Row, Col, ProgressBar, Badge, Button, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaCalendarDay, FaTasks, FaFire, FaPlane, FaStickyNote, 
    FaTint, FaPlus, FaMinus, FaCheckCircle, FaClock, FaChevronRight,
    FaBolt, FaThLarge
} from 'react-icons/fa';
import { useProductivity } from '../context/ProductivityContext';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

// Productivity Components
import TodoManager from './productivity/TodoManager';
import HabitTracker from './productivity/HabitTracker';
import SmartPlanner from './SmartPlanner';
import NotesApp from './productivity/NotesApp';

const DailyOverview = ({ setActiveTab }) => {
  const { 
    todos, habits, habitLogs, waterStats, updateWater, getTodayStr, getDailyProgress, toggleHabit
  } = useProductivity();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const today = getTodayStr();
  const progress = getDailyProgress();

  const pendingTasks = useMemo(() => 
    todos.filter(t => !t.completed).slice(0, 3), 
  [todos]);

  const activeHabits = useMemo(() => 
    habits.map(h => ({
        ...h,
        doneToday: habitLogs.some(l => l.habitId === h.id && l.date === today && l.status)
    })), 
  [habits, habitLogs, today]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="py-2">
      {/* Welcome Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
              <h2 className="fw-bold mb-1">{getTimeGreeting()}, {user?.displayName?.split(' ')[0] || 'Planner'}!</h2>
              <p className="text-muted small d-flex align-items-center gap-2">
                  <FaCalendarDay className="text-primary" /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
          </div>
          <Button variant="outline-primary" size="sm" className="rounded-pill px-3 fw-bold border-dashed mt-1" onClick={() => navigate('/selection')} style={{ borderStyle: 'dashed' }}>
              <FaThLarge className="me-2" /> Switch Workspace
          </Button>
      </div>

      <Row className="g-4">
        {/* Progress & Quick Stats */}
        <Col lg={8}>
          <Card className="border-0 shadow-lg mb-4 text-white overflow-hidden rounded-4" style={{ 
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              minHeight: '200px'
          }}>
            <Card.Body className="p-4 position-relative d-flex flex-column justify-content-center">
              <div className="position-relative" style={{ zIndex: 2 }}>
                <Row className="align-items-center">
                    <Col md={7}>
                        <h4 className="fw-bold mb-2">Daily Momentum</h4>
                        <p className="opacity-90 small mb-4 pe-md-4">
                            {progress === 100 
                                ? "Incredible! You've crushed all your goals for today. Take a well-deserved break!" 
                                : progress > 50 
                                ? "You're doing great! More than halfway there. Keep that energy up!" 
                                : "A fresh start to a productive day. Let's tackle those goals one by one."}
                        </p>
                        <div className="d-flex gap-3 mt-2">
                            <Badge bg="white" text="primary" className="rounded-pill px-3 py-2 shadow-sm border-0 d-flex align-items-center gap-2">
                                <FaCheckCircle /> {todos.filter(t => t.completed).length} Tasks Done
                            </Badge>
                            <Badge bg="white" text="primary" className="rounded-pill px-3 py-2 shadow-sm border-0 d-flex align-items-center gap-2">
                                <FaFire /> {activeHabits.filter(h => h.doneToday).length} Habits
                            </Badge>
                        </div>
                    </Col>
                    <Col md={5} className="text-center mt-4 mt-md-0">
                        <div className="position-relative d-inline-block">
                            <svg viewBox="0 0 36 36" className="circular-chart white" style={{ width: '120px', height: '120px' }}>
                                <path className="circle-bg" stroke="rgba(255,255,255,0.2)" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <motion.path 
                                    className="circle" 
                                    stroke="#fff"
                                    strokeDasharray={`${progress}, 100`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: progress / 100 }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                                <text x="18" y="20.35" className="percentage" fill="#fff" style={{ fontSize: '0.5rem', fontWeight: '800', textAnchor: 'middle' }}>{progress}%</text>
                            </svg>
                        </div>
                    </Col>
                </Row>
              </div>
              {/* Decorative Background Icon */}
              <div className="position-absolute" style={{ right: '-30px', bottom: '-30px', opacity: 0.15, transform: 'rotate(-15deg)' }}>
                <FaBolt size={180} />
              </div>
            </Card.Body>
          </Card>

          {/* Focus Today & Hydration Grid */}
          <Row className="g-4">
              <Col md={6}>
                  <Card className="border-0 shadow-sm h-100 rounded-4">
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h6 className="fw-bold mb-0 text-uppercase tracking-wider small text-muted">Next Tasks</h6>
                        <Button variant="link" size="sm" className="text-primary p-0 text-decoration-none fw-bold" onClick={() => setActiveTab('tasks')}>All</Button>
                      </div>
                      <div className="d-flex flex-column gap-3">
                        {pendingTasks.length > 0 ? pendingTasks.map(task => (
                          <div key={task.id} className="d-flex align-items-center p-3 rounded-4 hover-bg transition-all border border-light shadow-xs">
                            <div className="bg-primary bg-opacity-10 p-2 rounded-3 me-3 text-primary"><FaTasks size={14} /></div>
                            <div className="flex-grow-1 overflow-hidden">
                              <div className="fw-bold small text-truncate">{task.title}</div>
                              <div className="d-flex align-items-center gap-2 mt-1">
                                  <Badge bg={task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'info'} className="x-small rounded-pill py-1 px-2">{task.priority}</Badge>
                                  {task.time && <span className="text-muted x-small"><FaClock size={10} className="me-1" />{task.time}</span>}
                              </div>
                            </div>
                            <FaChevronRight className="text-muted opacity-25 ms-2" size={12} />
                          </div>
                        )) : (
                          <div className="text-center py-4">
                              <div className="bg-success bg-opacity-10 text-success p-3 rounded-circle d-inline-block mb-2">
                                  <FaCheckCircle size={24} />
                              </div>
                              <p className="text-muted small mb-0">All caught up!</p>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
              </Col>
              <Col md={6}>
                  <Card className="border-0 shadow-sm h-100 rounded-4" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
                    <Card.Body className="p-4 d-flex flex-column justify-content-between">
                      <div>
                          <div className="d-flex align-items-center gap-3 mb-4">
                            <div className="bg-white p-3 rounded-4 text-info shadow-sm">
                              <FaTint size={24} />
                            </div>
                            <div>
                              <h6 className="fw-bold mb-0 text-info-dark">Hydration</h6>
                              <p className="text-info opacity-75 small mb-0">Daily Goal: {waterStats.goal}</p>
                            </div>
                          </div>
                          
                          <div className="text-center my-4">
                              <div className="position-relative d-inline-block">
                                  <h2 className="fw-bold mb-0 text-info-dark display-6">{waterStats.current}</h2>
                                  <span className="text-muted small text-uppercase tracking-tighter" style={{ fontSize: '0.6rem' }}>glasses</span>
                              </div>
                          </div>
                      </div>

                      <div className="d-flex align-items-center justify-content-center gap-4">
                        <motion.button whileTap={{ scale: 0.9 }} className="btn btn-white rounded-circle p-0 shadow-sm text-info border-0" style={{ width: '48px', height: '48px', background: 'white' }} onClick={() => updateWater(waterStats.current - 1)}>
                          <FaMinus size={14} />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} className="btn btn-info rounded-circle p-0 shadow-lg border-0 text-white" style={{ width: '56px', height: '56px' }} onClick={() => updateWater(waterStats.current + 1)}>
                          <FaPlus size={18} />
                        </motion.button>
                      </div>
                    </Card.Body>
                  </Card>
              </Col>
          </Row>
        </Col>

        {/* Habits & Quick Actions */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
            <Card.Header className="bg-transparent border-0 p-4 pb-0">
                <div className="d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold mb-0 text-uppercase tracking-wider small text-muted">Habit Pulse</h6>
                    <Button variant="link" size="sm" className="text-primary p-0 text-decoration-none fw-bold" onClick={() => setActiveTab('habits')}>View All</Button>
                </div>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-flex flex-column gap-3">
                {activeHabits.slice(0, 5).map(habit => (
                  <div key={habit.id} className="p-3 rounded-4 border border-light transition-all hover-lift" style={{ background: 'var(--card-bg)' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div 
                            className={`rounded-circle d-flex align-items-center justify-content-center transition-all ${habit.doneToday ? 'bg-success text-white' : 'bg-light text-muted'}`} 
                            style={{ width: '36px', height: '36px', minWidth: '36px', cursor: 'pointer' }}
                            onClick={() => toggleHabit(habit.id, today)}
                        >
                        {habit.doneToday ? <FaCheckCircle size={18} /> : <FaFire size={16} />}
                        </div>
                        <div className="flex-grow-1 overflow-hidden">
                            <div className={`small fw-bold text-truncate ${habit.doneToday ? 'text-muted text-decoration-line-through' : ''}`}>{habit.title}</div>
                            <div className="text-muted x-small mt-1 d-flex align-items-center gap-1"><FaFire className="text-warning" /> {habit.streak || 0} day streak</div>
                        </div>
                    </div>
                  </div>
                ))}
                {activeHabits.length === 0 && (
                    <div className="text-center py-5 border border-dashed rounded-4">
                        <FaFire size={24} className="text-muted opacity-25 mb-2" />
                        <p className="text-muted small mb-0">Start a habit today!</p>
                    </div>
                )}
              </div>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm rounded-4 bg-light overflow-hidden">
             <Card.Body className="p-4">
                <h6 className="fw-bold mb-4 text-uppercase tracking-wider small text-muted">Quick Actions</h6>
                <div className="d-grid gap-3">
                   <motion.button whileHover={{ x: 5 }} className="btn btn-white text-start shadow-sm border-0 py-3 px-3 small d-flex align-items-center gap-3 rounded-4" onClick={() => setActiveTab('trips')}>
                      <div className="p-2 rounded-3 bg-info bg-opacity-10 text-info"><FaPlane /></div>
                      <div>
                          <div className="fw-bold">New Trip</div>
                          <div className="x-small text-muted">Plan your next adventure</div>
                      </div>
                   </motion.button>
                   <motion.button whileHover={{ x: 5 }} className="btn btn-white text-start shadow-sm border-0 py-3 px-3 small d-flex align-items-center gap-3 rounded-4" onClick={() => setActiveTab('notes')}>
                      <div className="p-2 rounded-3 bg-warning bg-opacity-10 text-warning"><FaStickyNote /></div>
                      <div>
                          <div className="fw-bold">Quick Note</div>
                          <div className="x-small text-muted">Capture ideas instantly</div>
                      </div>
                   </motion.button>
                </div>
             </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <style>{`
        .circular-chart { display: block; margin: 10px auto; max-width: 100%; max-height: 250px; }
        .circle-bg { fill: none; stroke-width: 3.8; }
        .circle { fill: none; stroke-width: 3.8; stroke-linecap: round; transition: stroke-dasharray 0.3s ease; }
        .percentage { font-family: sans-serif; fill: #fff; }
        .border-bottom-light { border-bottom: 1px solid rgba(0,0,0,0.05); }
        .uppercase { text-transform: uppercase; }
        .tracking-wider { letter-spacing: 0.05em; }
        .text-primary-dark { color: #1e3a8a; }
      `}</style>
    </motion.div>
  );
};

const UnifiedPlanner = () => {
  const [activeTab, setActiveTab] = useState('daily');

  const tabs = [
    { id: 'daily', label: 'Daily Hub', icon: <FaCalendarDay /> },
    { id: 'tasks', label: 'Tasks', icon: <FaTasks /> },
    { id: 'habits', label: 'Habits', icon: <FaFire /> },
    { id: 'trips', label: 'Trips & Shopping', icon: <FaPlane /> },
    { id: 'notes', label: 'Notes', icon: <FaStickyNote /> }
  ];

  return (
    <Container fluid className="px-0 pb-5">
      {/* Tab Navigation */}
      <div className="sticky-top py-2 pb-3 mb-4 border-bottom shadow-xs nav-container" style={{ 
          zIndex: 10, 
          top: '-1px', 
          background: 'var(--bg-color)',
          borderColor: 'var(--border-color)',
          margin: '0 -1rem',
          padding: '0 1rem'
      }}>
        <Nav variant="pills" className="bg-surface-nav p-1 rounded-pill shadow-sm d-flex flex-nowrap overflow-auto scrollbar-hidden mx-auto justify-content-start justify-content-md-center" style={{ maxWidth: 'fit-content' }}>
          {tabs.map(tab => (
            <Nav.Item key={tab.id} className="flex-shrink-0">
              <Nav.Link 
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-pill px-3 px-md-4 py-2 d-flex align-items-center gap-2 small whitespace-nowrap transition-all ${activeTab === tab.id ? 'shadow-sm fw-bold' : 'text-secondary'}`}
                style={{ 
                    fontSize: '0.8rem',
                    backgroundColor: activeTab === tab.id ? 'var(--primary-color)' : 'transparent',
                    color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)'
                }}
              >
                {tab.icon} <span>{tab.label}</span>
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'daily' && <DailyOverview setActiveTab={setActiveTab} />}
          {activeTab === 'tasks' && <TodoManager />}
          {activeTab === 'habits' && <HabitTracker />}
          {activeTab === 'trips' && <SmartPlanner />}
          {activeTab === 'notes' && <NotesApp />}
        </motion.div>
      </AnimatePresence>

      <style>{`
        .bg-surface-nav { background-color: var(--bg-surface); }
        .whitespace-nowrap { white-space: nowrap; }
        .scrollbar-hidden::-webkit-scrollbar { display: none; }
        .scrollbar-hidden { -ms-overflow-style: none; scrollbar-width: none; }
        .nav-container { 
            backdrop-filter: blur(10px);
            background-color: rgba(var(--bg-color-rgb), 0.8) !important;
        }
        @media (max-width: 768px) {
            .nav-container {
                margin: 0 -0.5rem !important;
                padding: 0 0.5rem !important;
            }
        }
      `}</style>
    </Container>
  );
};

export default UnifiedPlanner;