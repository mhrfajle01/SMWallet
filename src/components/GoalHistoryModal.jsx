import React, { useMemo } from 'react';
import { Modal, Table } from 'react-bootstrap';
import { useApp } from '../context/AppContext';

const GoalHistoryModal = ({ show, onHide, goal }) => {
  const { goalDeposits, wallets } = useApp();

  const history = useMemo(() => {
    if (!goal) return [];
    return goalDeposits.filter(d => d.goalId === goal.id);
  }, [goal, goalDeposits]);

  const getWalletName = (id) => {
    const w = wallets.find(wall => wall.id === id);
    return w ? w.name : 'Unknown';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
    }).format(amount);
  };

  return (
    <Modal show={show} onHide={onHide} centered contentClassName="modal-custom">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title>History: {goal?.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-2">
        {history.length === 0 ? (
          <p className="text-muted text-center py-4">No deposits yet.</p>
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 text-secondary small">Date</th>
                  <th className="border-0 text-secondary small">Source</th>
                  <th className="border-0 text-secondary small text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                {history.map((deposit) => (
                  <tr key={deposit.id}>
                    <td className="border-bottom-0">{deposit.date}</td>
                    <td className="border-bottom-0 small">{getWalletName(deposit.walletId)}</td>
                    <td className="border-bottom-0 text-end fw-bold text-success">
                      +{formatCurrency(deposit.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default GoalHistoryModal;
