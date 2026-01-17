import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Nav, Button, Form, InputGroup } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import MealForm from './MealForm';
import PurchaseForm from './PurchaseForm';
import IncomeForm from './IncomeForm';
import { playSound } from '../utils/soundEffects';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMagic, FaHistory, FaCheck, FaTimes } from 'react-icons/fa';

const AddTransactionModal = ({ show, onHide }) => {
  const { wallets, addPurchase, addMeal, getSmartRecents, categories, meals, purchases } = useApp();
  const { isDarkMode } = useTheme();
  const [activeType, setActiveType] = useState('magic'); // 'magic', 'meal', 'purchase', 'income'
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
  
  // Magic Bar State
  const [magicInput, setMagicInput] = useState('');
  const [parsed, setParsed] = useState({ amount: 0, item: '', valid: false });

  const smartRecents = useMemo(() => getSmartRecents(), [show, meals, purchases]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (show) {
      playSound('pop');
      setMagicInput('');
      setParsed({ amount: 0, item: '', valid: false });
      setActiveType('magic');
    }
  }, [show]);

  // Magic Bar Parser Logic
  useEffect(() => {
    const parts = magicInput.trim().split(/\s+/);
    let amount = 0;
    let itemParts = [];

    parts.forEach(p => {
      const num = parseFloat(p);
      if (!isNaN(num) && amount === 0) {
        amount = num;
      } else {
        itemParts.push(p);
      }
    });

    const item = itemParts.join(' ');
    setParsed({
      amount,
      item,
      valid: amount > 0 && item.length > 0
    });
  }, [magicInput]);

  const handleQuickEntry = async (temp) => {
    if (wallets.length === 0) return alert("Create a wallet first!");
    const defaultWallet = wallets[0];
    const today = new Date().toISOString().split('T')[0];

    try {
      if (temp.type === 'meal') {
        await addMeal({
          date: today, mealType: temp.mType || 'Snack', item: temp.label,
          amount: temp.amount, walletId: defaultWallet.id, walletName: defaultWallet.name,
          month: today.substring(0, 7)
        });
      } else {
        await addPurchase({
          date: today, category: temp.cat || 'Other', item: temp.label,
          amount: temp.amount, walletId: defaultWallet.id, walletName: defaultWallet.name,
          month: today.substring(0, 7)
        });
      }
      playSound('success');
      onHide();
    } catch (e) { console.error(e); }
  };

  const handleMagicSubmit = async (e) => {
    e.preventDefault();
    if (!parsed.valid) return;

    if (wallets.length === 0) return alert("Create a wallet first!");
    const defaultWallet = wallets[0];
    const today = new Date().toISOString().split('T')[0];

    // Auto-category matching based on recents
    const match = smartRecents.find(r => r.label.toLowerCase() === parsed.item.toLowerCase());
    const category = match ? match.cat : 'Other';

    try {
      await addPurchase({
        date: today, category, item: parsed.item,
        amount: parsed.amount, walletId: defaultWallet.id,
        walletName: defaultWallet.name, month: today.substring(0, 7)
      });
      playSound('success');
      onHide();
    } catch (e) { console.error(e); }
  };

  return (
    <Modal 
      show={show} onHide={onHide} centered 
      dialogClassName={!isDesktop ? "modal-dialog-bottom" : ""}
      contentClassName={!isDesktop ? "modal-content-bottom" : "rounded-4 border-0 shadow-lg"}
    >
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="w-100">
          <Nav variant="pills" className="w-100 justify-content-center p-1 p-md-2 rounded-pill mb-3" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
            <Nav.Item style={{ flex: 1 }}>
              <Nav.Link active={activeType === 'magic'} onClick={() => setActiveType('magic')} className="rounded-pill text-center small py-2">Magic</Nav.Link>
            </Nav.Item>
            <Nav.Item style={{ flex: 1 }}>
              <Nav.Link active={activeType === 'meal'} onClick={() => setActiveType('meal')} className="rounded-pill text-center small py-2 text-primary">Meal</Nav.Link>
            </Nav.Item>
            <Nav.Item style={{ flex: 1 }}>
              <Nav.Link active={activeType === 'purchase'} onClick={() => setActiveType('purchase')} className="rounded-pill text-center small py-2 text-danger">Spend</Nav.Link>
            </Nav.Item>
            <Nav.Item style={{ flex: 1 }}>
              <Nav.Link active={activeType === 'income'} onClick={() => setActiveType('income')} className="rounded-pill text-center small py-2 text-success">Income</Nav.Link>
            </Nav.Item>
          </Nav>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-3 px-md-4 pb-4 pt-0">
        {activeType === 'magic' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-4">
              <small className="text-muted fw-bold text-uppercase d-flex align-items-center gap-2 mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                <FaHistory className="text-primary" /> Frequent Items
              </small>
              <div className="d-flex gap-2 overflow-auto py-2 scrollbar-hidden" style={{ whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
                {smartRecents.map((r, i) => (
                  <motion.button
                    key={i} whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickEntry(r)}
                    className="btn border-0 rounded-pill px-3 py-2 shadow-sm d-flex align-items-center gap-2"
                    style={{ 
                      background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#ffffff', 
                      fontSize: '0.85rem', 
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)' 
                    }}
                  >
                    <span>{r.label}</span>
                    <span className="fw-bold text-primary opacity-75">{r.amount}</span>
                  </motion.button>
                ))}
                {smartRecents.length === 0 && <small className="text-muted opacity-50 py-2">No frequent items yet...</small>}
              </div>
            </div>

            <Form onSubmit={handleMagicSubmit}>
              <Form.Label className="small fw-bold text-muted uppercase mb-2">Magic Bar</Form.Label>
              <InputGroup className="shadow-sm rounded-4 overflow-hidden border-0" style={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                <InputGroup.Text className="bg-transparent border-0 text-primary ps-3 pe-2">
                  <FaMagic size={18} />
                </InputGroup.Text>
                <Form.Control
                  autoFocus
                  placeholder="Try '100 Coffee' or 'Rickshaw 30'"
                  className="bg-transparent border-0 py-3 fw-medium shadow-none"
                  style={{ color: 'var(--text-primary)', fontSize: '1rem' }}
                  value={magicInput}
                  onChange={(e) => setMagicInput(e.target.value)}
                />
              </InputGroup>
              
              <AnimatePresence>
                {magicInput && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 px-2">
                    <div className={`d-flex align-items-center gap-2 small ${parsed.valid ? 'text-success' : 'text-muted'}`}>
                      {parsed.valid ? <FaCheck /> : <FaTimes />}
                      <span>
                        {parsed.valid 
                          ? `Adding BDT ${parsed.amount} for "${parsed.item}"` 
                          : "Type amount and item name..."}
                      </span>
                    </div>
                    {parsed.valid && (
                      <Button type="submit" variant="primary" className="w-100 mt-3 py-2 btn-primary-custom rounded-pill shadow-lg fw-bold">
                        Quick Save
                      </Button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Form>
          </motion.div>
        )}

        {activeType === 'meal' && <MealForm />}
        {activeType === 'purchase' && <PurchaseForm />}
        {activeType === 'income' && <IncomeForm />}
      </Modal.Body>
    </Modal>
  );
};

export default AddTransactionModal;