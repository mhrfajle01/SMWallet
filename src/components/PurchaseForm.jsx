import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import StatusModal from './StatusModal';

const PurchaseForm = () => {
  const { wallets, addPurchase, categories } = useApp();
  const [status, setStatus] = useState({ show: false, message: '' });
  
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    date: today,
    category: categories[0]?.id || 'Other',
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
      newBalance: selectedWallet?.type === 'liability'
        ? (selectedWallet?.remaining || 0) + amountNum
        : (selectedWallet?.remaining || 0) - amountNum
    });

    await addPurchase({
      ...formData,
      month: formData.date.substring(0, 7), // YYYY-MM
      walletName: selectedWallet ? selectedWallet.name : 'Unknown'
    });

    setFormData({
      ...formData,
      item: '',
      amount: ''
    });
    
    setStatus({ show: true, type: 'success', message: 'Purchase added successfully!' });
  };

  return (
    <>
      <Form onSubmit={handleSubmit}>
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
          <Form.Label>Category</Form.Label>
          <Form.Select 
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Item</Form.Label>
          <Form.Control 
            type="text" 
            placeholder="e.g. Milk, Notebook"
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
              <option key={w.id} value={w.id}>
                {w.name} ({w.type === 'liability' ? `Debt: ${w.remaining}` : `Avail: ${w.remaining}`})
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Button type="submit" className="w-100 btn-success">
          Add Purchase
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

export default PurchaseForm;
