import React, { useState } from 'react';
import { Table, Button, Badge } from 'react-bootstrap';
import { FaTrash, FaEdit } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import EditMealModal from './EditMealModal';
import ConfirmModal from './ConfirmModal';

const MealsTable = ({ data }) => {
  const { deleteMeal } = useApp();
  const [editingMeal, setEditingMeal] = useState(null);
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
      deleteMeal(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  if (data.length === 0) {
    return <div className="text-center p-3 text-muted">No meals found for this selection.</div>;
  }

  return (
    <>
      <div className="table-responsive">
        <Table hover className="align-middle">
          <thead className="bg-light">
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Item</th>
              <th>Amount</th>
              <th>Wallet</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((meal) => (
              <tr key={meal.id}>
                <td>{meal.date}</td>
                <td><Badge bg="info" text="dark">{meal.mealType}</Badge></td>
                <td className="fw-medium">{meal.item}</td>
                <td>{formatCurrency(meal.amount)}</td>
                <td><small className="text-muted">{meal.walletName}</small></td>
                <td>
                  <Button 
                    variant="link" 
                    className="text-primary p-0 me-2"
                    onClick={() => setEditingMeal(meal)}
                  >
                    <FaEdit />
                  </Button>
                  <Button 
                    variant="link" 
                    className="text-danger p-0"
                    onClick={() => handleDeleteClick(meal.id, meal.item)}
                  >
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <EditMealModal 
        show={!!editingMeal} 
        onHide={() => setEditingMeal(null)} 
        meal={editingMeal} 
      />

      <ConfirmModal 
        show={!!confirmDelete}
        onHide={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Meal Record"
        message={`Delete "${confirmDelete?.item}"?`}
      />
    </>
  );
};

export default MealsTable;
