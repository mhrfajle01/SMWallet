import React, { useState } from 'react';
import { Container, Card, Table, Button, Badge, Modal, Alert, Spinner } from 'react-bootstrap';
import { FaTrash, FaUndo, FaTrashAlt, FaExclamationTriangle } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

const TrashView = () => {
  const { trashItems, restoreFromTrash, deletePermanently, emptyTrash } = useApp();
  const [showConfirmEmpty, setShowConfirmEmpty] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString();
    } catch (e) {
      return 'Unknown';
    }
  };

  const getItemName = (item) => {
    const data = item?.data || {};
    return data.name || data.title || data.item || data.label || data.destination || 'Unnamed Item';
  };

  const getCollectionLabel = (coll) => {
    const labels = {
      meals: 'Meal',
      purchases: 'Purchase',
      incomes: 'Income',
      transfers: 'Transfer',
      goals: 'Savings Goal',
      goal_deposits: 'Goal Deposit',
      wallets: 'Wallet',
      habits: 'Habit',
      todos: 'Task',
      notes: 'Note',
      trips: 'Trip',
      shoppingList: 'Shopping Item'
    };
    return labels[coll] || coll;
  };

  const handleEmptyTrash = async () => {
    setIsDeletingAll(true);
    try {
      await emptyTrash();
    } catch (e) {
      console.error("Failed to empty trash:", e);
    } finally {
      setIsDeletingAll(false);
      setShowConfirmEmpty(false);
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Trash</h2>
          <p className="text-muted">Recover items you deleted or delete them permanently.</p>
        </div>
        {trashItems.length > 0 && (
          <Button 
            variant="outline-danger" 
            className="d-flex align-items-center gap-2 rounded-pill px-4"
            onClick={() => setShowConfirmEmpty(true)}
          >
            <FaTrashAlt /> Empty Trash
          </Button>
        )}
      </div>

      {trashItems.length === 0 ? (
        <Card className="border-0 shadow-sm p-5 text-center" style={{ background: 'var(--card-bg)', borderRadius: '1.5rem' }}>
          <div className="mb-3 opacity-25" style={{ color: 'var(--text-secondary)' }}>
            <FaTrash size={64} />
          </div>
          <h4 className="text-muted" style={{ color: 'var(--text-secondary) !important' }}>Your trash is empty</h4>
          <p className="text-muted mb-0" style={{ color: 'var(--text-secondary) !important' }}>Items you delete will appear here.</p>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden" style={{ background: 'var(--card-bg)', borderRadius: '1.5rem' }}>
          <Table responsive hover className="mb-0">
            <thead style={{ background: 'var(--bg-color)' }}>
              <tr>
                <th className="px-4 py-3 border-0" style={{ color: 'var(--text-secondary)' }}>Item</th>
                <th className="py-3 border-0" style={{ color: 'var(--text-secondary)' }}>Type</th>
                <th className="py-3 border-0" style={{ color: 'var(--text-secondary)' }}>Deleted At</th>
                <th className="py-3 border-0 text-end px-4" style={{ color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {trashItems.map((item) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    layout
                  >
                    <td className="px-4 py-3 align-middle">
                      <div className="fw-bold">{getItemName(item)}</div>
                      {item.data?.amount && (
                        <small className="text-muted">Amount: {item.data.amount}</small>
                      )}
                    </td>
                    <td className="py-3 align-middle">
                      <Badge bg="secondary" className="fw-normal bg-opacity-10 text-secondary border">
                        {getCollectionLabel(item.originalCollection)}
                      </Badge>
                    </td>
                    <td className="py-3 align-middle text-muted small">
                      {formatDate(item.deletedAt)}
                    </td>
                    <td className="py-3 align-middle text-end px-4">
                      <div className="d-flex justify-content-end gap-2">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          className="rounded-circle p-2 border-0 hover-bg"
                          onClick={() => restoreFromTrash(item)}
                          title="Restore"
                        >
                          <FaUndo size={14} />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          className="rounded-circle p-2 border-0 hover-bg"
                          onClick={() => deletePermanently(item.id)}
                          title="Delete Permanently"
                        >
                          <FaTrash size={14} />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </Table>
        </Card>
      )}

      {/* Confirm Empty Trash Modal */}
      <Modal show={showConfirmEmpty} onHide={() => setShowConfirmEmpty(false)} centered contentClassName="border-0 shadow-lg rounded-4">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Empty Trash?</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <FaExclamationTriangle size={48} className="text-warning mb-3" />
          <p className="mb-0 fs-5">This will permanently delete all <strong>{trashItems.length}</strong> items. This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" className="rounded-pill px-4" onClick={() => setShowConfirmEmpty(false)} disabled={isDeletingAll}>Cancel</Button>
          <Button variant="danger" className="rounded-pill px-4" onClick={handleEmptyTrash} disabled={isDeletingAll}>
            {isDeletingAll ? <Spinner size="sm" animation="border" className="me-2" /> : null}
            {isDeletingAll ? 'Emptying...' : 'Yes, Delete All'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TrashView;