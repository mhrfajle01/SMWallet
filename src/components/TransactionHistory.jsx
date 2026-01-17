import React, { useState, useMemo } from 'react';
import { Card, Form, InputGroup, Button, Badge, Row, Col } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { FaSearch, FaFilter, FaArrowDown, FaArrowUp, FaExchangeAlt, FaUtensils, FaShoppingCart, FaTrash, FaHistory, FaEdit } from 'react-icons/fa';
import { motion } from 'framer-motion';
import ConfirmModal from './ConfirmModal';
import EditTransactionModal from './EditTransactionModal';

const TransactionHistory = () => {
  const { 
    meals = [], 
    purchases = [], 
    incomes = [], 
    goalDeposits = [], 
    transfers = [], 
    goals = [], 
    deleteMeal, 
    deletePurchase, 
    deleteIncome, 
    deleteTransfer, 
    deleteGoalDeposit 
  } = useApp();

  const [filterType, setFilterType] = useState('all'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const allTransactions = useMemo(() => {
    try {
      const combined = [
        ...meals.map(m => ({ ...m, type: 'expense', category: 'Meal', icon: FaUtensils, label: m.item || 'Unnamed Meal', rawType: 'meal' })),
        ...purchases.map(p => ({ ...p, type: 'expense', category: p.category || 'Other', icon: FaShoppingCart, label: p.item || 'Unnamed Purchase', rawType: 'purchase' })),
        ...incomes.map(i => ({ ...i, type: 'income', category: 'Income', icon: FaArrowDown, label: i.source || 'Income', rawType: 'income' })),
        ...transfers.map(t => ({ ...t, type: 'transfer', category: 'Transfer', icon: FaExchangeAlt, label: `${t.sourceName || 'Wallet'} ➔ ${t.destName || 'Wallet'}`, rawType: 'transfer' })),
        ...goalDeposits.map(g => {
          const goalName = g.goalName || goals.find(goal => goal.id === g.goalId)?.name || 'Savings Goal';
          return { ...g, type: 'transfer', category: 'Savings', icon: FaExchangeAlt, label: `Deposit to ${goalName}`, rawType: 'goal_deposit' };
        })
      ];

      return combined.sort((a, b) => {
        const getTimestamp = (t) => {
          if (t.date) {
            const d = new Date(t.date);
            return isNaN(d.getTime()) ? 0 : d.getTime();
          }
          if (t.createdAt?.toDate) return t.createdAt.toDate().getTime();
          if (t.createdAt?.seconds) return t.createdAt.seconds * 1000;
          if (t.createdAt instanceof Date) return t.createdAt.getTime();
          return 0;
        };
        return getTimestamp(b) - getTimestamp(a);
      });
    } catch (e) {
      console.error("Error combining transactions:", e);
      return [];
    }
  }, [meals, purchases, incomes, goalDeposits, transfers, goals]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      const label = (t.label || '').toLowerCase();
      const category = (t.category || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      const matchesType = filterType === 'all' || t.type === filterType; 
      const matchesSearch = label.includes(search) || category.includes(search);
      return matchesType && matchesSearch;
    });
  }, [allTransactions, filterType, searchTerm]);

  const groupedTransactions = useMemo(() => {
    const groups = {};
    filteredTransactions.forEach(t => {
      let dateKey = 'Unknown Date';
      try {
        if (t.date) {
          dateKey = t.date;
        } else if (t.createdAt?.toDate) {
          dateKey = t.createdAt.toDate().toISOString().split('T')[0];
        } else if (t.createdAt?.seconds) {
          dateKey = new Date(t.createdAt.seconds * 1000).toISOString().split('T')[0];
        } else if (t.createdAt instanceof Date) {
          dateKey = t.createdAt.toISOString().split('T')[0];
        }
      } catch (e) {
        console.error("Date parsing error:", e);
      }
      
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });

    return Object.keys(groups).sort((a, b) => {
      const dateA = new Date(a).getTime() || 0;
      const dateB = new Date(b).getTime() || 0;
      return dateB - dateA;
    }).reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {});
  }, [filteredTransactions]);

  const stats = useMemo(() => {
    let cashIn = 0;
    let cashOut = 0;
    filteredTransactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      if (t.type === 'income') cashIn += amount;
      if (t.type === 'expense') cashOut += amount;
    });
    return { cashIn, cashOut, net: cashIn - cashOut };
  }, [filteredTransactions]);

  const handleDelete = (transaction) => {
    setConfirmDelete(transaction);
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    const { id, rawType, walletId, amount, sourceId, destId, goalId } = confirmDelete;
    try {
      switch (rawType) {
        case 'meal': await deleteMeal(id); break;
        case 'purchase': await deletePurchase(id); break;
        case 'income': await deleteIncome(id, walletId, amount); break;
        case 'transfer': await deleteTransfer(id, sourceId, destId, amount); break;
        case 'goal_deposit': await deleteGoalDeposit(id, goalId, walletId, amount); break;
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
    setConfirmDelete(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(Number(amount) || 0);
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr || dateStr === 'Unknown Date') return 'Unknown Date';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (date.toDateString() === today.toDateString()) return 'Today';
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
      
      return date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="pb-5">
      {/* Search and Filter */}
      <Card className="custom-card border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <div className="d-flex flex-column flex-md-row gap-3">
            <InputGroup className="shadow-none bg-light rounded-3 overflow-hidden border-0">
              <InputGroup.Text className="bg-transparent border-0 px-3">
                <FaSearch className="text-muted" />
              </InputGroup.Text>
              <Form.Control 
                placeholder="Search transactions..." 
                className="bg-transparent border-0 py-2 shadow-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <Form.Select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="w-auto border-0 fw-bold text-primary shadow-none bg-primary bg-opacity-10 rounded-3"
              style={{ minWidth: '140px' }}
            >
              <option value="all">All Types</option>
              <option value="income">Cash In</option>
              <option value="expense">Cash Out</option>
              <option value="transfer">Transfers</option>
            </Form.Select>
          </div>
        </Card.Body>
      </Card>

      {/* Summary Header */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={4}>
          <div className="p-3 rounded-4 bg-success bg-opacity-10 text-success border border-success border-opacity-10 text-center">
            <div className="small fw-bold text-uppercase opacity-75 mb-1">Total In</div>
            <div className="fw-bold fs-5">{formatCurrency(stats.cashIn)}</div>
          </div>
        </Col>
        <Col xs={6} md={4}>
          <div className="p-3 rounded-4 bg-danger bg-opacity-10 text-danger border border-danger border-opacity-10 text-center">
            <div className="small fw-bold text-uppercase opacity-75 mb-1">Total Out</div>
            <div className="fw-bold fs-5">{formatCurrency(stats.cashOut)}</div>
          </div>
        </Col>
        <Col xs={12} md={4}>
          <div className={`p-3 rounded-4 border ${stats.net >= 0 ? 'bg-primary bg-opacity-10 text-primary border-primary' : 'bg-warning bg-opacity-10 text-warning border-warning'} border-opacity-10 text-center`}>
            <div className="small fw-bold text-uppercase opacity-75 mb-1">Filtered Net</div>
            <div className="fw-bold fs-5">{formatCurrency(stats.net)}</div>
          </div>
        </Col>
      </Row>

      {/* Grouped Transaction List */}
      {Object.keys(groupedTransactions).length > 0 ? (
        Object.keys(groupedTransactions).map(date => (
          <div key={date} className="mb-4">
            <div className="d-flex align-items-center mb-3">
              <div className="fw-bold text-muted small text-uppercase tracking-wider">{formatDateLabel(date)}</div>
              <div className="flex-grow-1 ms-3 border-top opacity-10"></div>
            </div>
            
            {groupedTransactions[date].map((t, idx) => (
              <motion.div
                key={t.id || `tx-${date}-${idx}`}
                whileHover={{ x: 5 }}
                className="mb-2"
              >
                <Card className="custom-card border-0 shadow-sm overflow-hidden">
                  <Card.Body className="p-3">
                    <div className="d-flex align-items-center">
                      <div className={`rounded-circle p-2 me-3 d-flex align-items-center justify-content-center bg-${t.type === 'income' ? 'success' : t.type === 'expense' ? 'danger' : 'primary'} bg-opacity-10 text-${t.type === 'income' ? 'success' : t.type === 'expense' ? 'danger' : 'primary'}`} style={{ width: '45px', height: '45px' }}>
                        {t.icon ? <t.icon size={20} /> : <FaExchangeAlt size={20} />}
                      </div>

                      <div className="flex-grow-1 overflow-hidden">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="overflow-hidden">
                            <div className="fw-bold text-truncate">{t.label}</div>
                            <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                              <Badge bg="light" text="secondary" className="fw-normal border border-secondary border-opacity-10 px-2 py-1" style={{ fontSize: '0.65rem' }}>
                                {t.category || 'Other'}
                              </Badge>
                              {t.walletName && (
                                <Badge bg="primary" className="bg-opacity-10 text-primary fw-normal px-2 py-1" style={{ fontSize: '0.65rem' }}>
                                  {t.walletName}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-end ms-2" style={{ minWidth: '100px' }}>
                            <div className={`fw-bold ${t.type === 'income' ? 'text-success' : t.type === 'expense' ? 'text-danger' : 'text-primary'}`}>
                              {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}
                              {formatCurrency(t.amount)}
                            </div>
                            <div className="d-flex justify-content-end gap-2 mt-1">
                              <Button 
                                variant="light" 
                                className="text-primary p-0 opacity-50" 
                                onClick={() => setEditingTransaction(t)}
                              >
                                <FaEdit size={12} />
                              </Button>
                              <Button 
                                variant="link" 
                                className="text-danger p-0 opacity-50" 
                                onClick={() => handleDelete(t)}
                              >
                                <FaTrash size={12} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          </div>
        ))
      ) : (
        <div className="text-center py-5">
          <div className="text-muted mb-3 opacity-25">
            <FaHistory size={60} />
          </div>
          <h5 className="text-muted">No transactions found</h5>
          <p className="small text-muted">Try adjusting your search or filters.</p>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal 
          show={!!confirmDelete}
          onHide={() => setConfirmDelete(null)}
          onConfirm={confirmDeleteAction}
          title="Delete Transaction"
          message={`Are you sure you want to delete this record? This will reverse the balance changes.`}
        />
      )}

      {/* Unified Edit Modal */}
      {editingTransaction && (
        <EditTransactionModal 
          show={true} 
          onHide={() => setEditingTransaction(null)} 
          transaction={editingTransaction} 
        />
      )}
    </div>
  );
};

export default TransactionHistory;