import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useApp } from '../context/AppContext';

const EditMealModal = ({ show, onHide, meal }) => {
  const { wallets, updateMeal } = useApp();
  const [formData, setFormData] = useState({
    date: '',
    mealType: '',
    item: '',
    amount: '',
    walletId: ''
  });

  useEffect(() => {
    if (meal) {
      setFormData({
        date: meal.date,
        mealType: meal.mealType,
        item: meal.item,
        amount: meal.amount,
        walletId: meal.walletId
      });
    }
  }, [meal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedWallet = wallets.find(w => w.id === formData.walletId);
    
    await updateMeal(meal.id, {
      ...formData,
      month: formData.date.substring(0, 7),
      walletName: selectedWallet ? selectedWallet.name : 'Unknown'
    });
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Meal</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-2">
            <Form.Label>Date</Form.Label>
            <Form.Control 
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Type</Form.Label>
            <Form.Select 
              value={formData.mealType}
              onChange={(e) => setFormData({...formData, mealType: e.target.value})}
            >
              <option>Breakfast</option>
              <option>Lunch</option>
              <option>Dinner</option>
              <option>Snack</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Item</Form.Label>
            <Form.Control 
              type="text" 
              value={formData.item}
              onChange={(e) => setFormData({...formData, item: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Amount</Form.Label>
            <Form.Control 
              type="number" 
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Wallet</Form.Label>
            <Form.Select 
              value={formData.walletId}
              onChange={(e) => setFormData({...formData, walletId: e.target.value})}
              required
            >
              <option value="">Select Wallet...</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button variant="secondary" className="me-2" onClick={onHide}>Cancel</Button>
            <Button variant="primary" type="submit" className="btn-primary-custom">Save Changes</Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditMealModal;
