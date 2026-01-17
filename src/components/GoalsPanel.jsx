import React, { useState } from 'react';
import { Card, Row, Col, ProgressBar, Button } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { FaFlag, FaEdit, FaTrash, FaPlus, FaPiggyBank, FaHistory } from 'react-icons/fa';
import { motion } from 'framer-motion';
import EditGoalModal from './EditGoalModal';
import DepositModal from './DepositModal';
import GoalHistoryModal from './GoalHistoryModal';
import ConfirmModal from './ConfirmModal';

const GoalsPanel = ({ onOpenCreateModal }) => {
  const context = useApp();
  const goals = context?.goals || [];
  const deleteGoal = context?.deleteGoal;

  const [editingGoal, setEditingGoal] = useState(null);
  const [depositingGoal, setDepositingGoal] = useState(null);
  const [historyGoal, setHistoryGoal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
      }).format(Number(amount) || 0);
    } catch (e) {
      return (Number(amount) || 0) + ' BDT';
    }
  };

  const handleDeleteClick = (id, name) => {
    setConfirmDelete({ id, name });
  };

  const handleConfirmDelete = () => {
    if (confirmDelete && deleteGoal) {
      deleteGoal(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  // If context is missing, show error instead of blank
  if (!context) {
    return <div className="p-5 text-center text-danger">Error: App Context not found.</div>;
  }

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
        <h4 className="fw-bold mb-0">Savings Goals</h4>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            variant="primary" 
            onClick={onOpenCreateModal} 
            className="btn-primary-custom shadow-sm d-flex align-items-center"
          >
            <FaPlus className="me-2" /> New Goal
          </Button>
        </motion.div>
      </div>

      <Row>
        {goals.map((goal) => {
          if (!goal) return null;
          
          const saved = Number(goal.savedAmount || 0);
          const target = Number(goal.targetAmount || 1);
          const progress = Math.min((saved / target) * 100, 100);
          
          return (
            <Col key={goal.id || Math.random()} md={6} xl={4} className="mb-4">
              <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
                <Card className="custom-card border-0 h-100">
                  <Card.Body className="p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center">
                       <div className="bg-success bg-opacity-10 rounded-circle p-2 me-2 text-success">
                         <FaFlag />
                       </div>
                       <h5 className="fw-bold mb-0">{goal.name || 'Unnamed Goal'}</h5>
                    </div>
                    <div className="d-flex gap-1">
                      <Button 
                        variant="link" 
                        className="text-secondary p-1" 
                        onClick={() => setHistoryGoal(goal)}
                      >
                        <FaHistory />
                      </Button>
                      <Button 
                        variant="link" 
                        className="text-primary p-1" 
                        onClick={() => setEditingGoal(goal)}
                      >
                        <FaEdit />
                      </Button>
                      <Button 
                        variant="link" 
                        className="text-danger p-1" 
                        onClick={() => handleDeleteClick(goal.id, goal.name)}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between small mb-1">
                    <span className="text-muted">Saved: {formatCurrency(saved)}</span>
                    <span className="fw-bold">{formatCurrency(target)}</span>
                  </div>

                  <ProgressBar 
                    now={progress || 0} 
                    variant="success" 
                    className="rounded-pill mb-4" 
                    style={{ height: '8px' }} 
                  />
                  
                  <div className="mt-auto d-flex justify-content-between align-items-center">
                     <small className="text-muted fw-medium">{Math.round(progress || 0)}% Reached</small>
                     <Button 
                       size="sm" 
                       variant="success" 
                       className="rounded-pill px-3 d-flex align-items-center text-white border-0 shadow-sm"
                       onClick={() => setDepositingGoal(goal)}
                       style={{ background: 'var(--success-gradient)' }}
                     >
                       <FaPiggyBank className="me-2" /> Deposit
                     </Button>
                  </div>
                </Card.Body>
              </Card>
              </motion.div>
            </Col>
          );
        })}
        {goals.length === 0 && (
           <Col xs={12}>
             <div className="text-center p-5 bg-light rounded-4 border border-dashed">
                <FaPiggyBank size={48} className="text-muted mb-3 opacity-50" />
                <h5 className="text-muted mb-2">No savings goals yet</h5>
                <p className="text-muted small mb-0">Create a goal to start saving!</p>
             </div>
           </Col>
        )}
      </Row>

      {/* Modals - Rendered only if target data exists to be safe */}
      {editingGoal && (
        <EditGoalModal 
          show={!!editingGoal} 
          onHide={() => setEditingGoal(null)} 
          goal={editingGoal} 
        />
      )}

      {depositingGoal && (
        <DepositModal
          show={!!depositingGoal}
          onHide={() => setDepositingGoal(null)}
          goal={depositingGoal}
        />
      )}

      {historyGoal && (
        <GoalHistoryModal
          show={!!historyGoal}
          onHide={() => setHistoryGoal(null)}
          goal={historyGoal}
        />
      )}

      <ConfirmModal 
        show={!!confirmDelete}
        onHide={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Savings Goal"
        message={`Are you sure you want to delete "${confirmDelete?.name}"?`}
      />
    </motion.div>
  );
};

export default GoalsPanel;