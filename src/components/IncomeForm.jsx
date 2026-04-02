import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, InputGroup } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApp } from '../context/AppContext';
import StatusModal from './StatusModal';
import { getLocalISO } from '../utils/dateUtils';

const schema = z.object({
  date: z.string().min(1, "Date is required"),
  source: z.string().min(1, "Source is required"),
  amount: z.coerce.number({ invalid_type_error: "Amount must be a number" }).positive("Amount must be positive"),
  walletId: z.string().min(1, "Please select a wallet"),
});

const IncomeForm = ({ preFill }) => {
  const { wallets, addIncome } = useApp();
  const [status, setStatus] = useState({ show: false, message: '' });
  const [impactData, setImpactData] = useState(null);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      date: getLocalISO(),
      source: preFill?.source || 'Salary',
      amount: preFill?.amount || '',
      walletId: ''
    }
  });

  // Reset form when preFill changes
  useEffect(() => {
    if (preFill) {
      reset({
        date: getLocalISO(),
        source: preFill.source || 'Salary',
        amount: preFill.amount || '',
        walletId: ''
      });
    }
  }, [preFill, reset]);

  const onSubmit = async (data) => {
    const selectedWallet = wallets.find(w => w.id === data.walletId);
    
    // Auto-capture time
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    setImpactData({
      walletName: selectedWallet?.name || 'Wallet',
      amount: data.amount,
      newBalance: selectedWallet?.type === 'liability'
        ? (selectedWallet?.remaining || 0) - data.amount
        : (selectedWallet?.remaining || 0) + data.amount,
      isIncome: true
    });

    await addIncome({
      ...data,
      time,
      amount: data.amount.toString(),
      walletName: selectedWallet ? selectedWallet.name : 'Unknown'
    });

    reset({
        date: data.date,
        source: data.source,
        amount: '',
        walletId: data.walletId
    });
    
    setStatus({ show: true, type: 'success', message: 'Income added successfully!' });
  };

  return (
    <div className="income-form-container py-2">
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Row className="g-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted text-uppercase">Date</Form.Label>
              <Form.Control 
                type="date" 
                className="rounded-3"
                {...register("date")}
                isInvalid={!!errors.date}
              />
              <Form.Control.Feedback type="invalid">{errors.date?.message}</Form.Control.Feedback>
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted text-uppercase">Source</Form.Label>
              <Form.Select className="rounded-3" {...register("source")}>
                <option>Salary</option>
                <option>Freelance</option>
                <option>Gift</option>
                <option>Business</option>
                <option>Other</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted text-uppercase">Amount</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">৳</InputGroup.Text>
                <Form.Control 
                  type="number" 
                  placeholder="0.00"
                  step="0.01"
                  className="rounded-3 border-start-0"
                  {...register("amount")}
                  isInvalid={!!errors.amount}
                />
                <Form.Control.Feedback type="invalid">{errors.amount?.message}</Form.Control.Feedback>
              </InputGroup>
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted text-uppercase">Target Wallet</Form.Label>
              <Form.Select 
                className="rounded-3"
                {...register("walletId")}
                isInvalid={!!errors.walletId}
              >
                <option value="">Select Wallet...</option>
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.walletId?.message}</Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        <Button type="submit" className="w-100 mt-4 py-2 fw-bold rounded-pill shadow-sm text-white" style={{ background: 'var(--success-gradient)', border: 'none' }}>
          Add Income
        </Button>
      </Form>

      <StatusModal 
        show={status.show} 
        onHide={() => setStatus({ ...status, show: false })}
        type={status.type}
        message={status.message}
        impactData={impactData}
      />
    </div>
  );
};

export default IncomeForm;