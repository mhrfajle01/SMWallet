import React, { useMemo } from 'react';
import { Container, Row, Col, Card, ProgressBar, ListGroup, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    FaWallet, FaTasks, FaChartLine, FaCheckCircle, FaFire, 
    FaArrowRight, FaRobot, FaPlus, FaThLarge, FaHistory,
    FaUtensils, FaShoppingCart, FaArrowUp
} from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import { useProductivity } from '../context/ProductivityContext';
import { useUI } from '../context/UIContext';
import { useModule } from '../context/ModuleContext';
import FinancialAvatar from './FinancialAvatar';

const HybridOverview = () => {
  const navigate = useNavigate();
  const { setModule } = useModule();
  const { globalStats, avatarState, meals, purchases, incomes } = useApp();
  const { todos, habits, habitLogs, getDailyProgress } = useProductivity();
  const { openTransactionModal } = useUI();

  const formatCurrency = (amount) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(amount || 0);

  const dailyProgress = useMemo(() => {
    try { return getDailyProgress(); } catch (e) { return 0; }
  }, [getDailyProgress]);

  const recentActivity = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const activity = [
        ...(meals || []).map(m => ({ ...m, actType: 'expense', icon: <FaUtensils className="text-warning"/>, label: m.item, date: m.date })),
        ...(purchases || []).map(p => ({ ...p, actType: 'expense', icon: <FaShoppingCart className="text-danger"/>, label: p.item, date: p.date })),
        ...(incomes || []).map(i => ({ ...i, actType: 'income', icon: <FaArrowUp className="text-success"/>, label: i.source, date: i.date })),
        ...(todos || []).filter(t => t.completed).map(t => ({ ...t, actType: 'todo', icon: <FaCheckCircle className="text-info"/>, label: t.title, date: today }))
    ];
    return activity.sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  }, [meals, purchases, incomes, todos]);

  return (
    <div className="hybrid-overview pb-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="d-flex justify-content-between align-items-center mb-4 px-3 px-md-0">
            <div>
                <h2 className="fw-extrabold mb-1">Unified Life Overview</h2>
                <p className="text-muted small mb-0">Financial health & focus momentum combined</p>
            </div>
            <Button variant="outline-primary" size="sm" className="rounded-pill px-3 fw-bold border-dashed" onClick={() => navigate('/selection')}>
                <FaThLarge className="me-2" /> Switch Workspace
            </Button>
        </div>

        <Row className="g-4">
          {/* Top Integrated Row */}
          <Col lg={8}>
            <FinancialAvatar />
            
            <Row className="g-4 mt-1">
                <Col md={6}>
                    <Card className="dash-card border-0 shadow-sm h-100" style={{ borderRadius: '1.5rem', background: 'var(--card-bg)' }}>
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <small className="text-muted text-uppercase fw-bold x-small">Net Worth</small>
                                    <h3 className="fw-extrabold mb-0 text-primary">{formatCurrency(globalStats.totalBalance)}</h3>
                                </div>
                                <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary"><FaWallet /></div>
                            </div>
                            <Button variant="link" onClick={() => { setModule('finance'); navigate('/dashboard'); }} className="p-0 text-decoration-none small fw-bold">Manage Wealth <FaArrowRight size={12}/></Button>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="dash-card border-0 shadow-sm h-100" style={{ borderRadius: '1.5rem', background: 'var(--card-bg)' }}>
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <small className="text-muted text-uppercase fw-bold x-small">Focus Progress</small>
                                    <h3 className="fw-extrabold mb-0 text-purple">{dailyProgress}%</h3>
                                </div>
                                <div className="bg-purple bg-opacity-10 p-2 rounded-3 text-purple"><FaTasks /></div>
                            </div>
                            <ProgressBar now={dailyProgress} variant="info" style={{ height: '6px' }} className="rounded-pill mb-2" />
                            <Button variant="link" onClick={() => { setModule('productivity'); navigate('/planner'); }} className="p-0 text-decoration-none small fw-bold text-purple">Daily Planner <FaArrowRight size={12}/></Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
          </Col>

          {/* Combined Feed Column */}
          <Col lg={4}>
            <Card className="dash-card border-0 shadow-sm mb-4" style={{ borderRadius: '1.5rem', background: 'var(--card-bg)' }}>
                <Card.Body className="p-4">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                        <FaHistory className="text-primary" /> Recent Life Stream
                    </h6>
                    <ListGroup variant="flush">
                        {recentActivity.map((act, idx) => (
                            <ListGroup.Item key={idx} className="bg-transparent border-0 px-0 py-2 d-flex align-items-center gap-3">
                                <div className="p-2 rounded-3 bg-light bg-opacity-50">
                                    {act.icon}
                                </div>
                                <div className="overflow-hidden">
                                    <div className="small fw-bold text-truncate">{act.label}</div>
                                    <div className="x-small text-muted">{act.actType === 'expense' ? `Spent ${formatCurrency(act.amount)}` : act.actType === 'income' ? `Earned ${formatCurrency(act.amount)}` : 'Completed'}</div>
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </Card.Body>
            </Card>

            <Card className="dash-card border-0 shadow-sm p-4 bg-primary bg-opacity-10 border border-primary border-opacity-25" style={{ borderRadius: '1.5rem' }}>
                <h6 className="fw-bold mb-2 d-flex align-items-center gap-2">
                    <FaRobot className="text-primary" /> Integrated Insight
                </h6>
                <p className="x-small mb-0 text-muted">
                    {dailyProgress > 70 && globalStats.totalSpent < 1000 
                        ? "Perfect Balance! You're staying productive and frugal today. Keep this pace to reach your savings goal 4 days earlier."
                        : "Focus tip: High spending in 'Food' often correlates with missed 'Morning Workout' habits. Try preparing meals tonight!"}
                </p>
            </Card>
          </Col>
        </Row>
      </motion.div>

      <style>{`
        .text-purple { color: #8b5cf6 !important; }
        .bg-purple { background-color: #8b5cf6 !important; }
        .bg-opacity-10 { --bs-bg-opacity: 0.1; }
        .x-small { font-size: 0.7rem; }
        .dash-card { border: 1px solid var(--border-color) !important; }
      `}</style>
    </div>
  );
};

export default HybridOverview;