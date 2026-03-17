import React, { useState, useMemo, useEffect } from 'react';
import { Card, Row, Col, ProgressBar, Badge, Button } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { useProductivity } from '../context/ProductivityContext';
import { useUI } from '../context/UIContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaWallet, FaArrowUp, FaArrowDown, FaChartPie, FaCalendarAlt, 
    FaShoppingBasket, FaPlane, FaTasks, FaLightbulb, FaHistory, FaPlus, FaMobileAlt, FaDownload
} from 'react-icons/fa';
import FinancialCalendar from './FinancialCalendar';
import TransactionHistory from './TransactionHistory';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import '../Dashboard.css';

// Hook to handle PWA Installation
const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  return { isInstallable, installApp };
};

const DashboardView = () => {
  const { isInstallable, installApp } = usePWAInstall();
  const { globalStats, meals, purchases, wallets, categories, budgets, incomes, transfers, goals, avatarState } = useApp();
  const { shoppingList, trips, todos, habitLogs } = useProductivity();
  const { openTransactionModal } = useUI();
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'history'

  const formatCurrency = (amount) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(amount || 0);

  // Burn Rate Calculation
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

  // Expense breakdown for Donut Chart
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
    
    const sorted = Object.entries(data).sort((a,b) => b[1] - a[1]).slice(0, 5);
    const total = sorted.reduce((acc, curr) => acc + curr[1], 0);
    
    return { 
        items: sorted, 
        total,
        topPercent: total > 0 ? (sorted[0][1] / total) * 100 : 0
    };
  }, [meals, purchases, categories]);

  // Upcoming Logistics Feed
  const upcomingFeed = useMemo(() => {
    const feed = [];
    const today = new Date().toISOString().split('T')[0];

    (todos || []).filter(t => !t.completed && t.dueDate === today).forEach(t => feed.push({ type: 'task', label: t.title, icon: <FaTasks className="text-info"/> }));
    
    (budgets || []).forEach(b => {
        const spent = globalStats.totalSpent;
        if (spent > Number(b.limit) * 0.8) feed.push({ type: 'budget', label: `Low budget: ${categories.find(c => c.id === b.categoryId)?.label}`, icon: <FaLightbulb className="text-warning"/> });
    });

    return feed.slice(0, 3);
  }, [todos, budgets, globalStats, categories]);

  if (viewMode === 'history') return <TransactionHistory />;

  return (
    <div className="dash-container pb-5">
      
      {/* Visual Pulse Header (#1) */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="pulse-header shadow-lg mb-4">
          <Row className="align-items-center">
              <Col md={7}>
                  <small className="text-uppercase fw-bold text-white opacity-90 letter-spacing-1">Total Net Worth</small>
                  <h1 className="display-4 fw-extrabold mb-0 text-white">{formatCurrency(globalStats.totalBalance)}</h1>
                  <div className="d-flex gap-3 mt-3">
                      <div className="bg-white bg-opacity-25 text-white border-0 py-2 px-3 rounded-pill d-flex align-items-center gap-2 small fw-bold shadow-sm" style={{ backdropFilter: 'blur(5px)' }}>
                          {globalStats.comparison.spendChange <= 0 ? <FaArrowDown className="text-success" style={{ filter: 'brightness(1.5)' }}/> : <FaArrowUp className="text-danger" style={{ filter: 'brightness(1.5)' }}/>}
                          {Math.abs(Math.round(globalStats.comparison.spendChange))}% spend vs last month
                      </div>
                  </div>
              </Col>
              <Col md={5} className="d-none d-md-block">
                  <div className="glass-panel p-3">
                      <h6 className="small fw-bold mb-3 d-flex align-items-center gap-2 text-white"><FaLightbulb className="text-warning"/> Smart Insight</h6>
                      <p className="small mb-0 text-white fw-medium opacity-90">
                          {burnRate.isWarning 
                            ? "You're spending faster than usual this month. Try to cut back on optional purchases." 
                            : "Excellent! Your spending pace is below the month's time progress. Keep it up!"}
                      </p>
                  </div>
              </Col>
          </Row>
      </motion.div>

      {/* Burn Rate Bar (#2) */}
      <Card className="dash-card mb-4 border-0 shadow-sm">
          <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 fw-bold prod-title">Budget Burn Rate</h6>
                  <small className="text-primary fw-extrabold" style={{ fontSize: '0.9rem' }}>{Math.round(burnRate.percentSpent)}% Spent</small>
              </div>
              <div className="position-relative py-2">
                  <ProgressBar now={burnRate.percentSpent} variant={burnRate.isWarning ? "danger" : "primary"} style={{ height: '12px', background: 'var(--bg-color)' }} className="rounded-pill border shadow-inner" />
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
                                    strokeDasharray={`${categoryData.topPercent} ${100 - categoryData.topPercent}`} 
                                    strokeDashoffset="25"
                                  ></circle>
                                  <g className="chart-text">
                                      <text x="50%" y="50%" className="chart-number" textAnchor="middle" dy=".3em" style={{ fontSize: '0.4rem', fontWeight: 'bold', fill: 'var(--text-primary)' }}>
                                          {Math.round(categoryData.topPercent)}%
                                      </text>
                                  </g>
                              </svg>
                          </Col>
                          <Col md={7}>
                              <div className="d-flex flex-column gap-3">
                                  {categoryData.items.map(([cat, amt], idx) => (
                                      <div key={idx} className="d-flex justify-content-between align-items-center">
                                          <div className="d-flex align-items-center gap-2">
                                              <div className="rounded-circle" style={{ width: '8px', height: '8px', background: idx === 0 ? '#6366f1' : idx === 1 ? '#10b981' : '#f59e0b' }} />
                                              <span className="small fw-bold prod-title">{cat}</span>
                                          </div>
                                          <span className="small fw-bold">{formatCurrency(amt)}</span>
                                      </div>
                                  ))}
                                  {categoryData.items.length === 0 && <p className="text-center text-muted small py-4">No data for this month</p>}
                              </div>
                          </Col>
                      </Row>
                  </Card.Body>
              </Card>
          </Col>

          {/* Quick Shortcuts (#4) */}
          <Col lg={5}>
              <Card className="dash-card h-100 border-0">
                  <Card.Header className="bg-transparent border-0 p-4">
                      <h5 className="mb-0 fw-bold prod-title d-flex align-items-center gap-2"><FaPlus className="text-primary"/> Quick Actions</h5>
                  </Card.Header>
                  <Card.Body className="p-4 pt-0">
                      <div className="d-grid gap-3">
                          <Button variant="primary" className="btn-primary-custom py-3 fw-bold shadow-sm d-flex align-items-center justify-content-between" onClick={() => openTransactionModal()}>
                              <span>Log Transaction</span>
                              <FaPlus />
                          </Button>
                          
                          {isInstallable && (
                              <Button 
                                variant="outline-success" 
                                className="py-3 fw-bold shadow-sm d-flex align-items-center justify-content-between border-2" 
                                onClick={installApp}
                                style={{ borderRadius: '1rem' }}
                              >
                                  <div className="d-flex align-items-center gap-2">
                                      <FaMobileAlt />
                                      <span>Install SMWallet PRO</span>
                                  </div>
                                  <FaDownload />
                              </Button>
                          )}
                          <div className="row g-3">
                              {upcomingFeed.map((item, i) => (
                                  <div key={i} className="col-12">
                                      <div className="p-3 rounded-4 bg-light bg-opacity-10 border border-light d-flex align-items-center gap-3">
                                          {item.icon}
                                          <span className="small fw-bold">{item.label}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </Card.Body>
              </Card>
          </Col>
      </Row>

      <div className="mt-4">
          <div className="d-flex justify-content-center gap-3 mb-4 p-1 rounded-pill mx-auto shadow-sm" style={{ width: 'fit-content', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <Button variant={viewMode === 'overview' ? 'primary' : 'light'} size="sm" className="rounded-pill px-4 border-0" style={{ background: viewMode === 'overview' ? 'var(--primary-gradient)' : 'transparent', color: viewMode === 'overview' ? 'white' : 'var(--text-secondary)' }} onClick={() => setViewMode('overview')}>Visual Overview</Button>
              <Button variant={viewMode === 'history' ? 'primary' : 'light'} size="sm" className="rounded-pill px-4 border-0" style={{ background: viewMode === 'history' ? 'var(--primary-gradient)' : 'transparent', color: viewMode === 'history' ? 'white' : 'var(--text-secondary)' }} onClick={() => setViewMode('history')}>Detailed History</Button>
          </div>

          <AnimatePresence mode="wait">
              {viewMode === 'overview' ? (
                  <motion.div key="cal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <FinancialCalendar 
                        meals={meals} 
                        purchases={purchases} 
                        incomes={incomes} 
                      />
                  </motion.div>
              ) : null}
          </AnimatePresence>
      </div>

      <style>{`
        .pulse-header {
            background: var(--primary-gradient);
            padding: 2.5rem;
            border-radius: 2rem;
            color: white;
        }
        .glass-panel {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            border-radius: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .donut { margin: 0 auto; }
        .donut-segment {
            stroke-dasharray: 0 100;
            transition: stroke-dasharray 1s ease-out;
        }
        .letter-spacing-1 { letter-spacing: 1px; }
        .fw-extrabold { font-weight: 800; }
        .x-small { font-size: 0.65rem; }
        .shadow-xs { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
      `}</style>
    </div>
  );
};

export default DashboardView;