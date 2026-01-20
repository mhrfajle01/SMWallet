import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApp } from '../context/AppContext';
import StatusModal from './StatusModal';

const schema = z.object({
  date: z.string().min(1, "Date is required"),
  mealType: z.string(),
  item: z.string().min(1, "Item name is required"),
  amount: z.coerce.number({ invalid_type_error: "Amount must be a number" }).positive("Amount must be positive"),
  walletId: z.string().min(1, "Please select a wallet"),
});

const MealForm = () => {
  const { wallets, addMeal } = useApp();
  const [status, setStatus] = useState({ show: false, message: '' });
  const [impactData, setImpactData] = useState(null);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      mealType: 'Lunch',
      item: '',
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
        ? (selectedWallet?.remaining || 0) + data.amount
        : (selectedWallet?.remaining || 0) - data.amount
    });

    await addMeal({
      ...data,
      time,
      amount: data.amount.toString(),
      month: data.date.substring(0, 7),
      walletName: selectedWallet ? selectedWallet.name : 'Unknown'
    });

    reset({
        date: data.date,
        mealType: data.mealType,
        item: '',
        amount: '',
        walletId: data.walletId
    });
    
    setStatus({ show: true, type: 'success', message: 'Meal added successfully!' });
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
          <Form.Label>Meal Type</Form.Label>
          <Form.Select {...register("mealType")}>
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
            {...register("item")}
            isInvalid={!!errors.item}
          />
          <Form.Control.Feedback type="invalid">{errors.item?.message}</Form.Control.Feedback>
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
          <Form.Label>Wallet</Form.Label>
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