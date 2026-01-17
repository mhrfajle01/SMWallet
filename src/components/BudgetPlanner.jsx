import React, { useState, useMemo } from 'react';
import { Row, Col, Card, ProgressBar, Button, Form, Modal, Badge } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaEdit, FaInfoCircle, FaBus, FaPlus, FaTrash } from 'react-icons/fa';

const BudgetPlanner = () => {
  const { budgets, meals, purchases, updateBudget, incomes, categories, addCategory, deleteCategory } = useApp();
  const { isDarkMode } = useTheme();
  const [editingBudget, setEditingBudget] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newLimit, setNewLimit] = useState('');
  
  // New Category State
  const [catLabel, setCatLabel] = useState('');
  const [catIcon, setCatIcon] = useState('📦');
  const [catColor, setCatColor] = useState('#64748b');

  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysPassed = now.getDate();
  const daysLeft = daysInMonth - daysPassed + 1;
  const monthProgress = (daysPassed / daysInMonth) * 100;

  const budgetStats = useMemo(() => {
    const stats = {};
    let totalLimit = 0;
    let totalSpent = 0;
    
    // Initialize stats based on dynamic categories
    categories.forEach(cat => {
      stats[cat.id] = { spent: 0, limit: 0, ...cat };
    });

    // Sum Meals (All meals count towards Food)
    meals.filter(m => m.month === currentMonth).forEach(m => {
      if (stats['Food']) {
        stats['Food'].spent += Number(m.amount);
      }
    });

    // Sum Purchases by Category
    purchases.filter(p => p.month === currentMonth).forEach(p => {
      const catId = p.category;
      if (stats[catId]) {
        stats[catId].spent += Number(p.amount);
      }
    });

    // Add Limits from Firestore
    budgets.forEach(b => {
      if (stats[b.id]) {
        stats[b.id].limit = Number(b.limit);
        totalLimit += Number(b.limit);
      }
    });

    Object.values(stats).forEach(s => totalSpent += s.spent);

    const monthlyIncome = incomes
      .filter(i => i.date?.startsWith(currentMonth))
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const projectedSpend = daysPassed > 0 ? (totalSpent / daysPassed) * daysInMonth : 0;
    const isProjectedOver = totalLimit > 0 && projectedSpend > totalLimit;

    return { 
      categories: stats, 
      totalLimit, 
      totalSpent, 
      monthlyIncome,
      projectedSpend,
      isProjectedOver
    };
  }, [budgets, meals, purchases, incomes, categories, currentMonth, daysPassed, daysInMonth]);

  const handleEditBudget = (cat) => {
    setEditingBudget(cat);
    setNewLimit(budgetStats.categories[cat.id].limit || '');
    setShowBudgetModal(true);
  };

  const handleSaveBudget = async () => {
    await updateBudget(editingBudget.id, newLimit);
    setShowBudgetModal(false);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!catLabel) return;
    await addCategory(catLabel, catIcon, catColor);
    setCatLabel('');
    setShowAddCatModal(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-5 px-2 px-md-0"
    >
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1">Budget Planner</h4>
          <p className="text-muted small mb-0">Track and plan your monthly spending</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="primary" className="btn-primary-custom d-flex align-items-center gap-2" onClick={() => setShowAddCatModal(true)}>
            <FaPlus size={12} /> Add Category
          </Button>
          <div className="glass-pill text-primary border-primary bg-primary bg-opacity-10 py-2 px-4 shadow-sm">
            <span className="fw-bold">{now.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Summary Dashboard */}
      <Card className="custom-card border-0 mb-4 shadow-sm overflow-hidden" 
        style={{ background: isDarkMode ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' }}>
        <Card.Body className="p-4">
          <Row className="align-items-center">
            <Col md={4} className={`mb-3 mb-md-0 ${!isDarkMode ? 'border-end-md' : ''}`} style={{ borderRight: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '' }}>
              <div className="text-muted small fw-bold text-uppercase mb-1">Total Budget Progress</div>
              <h3 className="fw-bold mb-2">
                {formatCurrency(budgetStats.totalSpent)}
                <span className="text-muted fs-6 fw-normal"> / {formatCurrency(budgetStats.totalLimit)}</span>
              </h3>
              <ProgressBar 
                now={budgetStats.totalLimit > 0 ? (budgetStats.totalSpent / budgetStats.totalLimit) * 100 : 0} 
                variant={budgetStats.totalSpent > budgetStats.totalLimit ? 'danger' : 'primary'}
                className="rounded-pill"
                style={{ height: '8px', backgroundColor: isDarkMode ? '#334155' : '#e9ecef' }}
              />
            </Col>
            <Col md={4} className={`mb-3 mb-md-0 text-center ${!isDarkMode ? 'border-end-md' : ''}`} style={{ borderRight: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '' }}>
              <div className="text-muted small fw-bold text-uppercase mb-1">Projected Spend</div>
              <div className={`fs-4 fw-bold ${budgetStats.isProjectedOver ? 'text-danger' : 'text-success'}`}>
                {formatCurrency(budgetStats.projectedSpend)}
              </div>
              <small className="text-muted">{budgetStats.isProjectedOver ? '⚠️ Likely to exceed' : '✅ On track'}</small>
            </Col>
            <Col md={4} className="text-md-end text-center">
              <div className="text-muted small fw-bold text-uppercase mb-1">Budget Allocation</div>
              <div className="fs-5 fw-bold text-primary">
                {budgetStats.monthlyIncome > 0 ? `${Math.round((budgetStats.totalLimit / budgetStats.monthlyIncome) * 100)}%` : '0%'}
              </div>
              <small className="text-muted">of income assigned</small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row>
        {Object.values(budgetStats.categories).map((cat) => {
          const progress = cat.limit > 0 ? (cat.spent / cat.limit) * 100 : 0;
          const remaining = cat.limit - cat.spent;
          const isOver = remaining < 0;
          const dailySafe = remaining > 0 ? remaining / daysLeft : 0;
          const isSpendingFast = progress > monthProgress && cat.limit > 0;

          return (
            <Col key={cat.id} lg={6} className="mb-4">
              <Card className="custom-card border-0 h-100 overflow-hidden shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center">
                      <div className={`fs-3 me-3 d-flex align-items-center justify-content-center rounded-circle ${isDarkMode ? 'bg-white bg-opacity-10' : 'bg-light'}`} style={{ width: '50px', height: '50px', color: cat.color }}>
                        {cat.icon}
                      </div>
                      <div>
                        <h5 className="fw-bold mb-0">{cat.label}</h5>
                        {isOver ? <Badge bg="danger" className="small rounded-pill">Over Budget 🚨</Badge> : isSpendingFast && <Badge bg="warning" text="dark" className="small rounded-pill">Spending Fast ⚠️</Badge>}
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <Button variant="light" size="sm" className="rounded-circle" onClick={() => handleEditBudget(cat)}>
                        <FaEdit size={14} className="text-primary" />
                      </Button>
                      <Button variant="light" size="sm" className="rounded-circle" onClick={() => deleteCategory(cat.dbId, cat.id)}>
                        <FaTrash size={12} className="text-danger" />
                      </Button>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-end mb-2">
                    <div>
                      <div className="text-muted small">Spent</div>
                      <span className="fw-bold fs-4">{formatCurrency(cat.spent)}</span>
                    </div>
                    <div className="text-end">
                      <div className="text-muted small">Budget Limit</div>
                      <span className="fw-medium">{cat.limit > 0 ? formatCurrency(cat.limit) : 'Not Set'}</span>
                    </div>
                  </div>

                  <ProgressBar 
                    now={Math.min(progress, 100)} 
                    variant={isOver ? 'danger' : progress > 80 ? 'warning' : 'success'} 
                    className="rounded-pill mb-4" 
                    style={{ height: '10px', backgroundColor: isDarkMode ? '#334155' : '#e9ecef' }} 
                  />

                  <Row className="g-2">
                    <Col xs={6}>
                      <div className={`p-3 rounded-4 h-100 ${isOver ? 'bg-danger bg-opacity-10 text-danger' : isDarkMode ? 'bg-white bg-opacity-5 text-secondary' : 'bg-light text-secondary'}`}>
                        <div className="small fw-bold text-uppercase opacity-75 mb-1" style={{ fontSize: '0.65rem' }}>{isOver ? 'Deficit' : 'Remaining'}</div>
                        <div className="fw-bold text-primary">{formatCurrency(Math.abs(remaining))}</div>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className={`p-3 rounded-4 h-100 border border-opacity-10 ${dailySafe > 0 ? 'bg-primary bg-opacity-10 text-primary border-primary' : 'bg-secondary bg-opacity-10 text-secondary border-secondary'}`}>
                        <div className="small fw-bold text-uppercase opacity-75 mb-1" style={{ fontSize: '0.65rem' }}>Daily Safe Spend</div>
                        <div className="fw-bold">{formatCurrency(dailySafe)}</div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Add Category Modal */}
      <Modal show={showAddCatModal} onHide={() => setShowAddCatModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Add Custom Category</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 pt-0">
          <Form onSubmit={handleAddCategory}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">CATEGORY NAME</Form.Label>
              <Form.Control type="text" placeholder="e.g. Subscriptions" value={catLabel} onChange={(e) => setCatLabel(e.target.value)} required />
            </Form.Group>
            <Row>
              <Col xs={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">ICON</Form.Label>
                  <Form.Control type="text" value={catIcon} onChange={(e) => setCatIcon(e.target.value)} />
                </Form.Group>
              </Col>
              <Col xs={8}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">COLOR</Form.Label>
                  <Form.Control type="color" className="w-100 p-1" style={{ height: '45px' }} value={catColor} onChange={(e) => setCatColor(e.target.value)} />
                </Form.Group>
              </Col>
            </Row>
            <Button variant="primary" type="submit" className="w-100 btn-primary-custom py-2 mt-2">Create Category</Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Set Budget Modal */}
      <Modal show={showBudgetModal} onHide={() => setShowBudgetModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Update Limit</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 pt-0">
          <p className="text-muted small">Set your monthly goal for <strong>{editingBudget?.label}</strong></p>
          <Form.Group className="mb-4">
            <Form.Control type="number" size="lg" className={`fw-bold border-0 ${isDarkMode ? 'bg-dark text-white' : 'bg-light'}`} value={newLimit} onChange={(e) => setNewLimit(e.target.value)} autoFocus />
          </Form.Group>
          <Button variant="primary" className="w-100 btn-primary-custom py-2" onClick={handleSaveBudget}>Update Budget Limit</Button>
        </Modal.Body>
      </Modal>
    </motion.div>
  );
};

export default BudgetPlanner;