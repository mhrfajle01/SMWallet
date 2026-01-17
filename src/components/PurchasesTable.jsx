import React, { useState } from 'react';
import { Table, Button, Badge } from 'react-bootstrap';
import { FaTrash, FaEdit } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import EditPurchaseModal from './EditPurchaseModal';
import ConfirmModal from './ConfirmModal';

const PurchasesTable = ({ data }) => {
  const { deletePurchase } = useApp();
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
    }).format(amount);
  };

  const handleDeleteClick = (id, item) => {
    setConfirmDelete({ id, item });
  };

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      deletePurchase(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  if (data.length === 0) {
    return <div className="text-center p-3 text-muted">No purchases found for this selection.</div>;
  }

  return (
    <>
      <div className="table-responsive">
        <Table hover className="align-middle">
          <thead className="bg-light">
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Item</th>
              <th>Amount</th>
              <th>Wallet</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((purchase) => (
              <tr key={purchase.id}>
                <td>{purchase.date}</td>
                <td><Badge bg="secondary">{purchase.category}</Badge></td>
                <td className="fw-medium">{purchase.item}</td>
                <td>{formatCurrency(purchase.amount)}</td>
                <td><small className="text-muted">{purchase.walletName}</small></td>
                <td>
                  <Button 
                    variant="link" 
                    className="text-primary p-0 me-2"
                    onClick={() => setEditingPurchase(purchase)}
                  >
                    <FaEdit />
                  </Button>
                  <Button 
                    variant="link" 
                    className="text-danger p-0"
                    onClick={() => handleDeleteClick(purchase.id, purchase.item)}
                  >
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <EditPurchaseModal 
        show={!!editingPurchase} 
        onHide={() => setEditingPurchase(null)} 
        purchase={editingPurchase} 
      />

      <ConfirmModal 
        show={!!confirmDelete}
        onHide={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Purchase Record"
        message={`Delete "${confirmDelete?.item}"?`}
      />
    </>
  );
};

export default PurchasesTable;
