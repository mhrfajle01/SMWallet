import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Form, Button, ProgressBar } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { FaFileDownload, FaCalendarAlt, FaArrowUp, FaArrowDown, FaPiggyBank } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { generatePDF } from '../utils/pdfGenerator';

const ReportPanel = () => {
  const { meals, purchases, incomes, goals, goalDeposits, wallets } = useApp();
  const [period, setPeriod] = useState('monthly'); // weekly, monthly, yearly
  const { isDarkMode } = useTheme();
  
  // Calculate Date Ranges
  const now = new Date();
  
  const getStartDate = () => {
    const date = new Date();
    if (period === 'weekly') date.setDate(date.getDate() - 7);
    if (period === 'monthly') date.setMonth(date.getMonth() - 1);
    if (period === 'yearly') date.setFullYear(date.getFullYear() - 1);
    return date;
  };

  const filteredData = useMemo(() => {
    const startDate = getStartDate();
    
    const filterByDate = (items) => items.filter(item => {
      const d = new Date(item.date || item.createdAt?.toDate());
      return d >= startDate && d <= now;
    });

    return {
      meals: filterByDate(meals),
      purchases: filterByDate(purchases),
      incomes: filterByDate(incomes),
      deposits: filterByDate(goalDeposits)
    };
  }, [period, meals, purchases, incomes, goalDeposits]);

  const stats = useMemo(() => {
    const totalIncome = filteredData.incomes.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalExpenses = filteredData.meals.reduce((acc, curr) => acc + Number(curr.amount), 0) + 
                          filteredData.purchases.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalSavings = filteredData.deposits.reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    const totalWalletBalance = wallets.reduce((acc, curr) => acc + Number(curr.balance), 0);
    
    // Logic 1: Cash Flow (Income vs Expense)
    const netCashFlow = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Logic 2: Liquidity (Wallet vs Expense)
    const burnRate = totalWalletBalance > 0 ? (totalExpenses / totalWalletBalance) * 100 : 0;
    const survivalMonths = totalExpenses > 0 ? (totalWalletBalance / totalExpenses) : 0;

    // Logic 3: Funding Source
    const incomeFunded = Math.min(totalExpenses, totalIncome);
    const savingsFunded = Math.max(0, totalExpenses - totalIncome);

    return {
      income: totalIncome,
      expense: totalExpenses,
      savings: totalSavings,
      net: netCashFlow,
      savingsRate,
      burnRate,
      survivalMonths,
      incomeFunded,
      savingsFunded,
      totalWalletBalance
    };
  }, [filteredData, wallets]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleDownload = () => {
    generatePDF({
        totalBalance: stats.net,
        totalSpent: stats.expense,
        totalRemaining: stats.income - stats.expense
    }, filteredData.meals, filteredData.purchases, goals);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="pb-5"
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Financial Analysis</h4>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="outline-primary" onClick={handleDownload} className="d-flex align-items-center bg-white border-0 shadow-sm">
            <FaFileDownload className="me-2" /> Download PDF
          </Button>
        </motion.div>
      </div>

      {/* Period Selector */}
      <motion.div variants={itemVariants}>
        <Card className="custom-card border-0 mb-4 shadow-sm">
          <Card.Body className="p-3">
            <div className="d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 p-2 rounded-3 me-3 text-primary">
                <FaCalendarAlt />
              </div>
              <Form.Select 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)}
                className="w-auto border-0 fw-bold text-primary shadow-none ps-0 bg-transparent"
                style={{ cursor: 'pointer', fontSize: '1.1rem' }}
              >
                <option value="weekly">Weekly Overview</option>
                <option value="monthly">Monthly Overview</option>
                <option value="yearly">Yearly Overview</option>
              </Form.Select>
            </div>
          </Card.Body>
        </Card>
      </motion.div>

      {/* Core Metrics Grid */}
      <Row className="g-4 mb-4">
        <Col md={6} xl={3}>
          <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
            <Card className="custom-card border-0 h-100 shadow-sm overflow-hidden" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between mb-3">
                  <span className="small fw-bold opacity-75">CASH IN</span>
                  <FaArrowDown className="opacity-50" />
                </div>
                <h2 className="fw-bold mb-0">{formatCurrency(stats.income)}</h2>
                <div className="mt-2 small opacity-75">From {filteredData.incomes.length} sources</div>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
        <Col md={6} xl={3}>
          <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
            <Card className="custom-card border-0 h-100 shadow-sm overflow-hidden" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between mb-3">
                  <span className="small fw-bold opacity-75">CASH OUT</span>
                  <FaArrowUp className="opacity-50" />
                </div>
                <h2 className="fw-bold mb-0">{formatCurrency(stats.expense)}</h2>
                <div className="mt-2 small opacity-75">{stats.savingsRate.toFixed(1)}% savings rate</div>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
        <Col md={6} xl={3}>
          <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
            <Card className="custom-card border-0 h-100 shadow-sm overflow-hidden">
              <Card.Body className="p-4">
                <div className="text-muted small fw-bold mb-3 uppercase">NET CASH FLOW</div>
                <h2 className={`fw-bold mb-0 ${stats.net >= 0 ? 'text-success' : 'text-danger'}`}>
                  {stats.net >= 0 ? '+' : ''}{formatCurrency(stats.net)}
                </h2>
                <div className="mt-2 small text-muted">vs last period</div>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
        <Col md={6} xl={3}>
          <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
            <Card className="custom-card border-0 h-100 shadow-sm overflow-hidden">
              <Card.Body className="p-4">
                <div className="text-muted small fw-bold mb-3 uppercase">LIQUID WEALTH</div>
                <h2 className="fw-bold mb-0 text-primary">{formatCurrency(stats.totalWalletBalance)}</h2>
                <div className="mt-2 small text-muted">{stats.survivalMonths.toFixed(1)} mo. runway</div>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Funding Source Logic */}
        <Col lg={7}>
          <motion.div variants={itemVariants}>
            <Card className="custom-card border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-4">Expense Funding Analysis</h5>
                <div className="mb-4">
                  <div className="d-flex justify-content-between small mb-2">
                    <span className="text-muted">Income Funded (Safe)</span>
                    <span className="fw-bold text-success">{Math.round((stats.incomeFunded / (stats.expense || 1)) * 100)}%</span>
                  </div>
                  <ProgressBar className="rounded-pill" style={{ height: '12px' }}>
                    <ProgressBar 
                      now={(stats.incomeFunded / (stats.expense || 1)) * 100} 
                      variant="success" 
                      key={1} 
                    />
                    <ProgressBar 
                      now={(stats.savingsFunded / (stats.expense || 1)) * 100} 
                      variant="warning" 
                      key={2} 
                    />
                  </ProgressBar>
                  {stats.savingsFunded > 0 && (
                    <div className="mt-3 p-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded-3">
                      <small className="text-dark">
                        ⚠️ <strong>{formatCurrency(stats.savingsFunded)}</strong> of your expenses came from your savings this month.
                      </small>
                    </div>
                  )}
                </div>

                <Row className="text-center g-3">
                  <Col xs={6}>
                    <div className="p-3 border rounded-4">
                      <div className="text-muted small mb-1">Burn Rate</div>
                      <div className="fw-bold text-danger fs-4">{stats.burnRate.toFixed(1)}%</div>
                      <div className="text-muted" style={{ fontSize: '0.6rem' }}>OF TOTAL WEALTH</div>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="p-3 border rounded-4">
                      <div className="text-muted small mb-1">Savings Rate</div>
                      <div className="fw-bold text-success fs-4">{stats.savingsRate.toFixed(1)}%</div>
                      <div className="text-muted" style={{ fontSize: '0.6rem' }}>OF TOTAL INCOME</div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>

        {/* Liquidity Health */}
        <Col lg={5}>
          <motion.div variants={itemVariants}>
            <Card className="custom-card border-0 shadow-sm h-100">
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-4">Liquidity Health</h5>
                <div className="d-flex flex-column gap-4">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2 text-primary">
                          <FaPiggyBank size={14} />
                        </div>
                        <span className="small fw-medium">Survival Runway</span>
                      </div>
                      <span className="fw-bold">{stats.survivalMonths.toFixed(1)} Months</span>
                    </div>
                    <ProgressBar now={Math.min(stats.survivalMonths * 10, 100)} variant="info" className="rounded-pill" style={{ height: '8px' }} />
                  </div>

                  <div className="p-3 bg-light rounded-4">
                    <div className="small text-muted mb-2">Insight</div>
                    <p className="small mb-0 fw-medium">
                      {stats.survivalMonths > 6 
                        ? "✅ You have a very healthy emergency fund. You can survive over 6 months without new income."
                        : stats.survivalMonths > 3
                        ? "🟡 Your liquidity is stable, but consider increasing your emergency fund to 6 months of expenses."
                        : "🚨 Your runway is low. A sudden loss of income would consume your savings rapidly."}
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
      </Row>
    </motion.div>
  );
};

export default ReportPanel;