import React, { useState } from 'react';
import { Card, Row, Col, Button, Badge } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { FaWallet, FaTrash, FaArrowUp, FaArrowDown, FaCoins, FaPlusCircle, FaExchangeAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import ConfirmModal from './ConfirmModal';
import QuickDepositModal from './QuickDepositModal';
import TransferModal from './TransferModal';

const WalletPanel = ({ onOpenCreateModal }) => {
  const { globalStats, wallets, deleteWallet } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [quickDepositWallet, setQuickDepositWallet] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

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
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <span className="glass-pill mb-2 d-inline-block">Total Net Worth</span>
                <div className="balance-amount fw-bold mt-2">
                  <span className="opacity-50 me-2" style={{ fontSize: '0.5em' }}>BDT</span>
                  {globalStats.totalBalance.toLocaleString('en-BD')}
                </div>
              </div>
              <div className="text-end d-none d-md-block">
                <div className="opacity-75 small">Monthly Spend Health</div>
                <Badge bg={globalStats.totalRemaining < 0 ? 'danger' : 'success'} className="mt-1 rounded-pill">
                  {globalStats.totalRemaining < 0 ? 'Over Budget' : 'Stable'}
                </Badge>
              </div>
            </div>

            {/* Distribution Bar */}
            <div className="mb-4">
              <div className="d-flex justify-content-between small mb-2 opacity-75">
                <span>Wallet Distribution</span>
                <span>{wallets.length} active wallets</span>
              </div>
              <div className="distribution-bar">
                {wallets.map((w, index) => {
                  const colors = ['#ffffff', '#ffd700', '#48bb78', '#f56565', '#ed64a6', '#9f7aea'];
                  const width = (w.balance / (globalStats.totalBalance || 1)) * 100;
                  return (
                    <div 
                      key={w.id} 
                      className="distribution-segment" 
                      style={{ 
                        width: `${width}%`, 
                        backgroundColor: colors[index % colors.length],
                        opacity: 0.8
                      }} 
                      title={`${w.name}: ${w.balance}`}
                    />
                  );
                })}
              </div>
            </div>

            <Row className="g-3">
              <Col xs={6} md={4}>
                <div className="p-3 rounded-4" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="opacity-75 small mb-1">Total Spent</div>
                  <h4 className="fw-bold mb-0">{formatCurrency(globalStats.totalSpent)}</h4>
                </div>
              </Col>
              <Col xs={6} md={4}>
                <div className="p-3 rounded-4" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="opacity-75 small mb-1">Remaining</div>
                  <h4 className="fw-bold mb-0">{formatCurrency(globalStats.totalRemaining)}</h4>
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
                      <span className="text-secondary small fw-medium">Balance</span>
                      <span className="fw-bold">{formatCurrency(wallet.balance)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-secondary small fw-medium">Spent</span>
                      <span className="text-danger fw-bold">{formatCurrency(wallet.spent)}</span>
                    </div>
                  </div>
                  
                  <div className="border-top pt-3 d-flex justify-content-between align-items-center">
                    <span className="text-secondary fw-bold small">AVAILABLE</span>
                    <Badge 
                      bg={wallet.remaining < 0 ? 'danger' : 'success'} 
                      className="px-3 py-2 rounded-pill fw-medium"
                      style={{ fontSize: '0.9rem' }}
                    >
                      {formatCurrency(wallet.remaining)}
                    </Badge>
                  </div>
                </Card.Body>
                {/* Progress Bar Visual */}
                <div className="position-absolute bottom-0 start-0 w-100" style={{ height: '4px', background: '#f0f0f0' }}>
                   <div 
                      style={{ 
                        width: `${Math.min((wallet.spent / wallet.balance) * 100, 100)}%`, 
                        height: '100%', 
                        background: wallet.remaining < 0 ? 'var(--danger-gradient)' : 'var(--primary-gradient)' 
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
    </motion.div>
  );
};

export default WalletPanel;