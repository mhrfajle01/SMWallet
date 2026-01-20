import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Form, Nav, Button } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import TransactionHistory from './TransactionHistory';
import FinancialCalendar from './FinancialCalendar';
import { motion } from 'framer-motion';
import { FaFileDownload, FaCalendarAlt, FaList } from 'react-icons/fa';
import { generatePDF } from '../utils/pdfGenerator';

const DashboardView = () => {
  const { wallets, meals, purchases, incomes, goals, globalStats } = useApp();
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'wallet'
  const [displayMode, setDisplayMode] = useState('list'); // 'list' or 'calendar'
  
  // Month Selection State
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Wallet Selection State
  const [selectedWalletId, setSelectedWalletId] = useState('');

  // Filter Data based on selection
  const filteredData = useMemo(() => {
    let filteredMeals = meals;
    let filteredPurchases = purchases;

    if (viewMode === 'month') {
      filteredMeals = meals.filter(m => m.month === selectedMonth);
      filteredPurchases = purchases.filter(p => p.month === selectedMonth);
    } else {
      // Wallet View
      if (selectedWalletId) {
        filteredMeals = meals.filter(m => m.walletId === selectedWalletId);
        filteredPurchases = purchases.filter(p => p.walletId === selectedWalletId);
      }
    }

    const totalMeals = filteredMeals.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalPurchases = filteredPurchases.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    return {
      meals: filteredMeals,
      purchases: filteredPurchases,
      totalSpent: totalMeals + totalPurchases
    };
  }, [viewMode, selectedMonth, selectedWalletId, meals, purchases]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
    }).format(amount);
  };

  const handleExportPDF = () => {
      generatePDF(globalStats, filteredData.meals, filteredData.purchases, goals);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="pb-5"
    >
      <Card className="custom-card mb-4 border-0">
        <Card.Body className="p-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            <Nav variant="pills" activeKey={viewMode} onSelect={(k) => setViewMode(k)} className="nav-pills-custom">
              <Nav.Item>
                <Nav.Link eventKey="month" className="px-4">Month View</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="wallet" className="px-4">Wallet View</Nav.Link>
              </Nav.Item>
            </Nav>

            <div className="d-flex align-items-center gap-3 flex-wrap">
              {viewMode === 'month' ? (
                 <Form.Control 
                   type="month" 
                   value={selectedMonth} 
                   onChange={(e) => setSelectedMonth(e.target.value)}
                   className="shadow-sm border-0"
                   style={{ minWidth: '200px' }}
                 />
              ) : (
                 <Form.Select 
                   value={selectedWalletId} 
                   onChange={(e) => setSelectedWalletId(e.target.value)}
                   className="shadow-sm border-0"
                   style={{ minWidth: '200px' }}
                 >
                   <option value="">Select Wallet</option>
                   {wallets.map(w => (
                     <option key={w.id} value={w.id}>{w.name}</option>
                   ))}
                 </Form.Select>
              )}
              
              <Button 
                variant="outline-secondary" 
                onClick={handleExportPDF}
                className="d-flex align-items-center shadow-sm border-0 bg-white"
              >
                <FaFileDownload className="me-2" /> PDF Export
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Row className="mb-4">
        <Col>
          <motion.div 
            className="p-4 rounded-4 text-white shadow-lg d-flex justify-content-between align-items-center"
            style={{ background: 'var(--primary-gradient)' }}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
          >
             <div>
                <h6 className="opacity-75 mb-1">TOTAL SPENT ({viewMode === 'month' ? selectedMonth : 'Selected Wallet'})</h6>
                <h2 className="fw-bold mb-0">{formatCurrency(filteredData.totalSpent)}</h2>
             </div>
             
             {/* View Switcher: List vs Calendar */}
             <div className="bg-white bg-opacity-25 p-1 rounded-pill d-flex">
               <Button 
                variant={displayMode === 'list' ? 'light' : 'transparent'} 
                size="sm" 
                className={`rounded-pill border-0 ${displayMode === 'list' ? 'text-primary shadow-sm' : 'text-white'}`}
                onClick={() => setDisplayMode('list')}
               >
                 <FaList />
               </Button>
               <Button 
                variant={displayMode === 'calendar' ? 'light' : 'transparent'} 
                size="sm" 
                className={`rounded-pill border-0 ${displayMode === 'calendar' ? 'text-primary shadow-sm' : 'text-white'}`}
                onClick={() => setDisplayMode('calendar')}
               >
                 <FaCalendarAlt />
               </Button>
             </div>
          </motion.div>
        </Col>
      </Row>
      
      {/* Content Area */}
      {displayMode === 'calendar' ? (
        <FinancialCalendar 
            meals={filteredData.meals} 
            purchases={filteredData.purchases} 
            incomes={incomes} // Pass all incomes, Calendar handles filtering by date internally or we can filter here
        />
      ) : (
        <TransactionHistory />
      )}
    </motion.div>
  );
};

export default DashboardView;
