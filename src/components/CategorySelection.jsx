import React, { useMemo } from 'react';
import { Container, Row, Col, Card, Button, Badge, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    FaWallet, FaTasks, FaShieldAlt, FaRocket, FaChartLine, 
    FaCheckCircle, FaPlus, FaEllipsisV, FaHistory, FaBolt,
    FaArrowRight, FaClock
} from 'react-icons/fa';
import { useModule } from '../context/ModuleContext';
import { useApp } from '../context/AppContext';
import { useProductivity } from '../context/ProductivityContext';
import { useUI } from '../context/UIContext';

const CategorySelection = () => {
  const navigate = useNavigate();
  const { setModule } = useModule();
  const { globalStats, avatarState } = useApp();
  const { todos, habits, habitLogs } = useProductivity();
  const { openTransactionModal } = useUI();

  const todayStr = new Date().toISOString().split('T')[0];

  const metrics = useMemo(() => ({
    balance: new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(globalStats?.totalBalance || 0),
    pendingTasks: (todos || []).filter(t => !t.completed).length,
    habitStreak: avatarState?.streak || 0
  }), [globalStats, todos, avatarState]);

  const handleSelect = (module, path) => {
    setModule(module);
    navigate(path);
  };

  return (
    <div className="selection-screen d-flex align-items-center justify-content-center min-vh-100" style={{ background: 'var(--bg-color)', padding: '2rem 0' }}>
      <Container>
        <div className="text-center mb-5">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge bg="primary" className="mb-3 px-3 py-2 rounded-pill bg-opacity-10 text-primary fw-bold">Life OS Platform</Badge>
            <h1 className="fw-extrabold display-4 mb-2" style={{ color: 'var(--text-primary)' }}>Welcome back!</h1>
            <p className="text-muted lead">Which world would you like to enter today?</p>
          </motion.div>
        </div>

        <Row className="justify-content-center g-4">
          {/* Wealth Portal */}
          <Col lg={5}>
            <motion.div whileHover={{ y: -10 }} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="selection-card h-100 border-0 shadow-lg overflow-hidden position-relative" style={{ borderRadius: '2.5rem', background: 'var(--card-bg)' }}>
                <div className="portal-accent" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', background: 'var(--primary-gradient)' }}></div>
                
                <Card.Body className="p-4 p-md-5 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div className="icon-wrapper bg-primary bg-opacity-10 text-primary rounded-4 d-flex align-items-center justify-content-center" style={{ width: '70px', height: '70px' }}>
                        <FaWallet size={30} />
                    </div>
                    <Dropdown align="end">
                        <Dropdown.Toggle variant="link" className="p-0 text-muted no-caret"><FaPlus /></Dropdown.Toggle>
                        <Dropdown.Menu className="border-0 shadow-lg rounded-4">
                            <Dropdown.Item onClick={() => { setModule('finance'); openTransactionModal(); }} className="py-2"><FaPlus className="me-2 text-primary"/> New Expense</Dropdown.Item>
                            <Dropdown.Item onClick={() => navigate('/wallets')} className="py-2"><FaHistory className="me-2 text-primary"/> View Wallets</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                  </div>

                  <h2 className="fw-extrabold mb-2">Wealth & Finance</h2>
                  <p className="text-muted small mb-4">Manage your capital, track spending, and grow your net worth.</p>
                  
                  {/* Live Metrics */}
                  <div className="metrics-box p-3 rounded-4 bg-light bg-opacity-50 border mb-4 mt-auto">
                    <Row className="text-center g-0">
                        <Col xs={6} className="border-end">
                            <div className="x-small text-muted text-uppercase fw-bold">Net Worth</div>
                            <div className="h5 fw-bold mb-0 text-primary">{metrics.balance}</div>
                        </Col>
                        <Col xs={6}>
                            <div className="x-small text-muted text-uppercase fw-bold">Status</div>
                            <div className="h5 fw-bold mb-0 text-success">Healthy</div>
                        </Col>
                    </Row>
                  </div>

                  <Button 
                    variant="primary" 
                    className="w-100 py-3 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                    onClick={() => handleSelect('finance', '/dashboard')}
                  >
                    Enter Workspace <FaArrowRight />
                  </Button>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>

          {/* Productivity Portal */}
          <Col lg={5}>
            <motion.div whileHover={{ y: -10 }} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="selection-card h-100 border-0 shadow-lg overflow-hidden position-relative" style={{ borderRadius: '2.5rem', background: 'var(--card-bg)' }}>
                <div className="portal-accent" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}></div>
                
                <Card.Body className="p-4 p-md-5 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div className="icon-wrapper bg-purple bg-opacity-10 text-purple rounded-4 d-flex align-items-center justify-content-center" style={{ width: '70px', height: '70px' }}>
                        <FaTasks size={30} />
                    </div>
                    <Dropdown align="end">
                        <Dropdown.Toggle variant="link" className="p-0 text-muted no-caret"><FaPlus /></Dropdown.Toggle>
                        <Dropdown.Menu className="border-0 shadow-lg rounded-4">
                            <Dropdown.Item onClick={() => { setModule('productivity'); navigate('/planner'); }} className="py-2"><FaPlus className="me-2 text-purple"/> Add Task</Dropdown.Item>
                            <Dropdown.Item onClick={() => navigate('/productivity/habits')} className="py-2"><FaBolt className="me-2 text-purple"/> Log Habit</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                  </div>

                  <h2 className="fw-extrabold mb-2">Focus & Productivity</h2>
                  <p className="text-muted small mb-4">Organize your time, master habits, and achieve your daily goals.</p>
                  
                  {/* Live Metrics */}
                  <div className="metrics-box p-3 rounded-4 bg-light bg-opacity-50 border mb-4 mt-auto">
                    <Row className="text-center g-0">
                        <Col xs={6} className="border-end">
                            <div className="x-small text-muted text-uppercase fw-bold">Pending</div>
                            <div className="h5 fw-bold mb-0 text-purple">{metrics.pendingTasks} Tasks</div>
                        </Col>
                        <Col xs={6}>
                            <div className="x-small text-muted text-uppercase fw-bold">Streak</div>
                            <div className="h5 fw-bold mb-0 text-warning">{metrics.habitStreak} Days</div>
                        </Col>
                    </Row>
                  </div>

                  <Button 
                    className="w-100 py-3 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 bg-purple border-0"
                    onClick={() => handleSelect('productivity', '/planner')}
                  >
                    Enter Workspace <FaArrowRight />
                  </Button>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        <div className="mt-5 text-center">
            <Button variant="link" onClick={() => handleSelect('hybrid', '/overview')} className="text-muted small fw-bold text-decoration-none">
                <FaEllipsisV className="me-2"/> OR VIEW UNIFIED LIFE OVERVIEW
            </Button>
        </div>
      </Container>

      <style>{`
        .text-purple { color: #8b5cf6 !important; }
        .bg-purple { background-color: #8b5cf6 !important; }
        .bg-opacity-10 { --bs-bg-opacity: 0.1; }
        .selection-card { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 1px solid var(--border-color) !important; }
        .selection-card:hover { box-shadow: 0 30px 60px rgba(0,0,0,0.12) !important; }
        .no-caret::after { display: none !important; }
        .x-small { font-size: 0.7rem; }
        .metrics-box { background: var(--bg-color) !important; }
        body.dark-mode .metrics-box { background: rgba(255,255,255,0.03) !important; }
      `}</style>
    </div>
  );
};

export default CategorySelection;

