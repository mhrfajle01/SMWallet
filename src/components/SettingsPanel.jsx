import React, { useState } from 'react';
import { Card, Button, Modal, ListGroup } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FaTrash, FaExclamationTriangle, FaMoon, FaSun, FaUser, FaSignOutAlt, FaShieldAlt, FaBell } from 'react-icons/fa';

const SettingsPanel = () => {
  const { wallets, meals, purchases, incomes, transfers, goals, goalDeposits, budgets, deleteWallet, deleteMeal, deletePurchase, deleteIncome, deleteTransfer, deleteGoal, deleteGoalDeposit, deleteBudget } = useApp();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const handleClearAllData = async () => {
    setIsDeleting(true);
    try {
      for (const i of incomes) await deleteIncome(i.id, i.walletId, i.amount);
      for (const t of transfers) await deleteTransfer(t.id, t.sourceId, t.destId, t.amount);
      for (const gd of goalDeposits) await deleteGoalDeposit(gd.id, gd.goalId, gd.walletId, gd.amount);
      for (const m of meals) await deleteMeal(m.id);
      for (const p of purchases) await deletePurchase(p.id);
      for (const g of goals) await deleteGoal(g.id);
      for (const b of budgets) await deleteBudget(b.id);
      for (const w of wallets) await deleteWallet(w.id);
    } catch (error) {
      console.error("Error clearing data:", error);
      alert("Failed to clear some data. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="pb-5"
    >
      <motion.h4 variants={itemVariants} className="fw-bold mb-4">Settings</motion.h4>

      {/* User Profile Card */}
      <motion.div variants={itemVariants}>
        <Card className="custom-card border-0 mb-4 shadow-sm overflow-hidden">
          <Card.Header className="bg-primary bg-opacity-10 border-0 p-4">
            <div className="d-flex align-items-center">
              <div className="bg-primary rounded-circle p-3 text-white me-3 shadow-sm">
                <FaUser size={24} />
              </div>
              <div>
                <h5 className="fw-bold mb-1">{user?.displayName || user?.email?.split('@')[0]}</h5>
                <p className="text-muted small mb-0">{user?.email}</p>
              </div>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <ListGroup variant="flush">
              <ListGroup.Item className="p-4 border-0 bg-transparent">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className={`rounded-circle p-2 me-3 ${isDarkMode ? 'bg-white bg-opacity-10 text-warning' : 'bg-warning bg-opacity-10 text-warning'}`}>
                      {isDarkMode ? <FaSun /> : <FaMoon />}
                    </div>
                    <div>
                      <div className="fw-bold">Appearance</div>
                      <small className="text-muted">Switch between light and dark themes</small>
                    </div>
                  </div>
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button 
                      variant={isDarkMode ? "warning" : "outline-primary"} 
                      onClick={toggleTheme}
                      className="rounded-pill px-4"
                    >
                      {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    </Button>
                  </motion.div>
                </div>
              </ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Card>
      </motion.div>

      {/* Security & Notifications */}
      <motion.div variants={itemVariants}>
        <Card className="custom-card border-0 mb-4 shadow-sm">
          <Card.Body className="p-0">
            <ListGroup variant="flush">
              <ListGroup.Item className="p-4 border-0 bg-transparent">
                <div className="d-flex align-items-center">
                  <div className="bg-info bg-opacity-10 text-info rounded-circle p-2 me-3">
                    <FaBell />
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-bold">Notifications</div>
                    <small className="text-muted">Smart alerts and reminders</small>
                  </div>
                  <Button variant="light" disabled className="rounded-pill opacity-50 px-3">Upcoming</Button>
                </div>
              </ListGroup.Item>
              <ListGroup.Item className="p-4 border-0 bg-transparent">
                <div className="d-flex align-items-center">
                  <div className="bg-success bg-opacity-10 text-success rounded-circle p-2 me-3">
                    <FaShieldAlt />
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-bold">Biometric Lock</div>
                    <small className="text-muted">Secure your financial data</small>
                  </div>
                  <Button variant="light" disabled className="rounded-pill opacity-50 px-3">Upcoming</Button>
                </div>
              </ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={itemVariants}>
        <Card className="custom-card border-0 shadow-sm border-danger border-opacity-10 mb-4">
          <Card.Body className="p-4">
            <div className="d-flex align-items-start mb-4">
              <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-3 me-3">
                <FaExclamationTriangle size={24} />
              </div>
              <div>
                <h5 className="fw-bold text-danger">Danger Zone</h5>
                <p className="text-muted small">
                  Factory reset will permanently wipe all your wallets, transactions, and goals.
                </p>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant="danger" 
                    onClick={() => setShowConfirm(true)}
                    disabled={isDeleting}
                    className="rounded-pill px-4"
                  >
                    {isDeleting ? 'Clearing Data...' : 'Factory Reset'}
                  </Button>
                </motion.div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </motion.div>

      {/* Logout Card */}
      <motion.div variants={itemVariants}>
        <Card className="custom-card border-0 shadow-sm">
          <Card.Body className="p-4 d-flex justify-content-between align-items-center">
            <div>
              <h6 className="fw-bold mb-1">Session Management</h6>
              <p className="text-muted small mb-0">Sign out of your account on this device</p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline-danger" onClick={logout} className="rounded-pill px-4 d-flex align-items-center gap-2 border-0 bg-danger bg-opacity-10">
                <FaSignOutAlt /> Logout
              </Button>
            </motion.div>
          </Card.Body>
        </Card>
      </motion.div>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered contentClassName="border-0 shadow-lg rounded-4">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="text-danger fw-bold">Confirm Reset</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-4">
          <p className="text-muted mb-4">Are you sure you want to delete everything? This action is irreversible.</p>
          <div className="d-flex gap-2">
            <Button variant="light" className="flex-grow-1 rounded-pill" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button variant="danger" className="flex-grow-1 rounded-pill" onClick={handleClearAllData}>Delete All</Button>
          </div>
        </Modal.Body>
      </Modal>
    </motion.div>
  );
};

export default SettingsPanel;