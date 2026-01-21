import React, { useState } from 'react';
import { Card, Row, Col, Button, Badge, Modal } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { FaWallet, FaTrash, FaArrowUp, FaArrowDown, FaCoins, FaPlusCircle, FaExchangeAlt, FaHistory } from 'react-icons/fa';
import { motion } from 'framer-motion';
import ConfirmModal from './ConfirmModal';
import QuickDepositModal from './QuickDepositModal';
import TransferModal from './TransferModal';
import TransactionHistory from './TransactionHistory';
import { useTheme } from '../context/ThemeContext';

const WalletPanel = ({ onOpenCreateModal }) => {
  const { globalStats, wallets, deleteWallet } = useApp();
  const { isDarkMode } = useTheme();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [quickDepositWallet, setQuickDepositWallet] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
    }).format(amount);
  };

  const handleDeleteClick = (id, name, e) => {
    e.stopPropagation();
    setConfirmDelete({ id, name });
  };

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      deleteWallet(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1 }
    })
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-5"
    >
      {/* Premium Global Summary */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="custom-card mb-5 border-0 premium-header text-white shadow-lg">
          <Card.Body className="p-4 p-md-5">
            {/* Real vs Debt Split - Top focus */}
            <Row className="g-3 mb-4">
              <Col xs={6}>
                <div className="p-3 rounded-4 h-100 position-relative overflow-hidden" style={{ background: 'rgba(72, 187, 120, 0.15)', border: '1px solid rgba(72, 187, 120, 0.25)' }}>
                  <div className="position-relative z-1">
                    <div className="text-success small fw-bold mb-1 d-flex align-items-center gap-1">
                      <FaCoins /> Real Balance
                    </div>
                    <h4 className="fw-bold mb-0 text-white">{formatCurrency(globalStats.totalRealBalance)}</h4>
                    <div className="mt-1 small text-white-50" style={{ fontSize: '0.75em' }}>Liquid Cash</div>
                  </div>
                </div>
              </Col>
              <Col xs={6}>
                <div className="p-3 rounded-4 h-100 position-relative overflow-hidden" style={{ background: 'rgba(245, 101, 101, 0.15)', border: '1px solid rgba(245, 101, 101, 0.25)' }}>
                   <div className="position-relative z-1">
                    <div className="text-danger small fw-bold mb-1 d-flex align-items-center gap-1">
                      <FaArrowDown /> Current Debt
                    </div>
                    <h4 className="fw-bold mb-0 text-white">{formatCurrency(globalStats.totalDebt)}</h4>
                    <div className="mt-1 small text-white-50" style={{ fontSize: '0.75em' }}>Outstanding</div>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Net Worth - Calculated Result */}
            <div className="text-center mb-4 p-3 rounded-4" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="glass-pill mb-1 d-inline-block px-3" style={{ fontSize: '0.7rem' }}>Total Net Worth</span>
              <div className="fw-bold mt-1" style={{ fontSize: '1.75rem', letterSpacing: '-0.5px' }}>
                <span className="opacity-50 me-2" style={{ fontSize: '0.5em' }}>BDT</span>
                {globalStats.totalBalance.toLocaleString('en-BD')}
              </div>
            </div>

            {/* Asset Distribution Bar */}
            <div className="mb-4">
              <div className="d-flex justify-content-between small mb-2 opacity-75">
                <span>Asset Distribution</span>
                <span>{wallets.filter(w => w.type !== 'liability').length} accounts</span>
              </div>
              <div className="distribution-bar">
                {wallets.filter(w => w.type !== 'liability').map((w, index) => {
                  const colors = ['#48bb78', '#38b2ac', '#4299e1', '#667eea', '#9f7aea'];
                  // Use totalRealBalance as denominator for assets
                  const width = (w.balance / (globalStats.totalRealBalance || 1)) * 100;
                  // Cap width at 100% just in case
                  const safeWidth = Math.min(width, 100);
                  
                  if (w.balance <= 0) return null;

                  return (
                    <div 
                      key={w.id} 
                      className="distribution-segment" 
                      style={{ 
                        width: `${safeWidth}%`, 
                        backgroundColor: colors[index % colors.length],
                        opacity: 0.9
                      }} 
                      title={`${w.name}: ${w.balance}`}
                    />
                  );
                })}
              </div>
            </div>

            <Row className="g-3">
              <Col xs={12}>
                <div className="p-3 rounded-4 d-flex justify-content-between align-items-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div>
                    <div className="opacity-75 small mb-1">Total Spent This Month</div>
                    <h5 className="fw-bold mb-0">{formatCurrency(globalStats.totalSpent)}</h5>
                  </div>
                   <Badge bg={globalStats.totalBalance < 0 ? 'danger' : 'success'} className="rounded-pill px-3 py-2">
                      {globalStats.totalBalance < 0 ? 'In Debt' : 'Solvent'}
                   </Badge>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </motion.div>

      {/* Individual Wallets */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">My Wallets</h4>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={() => setShowTransferModal(true)} className="rounded-pill d-flex align-items-center border-0 shadow-sm bg-white">
            <FaExchangeAlt className="me-2" /> Transfer
          </Button>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="primary" onClick={onOpenCreateModal} className="btn-primary-custom shadow-sm">
              + New Wallet
            </Button>
          </motion.div>
        </div>
      </div>

      <Row>
        {wallets.map((wallet, index) => (
          <Col key={wallet.id} md={6} xl={4} className="mb-4">
            <motion.div
              custom={index}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedWallet(wallet)}
              style={{ cursor: 'pointer' }}
            >
              <Card className="custom-card h-100 position-relative">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div className="d-flex align-items-center">
                      <div className="bg-light rounded-circle p-3 me-3 text-primary shadow-sm">
                         <FaWallet size={24} />
                      </div>
                      <div>
                        <h5 className="fw-bold mb-0">{wallet.name}</h5>
                        <small className="text-muted">
                          Created: {wallet.createdAt ? new Date(wallet.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                        </small>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="light" 
                        className="text-success rounded-circle p-0 d-flex align-items-center justify-content-center" 
                        style={{ width: '32px', height: '32px' }}
                        title="Quick Deposit"
                        onClick={(e) => { e.stopPropagation(); setQuickDepositWallet(wallet); }}
                      >
                        <FaPlusCircle size={16} />
                      </Button>
                      <Button 
                        variant="light" 
                        className="text-danger rounded-circle p-0 d-flex align-items-center justify-content-center" 
                        style={{ width: '32px', height: '32px' }}
                        title="Delete"
                        onClick={(e) => handleDeleteClick(wallet.id, wallet.name, e)}
                      >
                        <FaTrash size={14} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-secondary small fw-medium">
                        {wallet.type === 'liability' ? 'Initial / Limit' : 'Balance'}
                      </span>
                      <span className="fw-bold">{formatCurrency(wallet.balance)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-secondary small fw-medium">Spent</span>
                      <span className="text-danger fw-bold">{formatCurrency(wallet.spent)}</span>
                    </div>
                  </div>
                  
                  <div className="border-top pt-3 d-flex justify-content-between align-items-center">
                    <span className="text-secondary fw-bold small">
                      {wallet.type === 'liability' ? 'CURRENT DEBT' : 'AVAILABLE'}
                    </span>
                    <Badge 
                      bg={wallet.type === 'liability' ? (wallet.remaining > 0 ? 'warning' : 'success') : (wallet.remaining < 0 ? 'danger' : 'success')} 
                      className="px-3 py-2 rounded-pill fw-medium"
                      style={{ fontSize: '0.9rem' }}
                    >
                      {formatCurrency(wallet.remaining)}
                    </Badge>
                  </div>
                  {wallet.type === 'liability' && wallet.remaining > 0 && (
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="w-100 mt-3 rounded-pill"
                      onClick={(e) => { e.stopPropagation(); setShowTransferModal(true); }}
                    >
                      <FaExchangeAlt className="me-2" /> Settle Bill
                    </Button>
                  )}
                </Card.Body>
                {/* Progress Bar Visual */}
                <div className="position-absolute bottom-0 start-0 w-100" style={{ height: '4px', background: '#f0f0f0' }}>
                   <div 
                      style={{ 
                        width: `${Math.min((wallet.spent / (wallet.balance || 1)) * 100, 100)}%`, 
                        height: '100%', 
                        background: wallet.type === 'liability' ? 'var(--warning-gradient, #f59e0b)' : (wallet.remaining < 0 ? 'var(--danger-gradient)' : 'var(--primary-gradient)') 
                      }} 
                   />
                </div>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      <ConfirmModal 
        show={!!confirmDelete}
        onHide={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Wallet"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? All transaction records for this wallet will remain in history but the wallet will be removed.`}
      />

      <QuickDepositModal 
        show={!!quickDepositWallet}
        onHide={() => setQuickDepositWallet(null)}
        wallet={quickDepositWallet}
      />

      <TransferModal 
        show={showTransferModal}
        onHide={() => setShowTransferModal(false)}
      />

      {/* Wallet Details Modal */}
      <Modal 
        show={!!selectedWallet} 
        onHide={() => setSelectedWallet(null)}
        centered
        fullscreen="md-down"
        size="xl"
        contentClassName={isDarkMode ? 'bg-dark text-white' : ''}
      >
        <Modal.Header closeButton className={isDarkMode ? 'border-secondary' : ''}>
          <Modal.Title className="d-flex align-items-center gap-2">
            <FaWallet className="text-primary" />
            <span className="fw-bold">{selectedWallet?.name}</span>
            <Badge bg={selectedWallet?.type === 'liability' ? 'warning' : 'success'} className="ms-2 rounded-pill" style={{ fontSize: '0.7rem' }}>
              {selectedWallet?.type === 'liability' ? 'Liability' : 'Asset'}
            </Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={isDarkMode ? 'bg-dark' : 'bg-light'}>
          {selectedWallet && (
             <div className="container-fluid px-0">
               <Row className="mb-4">
                 <Col md={6} xl={4} className="mb-3 mb-md-0">
                    <Card className={`h-100 border-0 shadow-sm ${isDarkMode ? 'bg-secondary text-white' : 'bg-white'}`}>
                      <Card.Body>
                        <small className="text-uppercase fw-bold opacity-75">Current Balance</small>
                        <h2 className="fw-bold my-2 text-primary">{formatCurrency(selectedWallet.balance)}</h2>
                        <div className="d-flex justify-content-between small opacity-75">
                           <span>Start: {formatCurrency(Number(selectedWallet.balance) + Number(selectedWallet.spent || 0))}</span>
                           <span>Used: {formatCurrency(selectedWallet.spent || 0)}</span>
                        </div>
                      </Card.Body>
                    </Card>
                 </Col>
                 <Col md={6} xl={8}>
                    <div className="d-flex gap-2 h-100 align-items-center flex-wrap">
                      <Button variant="success" className="flex-grow-1 h-100 rounded-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" onClick={() => setQuickDepositWallet(selectedWallet)}>
                         <FaPlusCircle /> Add Funds
                      </Button>
                      <Button variant="primary" className="flex-grow-1 h-100 rounded-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" onClick={() => setShowTransferModal(true)}>
                         <FaExchangeAlt /> Transfer
                      </Button>
                    </div>
                 </Col>
               </Row>
               
               <h5 className="fw-bold mb-3 opacity-75"><FaHistory className="me-2" /> Activity History</h5>
               <TransactionHistory walletId={selectedWallet.id} />
             </div>
          )}
        </Modal.Body>
      </Modal>
    </motion.div>
  );
};

export default WalletPanel;