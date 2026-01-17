import React, { useState, useMemo } from 'react';
import { Card, Form, InputGroup, Button, Badge } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { FaSearch, FaFilter, FaArrowDown, FaArrowUp, FaExchangeAlt, FaUtensils, FaShoppingCart, FaTrash } from 'react-icons/fa';
import { motion } from 'framer-motion';
import ConfirmModal from './ConfirmModal';

const TransactionHistory = () => {
  const { meals, purchases, incomes, goalDeposits, transfers, goals, deleteMeal, deletePurchase, deleteIncome, deleteTransfer, deleteGoalDeposit } = useApp();
  const [filterType, setFilterType] = useState('all'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const allTransactions = useMemo(() => {
    const combined = [
      ...meals.map(m => ({ ...m, type: 'expense', category: 'Meal', icon: FaUtensils, label: m.item, rawType: 'meal' })),
      ...purchases.map(p => ({ ...p, type: 'expense', category: p.category, icon: FaShoppingCart, label: p.item, rawType: 'purchase' })),
      ...incomes.map(i => ({ ...i, type: 'income', category: 'Income', icon: FaArrowDown, label: i.source, rawType: 'income' })),
      ...(transfers || []).map(t => ({ ...t, type: 'transfer', category: 'Transfer', icon: FaExchangeAlt, label: `${t.sourceName} ➔ ${t.destName}`, rawType: 'transfer' })),
      ...goalDeposits.map(g => {
        const goalName = g.goalName || goals.find(goal => goal.id === g.goalId)?.name || 'Deleted Goal';
        return { ...g, type: 'transfer', category: 'Savings', icon: FaExchangeAlt, label: `Deposit to ${goalName}`, rawType: 'goal_deposit' };
      })
    ];

    return combined.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt?.toDate());
      const dateB = new Date(b.date || b.createdAt?.toDate());
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [meals, purchases, incomes, goalDeposits, transfers, goals, sortOrder]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      const matchesType = filterType === 'all' || t.type === filterType || (filterType === 'expense' && (t.type === 'expense')); 
      const matchesSearch = t.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [allTransactions, filterType, searchTerm]);

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
      alert("Failed to delete transaction. Please try again.");
    }
    
    setConfirmDelete(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
    }).format(amount);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'income': return 'success';
      case 'expense': return 'danger';
      case 'transfer': return 'primary';
      default: return 'secondary';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-5"
    >
      <Card className="custom-card border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mb-4">
            <h4 className="fw-bold mb-0">Transaction History</h4>
            
            <div className="d-flex gap-2 w-100 w-md-auto">
              <InputGroup className="shadow-sm">
                <InputGroup.Text className="bg-white border-end-0">
                  <FaSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control 
                  placeholder="Search transactions..." 
                  className="border-start-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              
              <Form.Select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="w-auto shadow-sm"
                style={{ minWidth: '120px' }}
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </Form.Select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 text-secondary small py-3">Transaction</th>
                  <th className="border-0 text-secondary small py-3">Date</th>
                  <th className="border-0 text-secondary small py-3">Category</th>
                  <th className="border-0 text-secondary small py-3 text-end">Amount</th>
                  <th className="border-0 text-secondary small py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t, idx) => (
                  <tr key={t.id || idx}>
                    <td className="py-3">
                      <div className="d-flex align-items-center">
                        <div className={`rounded-circle p-2 bg-${getTypeColor(t.type)} bg-opacity-10 text-${getTypeColor(t.type)} me-3`}>
                          <t.icon />
                        </div>
                        <span className="fw-medium">{t.label}</span>
                      </div>
                    </td>
                    <td className="text-muted small">{t.date}</td>
                    <td>
                      <Badge bg="light" text="dark" className="border">
                        {t.category}
                      </Badge>
                    </td>
                    <td className={`text-end fw-bold text-${getTypeColor(t.type)}`}>
                      {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="text-center">
                      <Button 
                        variant="light" 
                        className="text-danger p-1 rounded-circle" 
                        size="sm"
                        onClick={() => handleDelete(t)}
                      >
                        <FaTrash size={12} />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      No transactions found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>

      <ConfirmModal 
        show={!!confirmDelete}
        onHide={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteAction}
        title="Delete Transaction"
        message={`Are you sure you want to delete this ${confirmDelete?.type} record? This will reverse the balance changes.`}
      />
    </motion.div>
  );
};

export default TransactionHistory;