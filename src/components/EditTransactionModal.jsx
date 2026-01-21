import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Nav, Row, Col } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { playSound } from '../utils/soundEffects';
import { FaUtensils, FaShoppingCart, FaArrowDown } from 'react-icons/fa';

const EditTransactionModal = ({ show, onHide, transaction }) => {
  const { 
    wallets, categories, 
    updateMeal, updatePurchase, updateIncome,
    addMeal, addPurchase, addIncome,
    deleteMeal, deletePurchase, deleteIncome 
  } = useApp();
  
  // 'meal', 'purchase', 'income'
  const [type, setType] = useState('purchase'); 
  
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    item: '',
    amount: '',
    walletId: '',
    category: 'Other',
    mealType: 'Snack',
    source: 'Salary' // For Income
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      let initialType = 'purchase';
      if (transaction.rawType === 'meal') initialType = 'meal';
      if (transaction.rawType === 'income') initialType = 'income';
      
      setType(initialType);
      setFormData({
        date: transaction.date || '',
        time: transaction.time || '',
        item: transaction.item || transaction.label || '', // Income uses 'label' or 'source' sometimes
        amount: transaction.amount || '',
        walletId: transaction.walletId || '',
        category: transaction.category || 'Other',
        mealType: transaction.mealType || 'Snack',
        source: transaction.source || 'Salary'
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
      
      // If type changed, we must delete old and create new
      if (isTypeChanged) {
        // 1. Delete Old
        if (transaction.rawType === 'meal') await deleteMeal(transaction.id);
        else if (transaction.rawType === 'purchase') await deletePurchase(transaction.id);
        else if (transaction.rawType === 'income') await deleteIncome(transaction.id, transaction.walletId, transaction.amount);

        // 2. Create New
        if (type === 'meal') {
          await addMeal({ ...formData, walletName, month });
        } else if (type === 'purchase') {
          await addPurchase({ ...formData, walletName, month });
        } else if (type === 'income') {
          await addIncome({ 
            date: formData.date,
            time: formData.time,
            source: formData.source || formData.item, // Use item input as source if switched
            amount: formData.amount,
            walletId: formData.walletId,
            walletName
          });
        }
      } else {
        // Just Update
        if (type === 'meal') {
          await updateMeal(transaction.id, { ...formData, walletName, month });
        } else if (type === 'purchase') {
          await updatePurchase(transaction.id, { ...formData, walletName, month });
        } else if (type === 'income') {
           // Pass old data to handle wallet reversion
           await updateIncome(transaction.id, 
             { walletId: transaction.walletId, amount: transaction.amount }, 
             { 
                date: formData.date,
                time: formData.time,
                source: formData.source || formData.item,
                amount: formData.amount,
                walletId: formData.walletId,
                walletName
             }
           );
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
                <FaShoppingCart size={14} /> Spend
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
             <Nav.Item className="flex-grow-1">
              <Nav.Link 
                active={type === 'income'} 
                onClick={() => setType('income')}
                className="rounded-pill text-center py-2 d-flex align-items-center justify-content-center gap-2"
              >
                <FaArrowDown size={14} /> Income
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </div>

        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col xs={12}>
              {type === 'income' ? (
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted uppercase">Source</Form.Label>
                  <Form.Select 
                     value={formData.source}
                     onChange={(e) => setFormData({...formData, source: e.target.value})}
                     className="py-2"
                  >
                    <option>Salary</option>
                    <option>Freelance</option>
                    <option>Gift</option>
                    <option>Business</option>
                    <option>Other</option>
                  </Form.Select>
                </Form.Group>
              ) : (
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
              )}
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

            <Col xs={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted uppercase">Time</Form.Label>
                <Form.Control 
                  type="text" 
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  placeholder="e.g. 10:30 AM"
                  required
                  className="py-2"
                />
              </Form.Group>
            </Col>

            <Col xs={12}>
              {type === 'meal' && (
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
              )}
              
              {type === 'purchase' && (
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
                <Form.Label className="small fw-bold text-muted uppercase">{type === 'income' ? 'Deposit To Wallet' : 'Paid From Wallet'}</Form.Label>
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
