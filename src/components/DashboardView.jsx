import React, { useState, useMemo } from 'react';
import { Card, Row, Col, ProgressBar, Badge, Button } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { useProductivity } from '../context/ProductivityContext';
import { useUI } from '../context/UIContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaWallet, FaArrowUp, FaArrowDown, FaChartPie, FaCalendarAlt, 
    FaShoppingBasket, FaPlane, FaTasks, FaLightbulb, FaHistory, FaPlus
} from 'react-icons/fa';
import FinancialCalendar from './FinancialCalendar';
import TransactionHistory from './TransactionHistory';
import '../Dashboard.css';

const DashboardView = () => {
  const { globalStats, meals, purchases, wallets, categories, budgets, incomes, transfers, goals } = useApp();
  const { shoppingList, trips, todos } = useProductivity();
  const { openTransactionModal } = useUI();
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'history'

  const formatCurrency = (amount) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(amount || 0);

  // Suggestion #2: Burn Rate Calculation
  const burnRate = useMemo(() => {
    const totalBudget = (budgets || []).reduce((a, c) => a + (Number(c.limit) || 0), 0);
    const spent = globalStats.totalSpent || 0;
    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    
    return {
        percentSpent: totalBudget > 0 ? (spent / totalBudget) * 100 : 0,
        timePercent: (dayOfMonth / daysInMonth) * 100,
        isWarning: totalBudget > 0 && (spent / totalBudget) > (dayOfMonth / daysInMonth)
    };
  }, [budgets, globalStats]);

  // Suggestion #3: Expense breakdown for Donut Chart
  const categoryData = useMemo(() => {
    const data = {};
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `${curYear}-${curMonth}`;
    
    (meals || []).filter(m => m.month === prefix).forEach(m => data['Food'] = (data['Food'] || 0) + Number(m.amount || 0));
    (purchases || []).filter(p => p.month === prefix).forEach(p => {
        const catObj = (categories || []).find(c => c.id === p.category);
        const cat = catObj?.label || p.category || 'Other';
        data[cat] = (data[cat] || 0) + Number(p.amount || 0);
    });
    
    return Object.entries(data).sort((a,b) => b[1] - a[1]).slice(0, 5);
  }, [meals, purchases, categories]);

  // Suggestion #6: Upcoming Logistics Feed
  const upcomingFeed = useMemo(() => {
    const feed = [];
    const today = new Date().toISOString().split('T')[0];

    // Tasks
    todos.filter(t => !t.completed && t.dueDate).forEach(t => {
        feed.push({ type: 'task', title: t.title, date: t.dueDate, priority: t.priority, icon: <FaTasks /> });
    });

    // Trips
    trips.forEach(trip => {
        if (trip.startDate >= today) {
            feed.push({ type: 'trip', title: `Trip: ${trip.name}`, date: trip.startDate, location: trip.location, icon: <FaPlane className="text-primary"/> });
        }
    });

    return feed.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
  }, [todos, trips]);

  return (
    <div className="dash-container pb-5">
      {/* Visual Pulse Header (#1) */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="pulse-header shadow-lg">
          <Row className="align-items-center">
              <Col md={7}>
                  <small className="text-uppercase fw-bold opacity-75 letter-spacing-1">Total Net Worth</small>
                  <h1 className="display-4 fw-extrabold mb-0">{formatCurrency(globalStats.totalBalance)}</h1>
                  <div className="d-flex gap-3 mt-3">
                      <Badge bg="white" text="dark" className="bg-opacity-20 text-white border-0 py-2 px-3 rounded-pill d-flex align-items-center gap-2">
                          {globalStats.comparison.spendChange <= 0 ? <FaArrowDown className="text-success"/> : <FaArrowUp className="text-danger"/>}
                          {Math.abs(Math.round(globalStats.comparison.spendChange))}% spend vs last month
                      </Badge>
                  </div>
              </Col>
              <Col md={5} className="d-none d-md-block">
                  <div className="glass-panel p-3">
                      <h6 className="small fw-bold mb-3 d-flex align-items-center gap-2"><FaLightbulb className="text-warning"/> Smart Insight</h6>
                      <p className="small mb-0 opacity-90">
                          {burnRate.isWarning 
                            ? "You're spending faster than usual this month. Try to cut back on optional purchases." 
                            : "Excellent! Your spending pace is below the month's time progress. Keep it up!"}
                      </p>
                  </div>
              </Col>
          </Row>
      </motion.div>

      {/* Burn Rate Bar (#2) */}
      <Card className="dash-card mb-4 border-0">
          <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 fw-bold prod-title">Budget Burn Rate</h6>
                  <small className="text-muted fw-bold">{Math.round(burnRate.percentSpent)}% Spent</small>
              </div>
              <div className="position-relative py-2">
                  <ProgressBar now={burnRate.percentSpent} variant={burnRate.isWarning ? "danger" : "primary"} style={{ height: '12px' }} className="rounded-pill bg-light" />
                  {/* Time Marker */}
                  <div 
                    className="position-absolute top-0 border-start border-2 border-warning h-100" 
                    style={{ left: `${burnRate.timePercent}%`, zIndex: 5 }}
                    title="Time Progress"
                  >
                      <small className="position-absolute top-100 start-50 translate-middle-x x-small text-warning fw-bold mt-1">Today</small>
                  </div>
              </div>
          </Card.Body>
      </Card>

      <Row className="g-4">
          {/* Expense Heatmap (#3) */}
          <Col lg={7}>
              <Card className="dash-card h-100 border-0">
                  <Card.Header className="bg-transparent border-0 p-4 d-flex justify-content-between align-items-center">
                      <h5 className="mb-0 fw-bold prod-title d-flex align-items-center gap-2"><FaChartPie className="text-primary"/> Top Expenses</h5>
                      <Button variant="link" size="sm" className="text-decoration-none p-0 text-primary fw-bold" onClick={() => setViewMode('history')}>Full History</Button>
                  </Card.Header>
                  <Card.Body className="px-4 pb-4 pt-0">
                      <Row className="align-items-center">
                          <Col md={5} className="text-center">
                              <svg width="160" height="160" viewBox="0 0 42 42" className="donut">
                                  <circle className="donut-hole" cx="21" cy="21" r="15.915" fill="transparent"></circle>
                                  <circle className="donut-ring" cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="3"></circle>
                                  <circle 
                                    className="donut-segment" cx="21" cy="21" r="15.915" 
                                    fill="transparent" stroke="#6366f1" strokeWidth="3" 
                                    strokeDasharray={`${burnRate.percentSpent} ${100 - burnRate.percentSpent}`} 
                                    strokeDashoffset="25"
                                  ></circle>
                                  <g className="chart-text">
                                      <text x="50%" y="50%" className="chart-number" textAnchor="middle" dy=".3em" style={{ fontSize: '0.4rem', fontWeight: 'bold', fill: 'var(--text-primary)' }}>
                                          {Math.round(burnRate.percentSpent)}%
                                      </text>
                                  </g>
                              </svg>
                          </Col>
                          <Col md={7}>
                              <div className="d-flex flex-column gap-3">
                                  {categoryData.map(([cat, amt], idx) => (
                                      <div key={idx} className="d-flex justify-content-between align-items-center">
                                          <div className="d-flex align-items-center gap-2">
                                              <div className="rounded-circle" style={{ width: '8px', height: '8px', background: idx === 0 ? '#6366f1' : idx === 1 ? '#10b981' : '#f59e0b' }} />
                                              <span className="small fw-bold prod-title">{cat}</span>
                                          </div>
                                          <span className="small fw-bold">{formatCurrency(amt)}</span>
                                      </div>
                                  ))}
                                  {categoryData.length === 0 && <p className="text-center text-muted small py-4">No data for this month</p>}
                              </div>
                          </Col>
                      </Row>
                  </Card.Body>
              </Card>
          </Col>

          {/* Upcoming Logistics (#6) */}
          <Col lg={5}>
              <Card className="dash-card h-100 border-0">
                  <Card.Header className="bg-transparent border-0 p-4">
                      <h5 className="mb-0 fw-bold prod-title d-flex align-items-center gap-2"><FaCalendarAlt className="text-indigo" style={{ color: '#6366f1' }}/> Next 7 Days</h5>
                  </Card.Header>
                  <Card.Body className="px-4 pb-4 pt-0">
                      {upcomingFeed.length > 0 ? (
                          upcomingFeed.map((item, idx) => (
                              <div key={idx} className={`feed-item ${item.priority === 'High' ? 'high' : ''} ${item.type === 'trip' ? 'money' : ''}`}>
                                  <div className="d-flex justify-content-between align-items-start">
                                      <div className="d-flex align-items-center gap-2">
                                          {item.icon}
                                          <span className="small fw-bold prod-title">{item.title}</span>
                                      </div>
                                      <Badge bg="light" text="dark" className="border shadow-xs x-small">{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Badge>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="text-center py-5 opacity-50">
                              <FaHistory size={32} className="mb-2" />
                              <p className="small mb-0">No upcoming events</p>
                          </div>
                      )}
                  </Card.Body>
              </Card>
          </Col>
      </Row>

      <div className="mt-4">
          <div className="d-flex justify-content-center gap-3 mb-4 bg-light p-1 rounded-pill mx-auto shadow-sm" style={{ width: 'fit-content' }}>
              <Button variant={viewMode === 'overview' ? 'primary' : 'light'} size="sm" className="rounded-pill px-4" onClick={() => setViewMode('overview')}>Visual Overview</Button>
              <Button variant={viewMode === 'history' ? 'primary' : 'light'} size="sm" className="rounded-pill px-4" onClick={() => setViewMode('history')}>Detailed History</Button>
          </div>

          <AnimatePresence mode="wait">
              {viewMode === 'overview' ? (
                  <motion.div key="cal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <FinancialCalendar 
                        meals={meals} 
                        purchases={purchases} 
                        goals={goals} 
                        transfers={transfers}
                        incomes={incomes}
                      />
                  </motion.div>
              ) : (
                  <motion.div key="his" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <TransactionHistory />
                  </motion.div>
              )}
          </AnimatePresence>
      </div>

      {/* Suggestion #10: Command FAB */}
      <motion.button 
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        className="prod-fab d-lg-none" 
        onClick={() => openTransactionModal()}
      >
          <FaPlus />
      </motion.button>

      <style>{`
        .letter-spacing-1 { letter-spacing: 1px; }
        .fw-extrabold { font-weight: 800; }
        .x-small { font-size: 0.65rem; }
        .shadow-xs { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
      `}</style>
    </div>
  );
};

export default DashboardView;
