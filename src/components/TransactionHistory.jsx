import React, { useState, useMemo } from 'react';
import { Card, Form, InputGroup, Button, Badge, Row, Col } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { FaSearch, FaArrowDown, FaExchangeAlt, FaUtensils, FaShoppingCart, FaTrash, FaHistory, FaEdit, FaSortAmountDown, FaSortAmountUp, FaCalendarAlt, FaList, FaTable, FaFileDownload } from 'react-icons/fa';
import { motion } from 'framer-motion';
import ConfirmModal from './ConfirmModal';
import EditTransactionModal from './EditTransactionModal';
import SmartTable from './SmartTable';
import { useTheme } from '../context/ThemeContext';
import { generateFilteredPDF } from '../utils/pdfGenerator';
import Papa from 'papaparse';

const TransactionHistory = ({ walletId = null }) => {
  const { 
    meals = [], 
    purchases = [], 
    incomes = [], 
    goalDeposits = [], 
    transfers = [], 
    goals = [], 
    categories = [],
    deleteMeal, 
    deletePurchase, 
    deleteIncome, 
    deleteTransfer, 
    deleteGoalDeposit 
  } = useApp();

  const { isDarkMode } = useTheme();
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'table'
  const [filterType, setFilterType] = useState('all'); 
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('date-desc');
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
      return combined;
    } catch (e) {
      console.error("Error combining transactions:", e);
      return [];
    }
  }, [meals, purchases, incomes, goalDeposits, transfers, goals]);

  const filteredTransactions = useMemo(() => {
    let result = allTransactions.filter(t => {
      // Wallet Filter
      if (walletId) {
         // Check direct walletId match (most items)
         const directMatch = t.walletId === walletId;
         // Check transfer source/dest
         const transferMatch = t.rawType === 'transfer' && (t.sourceId === walletId || t.destId === walletId);
         
         if (!directMatch && !transferMatch) return false;
      }

      const label = (t.label || '').toLowerCase();
      const category = (t.category || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      
      const matchesType = filterType === 'all' || t.type === filterType; 
      
      let matchesCategory = true;
      if (filterCategory !== 'all') {
         if (filterCategory === 'Meal') matchesCategory = t.rawType === 'meal';
         else if (filterCategory === 'Income') matchesCategory = t.rawType === 'income';
         else if (filterCategory === 'Transfer') matchesCategory = t.type === 'transfer';
         else matchesCategory = t.category === filterCategory;
      }

      const matchesSearch = label.includes(search) || category.includes(search);
      return matchesType && matchesCategory && matchesSearch;
    });

    if (viewMode === 'list') {
        result.sort((a, b) => {
            const getTimestamp = (t) => {
                // Use full user date+time for sorting
                if (t.date) {
                    const d = new Date(t.date);
                    // If time exists, parse it, otherwise default to midnight
                    if (t.time) {
                        const [hours, minutes] = t.time.match(/(\d+):(\d+)\s*(AM|PM)/i) ? 
                            (() => {
                                const match = t.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
                                let h = parseInt(match[1]);
                                const m = parseInt(match[2]);
                                const ampm = match[3].toUpperCase();
                                if (ampm === 'PM' && h < 12) h += 12;
                                if (ampm === 'AM' && h === 12) h = 0;
                                return [h, m];
                            })() : [0, 0];
                        d.setHours(hours, minutes, 0, 0);
                    }
                    return isNaN(d.getTime()) ? 0 : d.getTime();
                }
                // Fallback
                if (t.createdAt?.toDate) return t.createdAt.toDate().getTime();
                return 0;
            };
            
            const timeA = getTimestamp(a);
            const timeB = getTimestamp(b);
            const amountA = Number(a.amount);
            const amountB = Number(b.amount);

            if (sortOrder === 'date-desc') return timeB - timeA;
            if (sortOrder === 'date-asc') return timeA - timeB;
            if (sortOrder === 'amount-desc') return amountB - amountA;
            if (sortOrder === 'amount-asc') return amountA - amountB;
            if (sortOrder === 'created-desc') {
                // Sort by actual creation time (System Timestamp)
                const createdA = a.createdAt?.seconds || 0;
                const createdB = b.createdAt?.seconds || 0;
                return createdB - createdA;
            }
            return 0;
        });
    }

    return result;
  }, [allTransactions, filterType, filterCategory, sortOrder, searchTerm, viewMode, walletId]);

  // Export Logic
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return alert("No data to export");

    // Prepare data for CSV
    const exportData = filteredTransactions.map(t => ({
      Date: t.date || '',
      Time: t.time || '',
      Description: t.label || t.item || '',
      Type: t.type,
      Category: t.category,
      Wallet: t.walletName || 'N/A',
      Amount: t.amount,
      RawType: t.rawType
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tableColumns = useMemo(() => [
    { key: 'date', label: 'Date', filterable: true, width: '120px' },
    { key: 'time', label: 'Time', width: '100px', render: (row) => row.time || '-' },
    { key: 'label', label: 'Description', filterable: true },
    { key: 'category', label: 'Category', filterable: true, width: '150px' },
    { key: 'walletName', label: 'Wallet', filterable: true, width: '150px' },
    { key: 'type', label: 'Type', filterable: true, width: '100px', render: (row) => (
        <Badge bg={row.type === 'income' ? 'success' : row.type === 'expense' ? 'danger' : 'primary'}>
            {row.type.toUpperCase()}
        </Badge>
    )},
    { key: 'amount', label: 'Amount', type: 'number', filterable: true, width: '120px', render: (row) => (
        <span className={`fw-bold ${row.type === 'income' ? 'text-success' : 'text-danger'}`}>
            {row.type === 'expense' ? '-' : '+'}{row.amount}
        </span>
    )}
  ], []);

  const isDateSorted = sortOrder.includes('date');
  const groupedTransactions = useMemo(() => {
    if (viewMode === 'table') return {};
    if (!isDateSorted) return { 'All Transactions': filteredTransactions };

    const groups = {};
    filteredTransactions.forEach(t => {
      let dateKey = 'Unknown Date';
      try {
        if (t.date) dateKey = t.date;
        else if (t.createdAt?.toDate) dateKey = t.createdAt.toDate().toISOString().split('T')[0];
        else if (t.createdAt instanceof Date) dateKey = t.createdAt.toISOString().split('T')[0];
      } catch (e) { }
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });

    const keys = Object.keys(groups).sort((a, b) => {
      const dateA = new Date(a).getTime() || 0;
      const dateB = new Date(b).getTime() || 0;
      return sortOrder === 'date-desc' ? dateB - dateA : dateA - dateB;
    });

    return keys.reduce((acc, key) => { acc[key] = groups[key]; return acc; }, {});
  }, [filteredTransactions, isDateSorted, sortOrder, viewMode]);

  const stats = useMemo(() => {
    let cashIn = 0;
    let cashOut = 0;
    filteredTransactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      
      // Handle Transfers specifically if we are in Wallet Mode
      if (walletId && t.rawType === 'transfer') {
        if (t.sourceId === walletId) cashOut += amount;
        else if (t.destId === walletId) cashIn += amount;
        return;
      }

      // Default Logic
      if (t.type === 'income') cashIn += amount;
      if (t.type === 'expense') cashOut += amount;
    });
    return { cashIn, cashOut, net: cashIn - cashOut };
  }, [filteredTransactions, walletId]);

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
    if (!isDateSorted) return 'All Results';
    if (!dateStr || dateStr === 'Unknown Date') return 'Unknown Date';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      if (date.toDateString() === today.toDateString()) return 'Today';
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return dateStr; }
  };

  return (
    <div className="pb-5">
      {/* Search and Filter */}
      <Card className={`custom-card border-0 shadow-sm mb-4 ${isDarkMode ? 'bg-dark text-white' : ''}`}>
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            {/* Search - Full on Mobile, 3 cols on Desktop */}
            <Col xs={12} lg={3}>
              <InputGroup className={`shadow-none rounded-3 overflow-hidden border-0 ${isDarkMode ? 'bg-secondary' : 'bg-light'}`}>
                <InputGroup.Text className={`border-0 px-3 ${isDarkMode ? 'bg-secondary text-light' : 'bg-transparent text-muted'}`}>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control 
                  placeholder="Search..." 
                  className={`border-0 py-2 shadow-none ${isDarkMode ? 'bg-secondary text-white' : 'bg-transparent'}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            
            {viewMode === 'list' && (
                <>
                    {/* Filters - Split row on Mobile, inline on Desktop */}
                    <Col xs={6} lg={2}>
                        <Form.Select 
                            value={filterType} 
                            onChange={(e) => setFilterType(e.target.value)}
                            className={`border-0 fw-bold shadow-none rounded-3 py-2 w-100 ${isDarkMode ? 'bg-secondary text-info' : 'bg-primary bg-opacity-10 text-primary'}`}
                        >
                            <option value="all">All Types</option>
                            <option value="income">In (Income)</option>
                            <option value="expense">Out (Expense)</option>
                            <option value="transfer">Transfer</option>
                        </Form.Select>
                    </Col>

                    <Col xs={6} lg={3}>
                        <Form.Select 
                            value={sortOrder} 
                            onChange={(e) => setSortOrder(e.target.value)}
                            className={`border-0 fw-bold shadow-none rounded-3 py-2 w-100 ${isDarkMode ? 'bg-secondary text-light' : 'bg-light text-dark'}`}
                        >
                            <option value="created-desc">Recently Added</option>
                            <option value="date-desc">Newest Date</option>
                            <option value="date-asc">Oldest Date</option>
                            <option value="amount-desc">Highest Amount</option>
                        </Form.Select>
                    </Col>
                </>
            )}

            {/* Buttons - Full row on Mobile, Auto on Desktop */}
            <Col xs={12} lg={viewMode === 'list' ? 4 : 9} className="text-lg-end text-center">
                <div className={`d-inline-flex flex-wrap justify-content-center gap-1 rounded-4 p-1 ${isDarkMode ? 'bg-secondary' : 'bg-light'}`} style={{ width: 'fit-content' }}>
                    <Button 
                        variant={viewMode === 'list' ? (isDarkMode ? 'dark shadow-sm' : 'white shadow-sm') : 'transparent'} 
                        size="sm" 
                        className={`rounded-pill border-0 px-3 ${viewMode === 'list' ? '' : (isDarkMode ? 'text-light opacity-50' : 'text-muted')}`}
                        onClick={() => setViewMode('list')}
                    >
                        <FaList />
                    </Button>
                    <Button 
                        variant={viewMode === 'table' ? (isDarkMode ? 'dark shadow-sm' : 'white shadow-sm') : 'transparent'} 
                        size="sm" 
                        className={`rounded-pill border-0 px-3 ${viewMode === 'table' ? '' : (isDarkMode ? 'text-light opacity-50' : 'text-muted')}`}
                        onClick={() => setViewMode('table')}
                    >
                        <FaTable />
                    </Button>
                    <div className="vr opacity-25 mx-1 align-self-center" style={{ height: '20px' }}></div>
                    <Button 
                        variant="transparent" 
                        size="sm" 
                        className={`rounded-pill border-0 px-2 ${isDarkMode ? 'text-light hover-bg-dark' : 'text-success hover-bg-white'}`}
                        onClick={handleExportCSV}
                        title="Download CSV"
                    >
                        <FaFileDownload /> CSV
                    </Button>
                    <Button 
                        variant="transparent" 
                        size="sm" 
                        className={`rounded-pill border-0 px-2 ${isDarkMode ? 'text-light hover-bg-dark' : 'text-danger hover-bg-white'}`}
                        onClick={() => generateFilteredPDF(filteredTransactions)}
                        title="Download PDF"
                    >
                        <FaFileDownload /> PDF
                    </Button>
                </div>
            </Col>
          </Row>
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

      {viewMode === 'table' ? (
          <SmartTable 
            data={filteredTransactions} 
            columns={tableColumns} 
            onEdit={setEditingTransaction}
            onDelete={handleDelete}
          />
      ) : (
        /* Grouped Transaction List */
        Object.keys(groupedTransactions).length > 0 ? (
            Object.keys(groupedTransactions).map(key => (
            <div key={key} className="mb-4">
                {isDateSorted && (
                    <div className="d-flex align-items-center mb-3">
                        <div className="fw-bold text-muted small text-uppercase tracking-wider">{formatDateLabel(key)}</div>
                        <div className="flex-grow-1 ms-3 border-top opacity-10"></div>
                    </div>
                )}
                
                {groupedTransactions[key].map((t, idx) => (
                <motion.div
                    key={t.id || `tx-${key}-${idx}`}
                    whileHover={{ x: 5 }}
                    className="mb-2"
                >
                    <Card className={`custom-card border-0 shadow-sm overflow-hidden ${isDarkMode ? 'bg-dark text-light border-secondary' : ''}`}>
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
                                <Badge bg={isDarkMode ? 'secondary' : 'light'} text={isDarkMode ? 'light' : 'secondary'} className={`fw-normal border border-opacity-10 px-2 py-1 ${isDarkMode ? 'border-secondary' : 'border-secondary'}`} style={{ fontSize: '0.65rem' }}>
                                    {t.category || 'Other'}
                                </Badge>
                                {t.walletName && (
                                    <Badge bg="primary" className="bg-opacity-10 text-primary fw-normal px-2 py-1" style={{ fontSize: '0.65rem' }}>
                                    {t.walletName}
                                    </Badge>
                                )}
                                {!isDateSorted && t.date && (
                                    <small className="text-muted ms-1" style={{ fontSize: '0.65rem' }}>{t.date}</small>
                                )}
                                {t.time && (
                                    <small className="text-muted ms-1 border-start ps-2" style={{ fontSize: '0.65rem' }}>{t.time}</small>
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
                                    variant={isDarkMode ? 'outline-secondary' : 'light'} 
                                    className={`p-0 opacity-50 ${isDarkMode ? 'text-info border-0' : 'text-primary'}`}
                                    onClick={() => setEditingTransaction(t)}
                                >
                                    <FaEdit size={12} />
                                </Button>
                                <Button 
                                    variant={isDarkMode ? 'outline-secondary' : 'light'} 
                                    className="text-danger p-0 opacity-50 border-0" 
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
        )
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