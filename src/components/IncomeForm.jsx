import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApp } from '../context/AppContext';
import StatusModal from './StatusModal';

const schema = z.object({
  date: z.string().min(1, "Date is required"),
  source: z.string().min(1, "Source is required"),
  amount: z.coerce.number({ invalid_type_error: "Amount must be a number" }).positive("Amount must be positive"),
  walletId: z.string().min(1, "Please select a wallet"),
});

const IncomeForm = () => {
  const { wallets, addIncome } = useApp();
  const [status, setStatus] = useState({ show: false, message: '' });
  const [impactData, setImpactData] = useState(null);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      source: 'Salary',
      amount: '',
      walletId: ''
    }
  });

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
    <>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Form.Group className="mb-2">
          <Form.Label>Date</Form.Label>
          <Form.Control 
            type="date" 
            {...register("date")}
            isInvalid={!!errors.date}
          />
          <Form.Control.Feedback type="invalid">{errors.date?.message}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Source</Form.Label>
          <Form.Select {...register("source")}>
            <option>Salary</option>
            <option>Freelance</option>
            <option>Gift</option>
            <option>Business</option>
            <option>Other</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Amount</Form.Label>
          <Form.Control 
            type="number" 
            placeholder="0.00"
            step="0.01"
            {...register("amount")}
            isInvalid={!!errors.amount}
          />
          <Form.Control.Feedback type="invalid">{errors.amount?.message}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Target Wallet</Form.Label>
          <Form.Select 
            {...register("walletId")}
            isInvalid={!!errors.walletId}
          >
            <option value="">Select Wallet...</option>
            {wallets.map(w => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.type === 'liability' ? `Debt: ${w.remaining}` : `Avail: ${w.remaining}`})
              </option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">{errors.walletId?.message}</Form.Control.Feedback>
        </Form.Group>

        <Button type="submit" className="w-100 btn-success" style={{ background: 'var(--success-gradient)', border: 'none' }}>
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
    </>
  );
};

export default IncomeForm;