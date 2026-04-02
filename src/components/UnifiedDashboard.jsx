import React, { useMemo } from 'react';
import { Card, Row, Col, Button, ProgressBar, Badge, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useProductivity } from '../context/ProductivityContext';
import { useUI } from '../context/UIContext';
import { motion } from 'framer-motion';
import { 
    FaWallet, FaTasks, FaPlus, FaCheckCircle, FaPiggyBank, 
    FaChartLine, FaRobot, FaFire, FaChartPie, FaHistory,
    FaArrowRight, FaArrowUp, FaArrowDown, FaLightbulb,
    FaUtensils, FaShoppingCart, FaCheck, FaClock, FaStar
} from 'react-icons/fa';
import FinancialAvatar from './FinancialAvatar';
import CheckInCalendar from './CheckInCalendar';
import { getLocalISO } from '../utils/dateUtils';

const UnifiedDashboard = () => {
  const navigate = useNavigate();
  const { globalStats, avatarState, budgets, goals, meals, purchases, incomes, sessionSeconds, hasTransactionToday } = useApp();
  const { todos, habits, habitLogs, waterStats, getDailyProgress } = useProductivity();
  const { openTransactionModal } = useUI();

  const todayStr = getLocalISO();

  const formatCurrency = (amount) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(amount || 0);

  const dailyProgress = useMemo(() => {
    try {
        return getDailyProgress();
    } catch (e) {
        return 0;
    }
  }, [getDailyProgress]);

  const burnRate = useMemo(() => {
    const totalBudget = (budgets || []).reduce((a, c) => a + (Number(c.limit) || 0), 0);
    const spent = globalStats?.totalSpent || 0;
    return totalBudget > 0 ? Math.min(100, (spent / totalBudget) * 100) : 0;
  }, [budgets, globalStats]);

  const topPriorities = useMemo(() => {
    const pendingTodos = (todos || []).filter(t => !t.completed).slice(0, 3);
    const activeHabits = (habits || []).filter(h => !habitLogs.some(l => l.habitId === h.id && l.date === todayStr && l.status)).slice(0, 2);
    return [
        ...pendingTodos.map(t => ({ ...t, type: 'todo', displayTitle: t.title || 'Untitled Task' })), 
        ...activeHabits.map(h => ({ ...h, type: 'habit', displayTitle: h.title || 'Daily Habit' }))
    ];
  }, [todos, habits, habitLogs, todayStr]);

  const recentActivity = useMemo(() => {
    try {
        const activity = [
            ...(meals || []).map(m => ({ ...m, actType: 'expense', icon: <FaUtensils className="text-warning"/>, label: m.item || 'Meal', date: m.date || todayStr })),
            ...(purchases || []).map(p => ({ ...p, actType: 'expense', icon: <FaShoppingCart className="text-danger"/>, label: p.item || 'Purchase', date: p.date || todayStr })),
            ...(incomes || []).map(i => ({ ...i, actType: 'income', icon: <FaArrowUp className="text-success"/>, label: i.source || 'Income', date: i.date || todayStr })),
            ...(todos || []).filter(t => t.completed).map(t => {
                let d = todayStr;
                if (t.updatedAt?.toDate) d = t.updatedAt.toDate().toISOString();
                else if (t.createdAt?.toDate) d = t.createdAt.toDate().toISOString();
                return { ...t, actType: 'todo', icon: <FaCheckCircle className="text-info"/>, label: t.title || 'Completed Task', date: d };
            })
        ];
        return activity
            .filter(a => a.date)
            .sort((a,b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
    } catch (e) {
        console.error("Recent Activity Error:", e);
        return [];
    }
  }, [meals, purchases, incomes, todos, todayStr]);

  const primaryGoal = useMemo(() => {
    return (goals || []).find(g => !g.completed) || goals[0];
  }, [goals]);

  return (
    <div className="unified-dash pb-5 px-3 px-md-0">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        
        {/* Top Hero Section: Split Finance & Productivity */}
        <Row className="g-4 mb-4">
          <Col lg={6}>
            <div className="hero-card finance shadow-sm p-4 h-100" style={{ background: 'var(--primary-gradient)', borderRadius: '2rem' }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <small className="text-white opacity-75 text-uppercase fw-bold letter-spacing-1">Net Worth</small>
                  <h1 className="display-5 fw-bold text-white mb-0">{formatCurrency(globalStats?.totalBalance)}</h1>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-circle text-white">
                  <FaWallet size={24} />
                </div>
              </div>
              <div className="d-flex gap-3 align-items-center mt-4">
                <div className="small text-white fw-medium">
                  {globalStats?.comparison?.spendChange <= 0 ? <FaArrowDown className="text-success me-1"/> : <FaArrowUp className="text-danger me-1"/>}
                  {Math.abs(Math.round(globalStats?.comparison?.spendChange || 0))}% vs last month
                </div>
                <Button variant="light" size="sm" className="rounded-pill px-3 fw-bold ms-auto" onClick={() => navigate('/wallets')}>Manage</Button>
              </div>
            </div>
          </Col>
          <Col lg={6}>
            <div className="hero-card productivity shadow-sm p-4 h-100" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', borderRadius: '2rem' }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <small className="text-white opacity-75 text-uppercase fw-bold letter-spacing-1">Daily Progress</small>
                  <h1 className="display-5 fw-bold text-white mb-0">{dailyProgress}%</h1>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-circle text-white">
                  <FaCheckCircle size={24} />
                </div>
              </div>
              <div className="mt-4">
                <ProgressBar now={dailyProgress} variant="info" style={{ height: '10px', background: 'rgba(255,255,255,0.1)' }} className="rounded-pill mb-3" />
                <div className="d-flex justify-content-between align-items-center">
                  <div className="small text-white fw-medium">Keep it up! {avatarState?.streak || 0} day streak</div>
                  <Button variant="light" size="sm" className="rounded-pill px-3 fw-bold" onClick={() => navigate('/planner')}>Focus</Button>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Quick Action Launchpad */}
        <div className="launchpad mb-4 d-flex gap-3 pb-2 overflow-auto" style={{ scrollbarWidth: 'none' }}>
          <Button variant="primary" className="launch-btn flex-shrink-0" onClick={() => openTransactionModal()}>
            <FaPlus className="me-2" /> Log Expense
          </Button>
          <Button variant="outline-primary" className="launch-btn flex-shrink-0" onClick={() => navigate('/planner')}>
            <FaTasks className="me-2" /> New Task
          </Button>
          <Button variant="outline-info" className="launch-btn flex-shrink-0" onClick={() => navigate('/goals')}>
            <FaPiggyBank className="me-2" /> Save Goal
          </Button>
          <Button variant="outline-secondary" className="launch-btn flex-shrink-0" onClick={() => navigate('/history')}>
            <FaHistory className="me-2" /> History
          </Button>
        </div>

        {/* Main Content Grid */}
        <Row className="g-4">
          <Col lg={8}>
            {/* Character Hub */}
            <FinancialAvatar />

            {/* Selection Hub Cards */}
            <Row className="g-4 mb-4">
              <Col md={6}>
                <Card className="selection-card border-0 shadow-sm h-100" onClick={() => navigate('/wallets')}>
                  <Card.Body className="p-4 text-center">
                    <div className="icon-box bg-success bg-opacity-10 text-success mb-3 mx-auto">
                      <FaWallet size={24} />
                    </div>
                    <h6 className="fw-bold">Finance & Wealth</h6>
                    <p className="x-small text-muted mb-3">Track wallets, assets, and liabilities</p>
                    <FaArrowRight className="text-primary" />
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="selection-card border-0 shadow-sm h-100" onClick={() => navigate('/planner')}>
                  <Card.Body className="p-4 text-center">
                    <div className="icon-box bg-primary bg-opacity-10 text-primary mb-3 mx-auto">
                      <FaTasks size={24} />
                    </div>
                    <h6 className="fw-bold">Daily Productivity</h6>
                    <p className="x-small text-muted mb-3">Manage tasks, habits, and notes</p>
                    <FaArrowRight className="text-primary" />
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Today's Snapshot Widget */}
            <Card className="dash-card border-0 shadow-sm mb-4" style={{ borderRadius: '1.5rem', background: 'var(--card-bg)' }}>
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                  <FaChartLine className="text-primary" /> Today's Snapshot
                </h5>
                <Row className="g-4">
                  <Col md={6}>
                    <div className="snapshot-item p-3 rounded-4 bg-light bg-opacity-10 border">
                      <div className="d-flex justify-content-between mb-2">
                        <small className="fw-bold text-muted">Budget Burned</small>
                        <small className="fw-bold text-primary">{Math.round(burnRate)}%</small>
                      </div>
                      <ProgressBar now={burnRate} variant={burnRate > 80 ? 'danger' : 'primary'} style={{ height: '8px' }} className="rounded-pill" />
                      <p className="x-small text-muted mt-2 mb-0">Monthly budget utilization</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="snapshot-item p-3 rounded-4 bg-light bg-opacity-10 border">
                      <div className="d-flex justify-content-between mb-2">
                        <small className="fw-bold text-muted">Hydration</small>
                        <small className="fw-bold text-info">{waterStats?.current || 0} / {waterStats?.goal || 8} Glasses</small>
                      </div>
                      <ProgressBar now={((waterStats?.current || 0) / (waterStats?.goal || 8)) * 100} variant="info" style={{ height: '8px' }} className="rounded-pill" />
                      <p className="x-small text-muted mt-2 mb-0">Daily water intake goal</p>
                    </div>
                  </Col>
                </Row>
                
                <div className="ai-insight mt-4 p-3 rounded-4 bg-primary bg-opacity-10 border border-primary border-opacity-25 d-flex gap-3 align-items-center">
                  <div className="bg-primary p-2 rounded-circle text-white">
                    <FaRobot />
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="fw-bold mb-1 small">AI Recommendation</h6>
                    <p className="x-small mb-0 text-muted">
                      {burnRate > 70 ? "Your spending is high. Consider pausing non-essential shopping today." : "Great job! Your budget is healthy. Why not put ৳500 into your Savings Goal?"}
                    </p>
                  </div>
                  <Button variant="link" size="sm" className="p-0 text-primary fw-bold text-decoration-none">Ask AI</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            {/* Daily Check-in Widget */}
            <CheckInCalendar 
                history={avatarState?.checkInHistory || []} 
                streak={avatarState?.streak || 0} 
                sessionSeconds={sessionSeconds || 0} 
                hasTransactionToday={hasTransactionToday}
            />

            {/* Daily Priorities */}
            <Card className="dash-card border-0 shadow-sm mb-4" style={{ borderRadius: '1.5rem', background: 'var(--card-bg)' }}>
                <Card.Body className="p-4">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                        <FaStar className="text-warning" /> Daily Priorities
                    </h6>
                    {topPriorities.length > 0 ? (
                        <ListGroup variant="flush">
                            {topPriorities.map((item, idx) => (
                                <ListGroup.Item key={idx} className="bg-transparent border-0 px-0 py-2 d-flex align-items-center gap-3">
                                    <div className={`p-2 rounded-3 bg-opacity-10 ${item.type === 'todo' ? 'bg-info text-info' : 'bg-success text-success'}`}>
                                        {item.type === 'todo' ? <FaTasks size={14}/> : <FaFire size={14}/>}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="small fw-bold text-truncate">{item.displayTitle}</div>
                                        <div className="x-small text-muted">{item.type === 'todo' ? 'Priority Task' : 'Daily Habit'}</div>
                                    </div>
                                    <Button variant="link" size="sm" className="ms-auto p-0 text-muted" onClick={() => navigate('/planner')}><FaArrowRight size={12}/></Button>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    ) : (
                        <p className="small text-muted text-center py-3">All clear! No pending priorities.</p>
                    )}
                </Card.Body>
            </Card>

            {/* Savings Goal Progress */}
            {primaryGoal && (
                <Card className="dash-card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '1.5rem', background: 'var(--card-bg)' }}>
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                        <FaPiggyBank className="text-info" /> Savings Target
                    </h6>
                    <div className="d-flex justify-content-between mb-2">
                        <span className="small fw-bold text-truncate me-2">{primaryGoal.name}</span>
                        <span className="small fw-bold text-info">{Math.round(((primaryGoal.savedAmount || 0) / (primaryGoal.targetAmount || 1)) * 100)}%</span>
                    </div>
                    <ProgressBar now={((primaryGoal.savedAmount || 0) / (primaryGoal.targetAmount || 1)) * 100} variant="info" style={{ height: '8px' }} className="rounded-pill mb-3" />
                    <div className="d-flex justify-content-between x-small text-muted fw-medium">
                        <span>{formatCurrency(primaryGoal.savedAmount)}</span>
                        <span>{formatCurrency(primaryGoal.targetAmount)}</span>
                    </div>
                    <Button variant="outline-info" size="sm" className="w-100 rounded-pill mt-3 fw-bold" onClick={() => navigate('/goals')}>Add Savings</Button>
                </Card>
            )}

            {/* Recent Activity */}
            <Card className="dash-card border-0 shadow-sm mb-4" style={{ borderRadius: '1.5rem', background: 'var(--card-bg)' }}>
                <Card.Body className="p-4">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                        <FaClock className="text-primary" /> Recent Activity
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

            <Card className="dash-card border-0 shadow-sm p-4" style={{ borderRadius: '1.5rem', background: 'var(--card-bg)' }}>
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <FaLightbulb className="text-warning" /> Pro Tip
              </h6>
              <p className="small text-muted mb-0">Syncing your finance and productivity tools leads to 40% more savings! Check your <strong>Daily Hub</strong> regularly.</p>
            </Card>
          </Col>
        </Row>

      </motion.div>

      <style>{`
        .hero-card { transition: transform 0.3s ease; cursor: pointer; }
        .hero-card:hover { transform: translateY(-5px); }
        .letter-spacing-1 { letter-spacing: 1px; }
        .launch-btn { 
          padding: 0.8rem 1.5rem; 
          border-radius: 1rem; 
          font-weight: bold;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }
        .launch-btn:hover { transform: scale(1.05); }
        .selection-card { 
          border-radius: 1.5rem; 
          cursor: pointer; 
          transition: all 0.3s ease;
          border: 1px solid var(--border-color) !important;
          background: var(--card-bg);
        }
        .selection-card:hover { transform: translateY(-5px); border-color: var(--primary-color) !important; }
        .icon-box {
          width: 50px;
          height: 50px;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .x-small { font-size: 0.75rem; }
        .list-group-item { transition: all 0.2s ease; }
        .list-group-item:hover { background: rgba(0,0,0,0.02) !important; }
      `}</style>
    </div>
  );
};

export default UnifiedDashboard;