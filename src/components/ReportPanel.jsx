import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Form, Button } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { FaFileDownload, FaCalendarAlt, FaArrowUp, FaArrowDown, FaPiggyBank } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { generatePDF } from '../utils/pdfGenerator';

const ReportPanel = () => {
  const { meals, purchases, incomes, goals, goalDeposits } = useApp();
  const [period, setPeriod] = useState('monthly'); // weekly, monthly, yearly
  
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
    
    return {
      income: totalIncome,
      expense: totalExpenses,
      savings: totalSavings,
      net: totalIncome - totalExpenses
    };
  }, [filteredData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
    }).format(amount);
  };

  const handleDownload = () => {
    // Generate a specific report for this period
    // We can reuse the existing generator or enhance it to accept a title/period
    // For now, passing the filtered data is good.
    generatePDF({
        totalBalance: stats.net, // Using net as balance context for report
        totalSpent: stats.expense,
        totalRemaining: stats.income - stats.expense // Cash flow
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
        <h4 className="fw-bold mb-0">Financial Reports</h4>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="outline-primary" onClick={handleDownload} className="d-flex align-items-center bg-white border-0 shadow-sm">
            <FaFileDownload className="me-2" /> Download PDF
          </Button>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <Card className="custom-card border-0 mb-4">
          <Card.Body className="p-4">
            <div className="d-flex align-items-center mb-4">
              <FaCalendarAlt className="text-primary me-2" />
              <Form.Select 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)}
                className="w-auto border-0 fw-bold text-primary shadow-none ps-0"
                style={{ cursor: 'pointer' }}
              >
                <option value="weekly">Last 7 Days</option>
                <option value="monthly">Last 30 Days</option>
                <option value="yearly">Last 365 Days</option>
              </Form.Select>
            </div>

            <Row className="g-3">
              <Col md={4}>
                <motion.div whileHover={{ scale: 1.02 }} className="p-3 rounded-4 bg-success bg-opacity-10 text-success h-100">
                  <div className="d-flex align-items-center mb-2">
                    <div className="bg-white rounded-circle p-2 me-2 shadow-sm">
                      <FaArrowDown size={14} />
                    </div>
                    <span className="small fw-bold uppercase">Total Income</span>
                  </div>
                  <h3 className="fw-bold mb-0">{formatCurrency(stats.income)}</h3>
                </motion.div>
              </Col>
              <Col md={4}>
                <motion.div whileHover={{ scale: 1.02 }} className="p-3 rounded-4 bg-danger bg-opacity-10 text-danger h-100">
                  <div className="d-flex align-items-center mb-2">
                    <div className="bg-white rounded-circle p-2 me-2 shadow-sm">
                      <FaArrowUp size={14} />
                    </div>
                    <span className="small fw-bold uppercase">Total Expense</span>
                  </div>
                  <h3 className="fw-bold mb-0">{formatCurrency(stats.expense)}</h3>
                </motion.div>
              </Col>
              <Col md={4}>
                <motion.div whileHover={{ scale: 1.02 }} className="p-3 rounded-4 bg-primary bg-opacity-10 text-primary h-100">
                  <div className="d-flex align-items-center mb-2">
                    <div className="bg-white rounded-circle p-2 me-2 shadow-sm">
                      <FaPiggyBank size={14} />
                    </div>
                    <span className="small fw-bold uppercase">Net Savings</span>
                  </div>
                  <h3 className="fw-bold mb-0">{formatCurrency(stats.savings)}</h3>
                  <small className="opacity-75">Deposited to goals</small>
                </motion.div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </motion.div>
      
      {/* Could add charts here later */}
      
    </motion.div>
  );
};

export default ReportPanel;
