import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import StatusModal from './StatusModal';

const MealForm = () => {
  const { wallets, addMeal } = useApp();
  const [status, setStatus] = useState({ show: false, message: '' });
  
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    date: today,
    mealType: 'Lunch',
    item: '',
    amount: '',
    walletId: ''
  });
  const [impactData, setImpactData] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.walletId) {
      setStatus({ show: true, type: 'error', message: 'Please select a wallet' });
      return;
    }

    const selectedWallet = wallets.find(w => w.id === formData.walletId);
    const amountNum = Number(formData.amount);
    
    setImpactData({
      walletName: selectedWallet?.name || 'Wallet',
      amount: amountNum,
      newBalance: (selectedWallet?.remaining || 0) - amountNum
    });

    await addMeal({
      ...formData,
      month: formData.date.substring(0, 7), // YYYY-MM
      walletName: selectedWallet ? selectedWallet.name : 'Unknown'
    });

    setFormData({
      ...formData,
      item: '',
      amount: ''
    });
    
    setStatus({ show: true, type: 'success', message: 'Meal added successfully!' });
  };

  return (
    <>
      <Form onSubmit={handleSubmit}>
        {/* ... existing form fields ... */}
        <Form.Group className="mb-2">
          <Form.Label>Date</Form.Label>
          <Form.Control 
            type="date" 
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Meal Type</Form.Label>
          <Form.Select 
            name="mealType"
            value={formData.mealType}
            onChange={handleChange}
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
            placeholder="e.g. Burger, Salad"
            name="item"
            value={formData.item}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Amount</Form.Label>
          <Form.Control 
            type="number" 
            placeholder="0.00"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Wallet</Form.Label>
          <Form.Select 
            name="walletId"
            value={formData.walletId}
            onChange={handleChange}
            required
          >
            <option value="">Select Wallet...</option>
            {wallets.map(w => (
              <option key={w.id} value={w.id}>{w.name} ({w.remaining})</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Button type="submit" className="w-100 btn-primary-custom">
          Add Meal
        </Button>
      </Form>

      <StatusModal 
        show={status.show} 
        onHide={() => setStatus({ ...status, show: false })}
        type={status.type}
        message={status.message}
        impactData={impactData}
      />
    </>
  );
};

export default MealForm;
