import React, { useState, useEffect } from 'react';
import { Modal, Nav } from 'react-bootstrap';
import MealForm from './MealForm';
import PurchaseForm from './PurchaseForm';
import IncomeForm from './IncomeForm';
import { playSound } from '../utils/soundEffects';

const AddTransactionModal = ({ show, onHide }) => {
  const [activeType, setActiveType] = useState('meal');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (show) playSound('pop');
  }, [show]);

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered 
      dialogClassName={!isDesktop ? "modal-dialog-bottom" : ""}
      contentClassName={!isDesktop ? "modal-content-bottom" : "rounded-4 border-0 shadow-lg"}
    >
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="w-100">
          <Nav variant="pills" className="w-100 justify-content-center p-2 bg-light rounded-pill">
            <Nav.Item className="w-33 text-center" style={{ flex: 1 }}>
              <Nav.Link 
                active={activeType === 'meal'} 
                onClick={() => setActiveType('meal')}
                className={`rounded-pill ${activeType === 'meal' ? 'shadow-sm' : 'text-muted'}`}
              >
                Meal
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className="w-33 text-center" style={{ flex: 1 }}>
              <Nav.Link 
                active={activeType === 'purchase'} 
                onClick={() => setActiveType('purchase')}
                className={`rounded-pill ${activeType === 'purchase' ? 'bg-danger text-white shadow-sm' : 'text-muted'}`}
                style={activeType === 'purchase' ? {background: 'var(--danger-gradient)'} : {}}
              >
                Purchase
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className="w-33 text-center" style={{ flex: 1 }}>
              <Nav.Link 
                active={activeType === 'income'} 
                onClick={() => setActiveType('income')}
                className={`rounded-pill ${activeType === 'income' ? 'bg-success text-white shadow-sm' : 'text-muted'}`}
                style={activeType === 'income' ? {background: 'var(--success-gradient)'} : {}}
              >
                Income
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-4 pb-4 px-4">
        {activeType === 'meal' && <MealForm />}
        {activeType === 'purchase' && <PurchaseForm />}
        {activeType === 'income' && <IncomeForm />}
      </Modal.Body>
    </Modal>
  );
};

export default AddTransactionModal;