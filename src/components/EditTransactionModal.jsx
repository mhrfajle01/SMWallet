import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Nav, Row, Col } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { playSound } from '../utils/soundEffects';
import { FaUtensils, FaShoppingCart, FaExchangeAlt } from 'react-icons/fa';

const EditTransactionModal = ({ show, onHide, transaction }) => {
  const { wallets, categories, updateMeal, updatePurchase, addMeal, addPurchase, deleteMeal, deletePurchase } = useApp();
  
  // Local state for the unified form
  const [type, setType] = useState('purchase'); // 'meal' or 'purchase'
  const [formData, setFormData] = useState({
    date: '',
    item: '',
    amount: '',
    walletId: '',
    category: 'Other',
    mealType: 'Snack'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setType(transaction.rawType === 'meal' ? 'meal' : 'purchase');
      setFormData({
        date: transaction.date || '',
        item: transaction.item || '',
        amount: transaction.amount || '',
        walletId: transaction.walletId || '',
        category: transaction.category || 'Other',
        mealType: transaction.mealType || 'Snack'
      });
    }
  }, [transaction]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const selectedWallet = wallets.find(w => w.id === formData.walletId);
    const walletName = selectedWallet ? selectedWallet.name : 'Unknown';
    const month = formData.date.substring(0, 7);

    try {
      const isTypeChanged = type !== transaction.rawType;

      if (isTypeChanged) {
        // 1. Delete from old collection
        if (transaction.rawType === 'meal') await deleteMeal(transaction.id);
        else await deletePurchase(transaction.id);

        // 2. Add to new collection
        if (type === 'meal') {
          await addMeal({ ...formData, walletName, month });
        } else {
          await addPurchase({ ...formData, walletName, month });
        }
      } else {
        // Just update in current collection
        if (type === 'meal') {
          await updateMeal(transaction.id, { ...formData, walletName, month });
        } else {
          await updatePurchase(transaction.id, { ...formData, walletName, month });
        }
      }

      playSound('success');
      onHide();
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered contentClassName="border-0 shadow-lg rounded-4">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">Edit Transaction</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        {/* Type Switcher */}
        <div className="mb-4">
          <small className="text-muted fw-bold text-uppercase d-block mb-2" style={{ fontSize: '0.65rem' }}>Transaction Type</small>
          <Nav variant="pills" className="bg-light rounded-pill p-1" style={{ background: 'var(--bg-color)' }}>
            <Nav.Item className="flex-grow-1">
              <Nav.Link 
                active={type === 'purchase'} 
                onClick={() => setType('purchase')}
                className="rounded-pill text-center py-2 d-flex align-items-center justify-content-center gap-2"
              >
                <FaShoppingCart size={14} /> General
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className="flex-grow-1">
              <Nav.Link 
                active={type === 'meal'} 
                onClick={() => setType('meal')}
                className="rounded-pill text-center py-2 d-flex align-items-center justify-content-center gap-2"
              >
                <FaUtensils size={14} /> Meal
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </div>

        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted uppercase">Item Name</Form.Label>
                <Form.Control 
                  type="text" 
                  value={formData.item}
                  onChange={(e) => setFormData({...formData, item: e.target.value})}
                  required
                  className="py-2"
                />
              </Form.Group>
            </Col>

            <Col xs={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted uppercase">Amount (BDT)</Form.Label>
                <Form.Control 
                  type="number" 
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                  className="py-2 fw-bold text-primary"
                />
              </Form.Group>
            </Col>

            <Col xs={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted uppercase">Date</Form.Label>
                <Form.Control 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                  className="py-2"
                />
              </Form.Group>
            </Col>

            <Col xs={12}>
              {type === 'meal' ? (
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted uppercase">Meal Type</Form.Label>
                  <Form.Select 
                    value={formData.mealType}
                    onChange={(e) => setFormData({...formData, mealType: e.target.value})}
                    className="py-2"
                  >
                    <option>Breakfast</option>
                    <option>Lunch</option>
                    <option>Dinner</option>
                    <option>Snack</option>
                  </Form.Select>
                </Form.Group>
              ) : (
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted uppercase">Category</Form.Label>
                  <Form.Select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="py-2"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </Form.Select>
                </Form.Group>
              )}
            </Col>

            <Col xs={12}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted uppercase">Paid From Wallet</Form.Label>
                <Form.Select 
                  value={formData.walletId}
                  onChange={(e) => setFormData({...formData, walletId: e.target.value})}
                  required
                  className="py-2"
                >
                  <option value="">Select Wallet...</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex gap-2 mt-2">
            <Button variant="light" className="flex-grow-1 py-2 rounded-pill" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="flex-grow-1 py-2 rounded-pill btn-primary-custom fw-bold" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditTransactionModal;