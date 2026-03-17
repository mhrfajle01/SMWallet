import React, { useState } from 'react';
import { Card, Form, Button, Table, Spinner, Badge, Alert } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { useAI } from '../context/AIContext';
import { aiService } from '../utils/aiService';
import { FaMagic, FaCheck, FaTrash, FaPlus, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { getLocalISO } from '../utils/dateUtils';

const StatementParser = ({ onComplete }) => {
  const { addMeal, addPurchase, categories, wallets } = useApp();
  const { aiSettings } = useAI();
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState('');

  const handleParse = async () => {
    if (!inputText.trim()) return;
    setIsParsing(true);
    
    try {
        const prompt = `Analyze this financial text/statement and extract transactions. 
        Output ONLY a JSON array of objects:
        { "item": string, "amount": number, "type": "meal|purchase", "category": string, "date": "YYYY-MM-DD" }
        Categories must be one of: ${categories.map(c => c.id).join(', ')}.
        If you can't find a category, use "Other".
        Text: "${inputText}"`;

        const response = await aiService.requestAI(aiSettings, [
            { role: "system", content: "You are a financial data extractor. Output strictly JSON array." },
            { role: "user", content: prompt }
        ]);

        let items = [];
        try {
            const cleanJson = response.includes('```') ? response.match(/\[[\s\S]*\]/)?.[0] : response;
            items = JSON.parse(cleanJson);
        } catch (e) {
            console.error("Parse error", e);
            alert("AI could not parse this text. Try pasting clearer transaction lines.");
        }
        
        setParsedItems(items.map((it, idx) => ({ ...it, id: `p_${idx}_${Date.now()}` })));
    } catch (error) {
        console.error(error);
    } finally {
        setIsParsing(false);
    }
  };

  const removeItem = (id) => setParsedItems(prev => prev.filter(it => it.id !== id));

  const handleBulkSave = async () => {
    if (!selectedWallet) return alert("Select a wallet first!");
    const wallet = wallets.find(w => w.id === selectedWallet);
    if (!wallet) return alert("Wallet not found!");
    const today = getLocalISO();

    for (const it of parsedItems) {
        const data = {
            item: it.item,
            amount: it.amount.toString(),
            date: it.date || today,
            walletId: selectedWallet,
            walletName: wallet.name,
            month: (it.date || today).substring(0, 7)
        };

        if (it.type === 'meal') {
            await addMeal({ ...data, mealType: 'Snack' });
        } else {
            await addPurchase({ ...data, category: it.category || 'Other' });
        }
    }
    setParsedItems([]);
    setInputText('');
    if (onComplete) onComplete();
  };

  return (
    <div className="statement-parser">
      {!parsedItems.length ? (
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <Card.Body className="p-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <FaMagic className="text-primary" /> AI Statement Parser
            </h5>
            <p className="small text-muted mb-4">Paste text from your bank SMS, email, or app statement. The AI will extract all transactions for you.</p>
            
            <Form.Control 
                as="textarea" 
                rows={6} 
                placeholder="Example: 
Spent 500 at Burger King on 2024-03-15
Bus ticket 30
Electricity bill paid 2500"
                className="rounded-4 border-0 bg-light p-3 mb-3 shadow-inner"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ fontSize: '0.9rem' }}
            />
            
            <Button 
                variant="primary" 
                className="w-100 rounded-pill py-2 fw-bold"
                onClick={handleParse}
                disabled={isParsing || !inputText.trim()}
            >
                {isParsing ? <><Spinner animation="border" size="sm" className="me-2" /> Extracting...</> : "Parse Transactions"}
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="fw-bold mb-0">Review Imports</h5>
                        <Button variant="outline-danger" size="sm" className="rounded-pill px-3" onClick={() => setParsedItems([])}>
                            <FaTimes className="me-1" /> Cancel
                        </Button>
                    </div>

                    <Form.Group className="mb-4">
                        <Form.Label className="small fw-bold text-muted uppercase">Target Wallet</Form.Label>
                        <Form.Select 
                            className="rounded-pill px-4" 
                            value={selectedWallet}
                            onChange={(e) => setSelectedWallet(e.target.value)}
                            required
                        >
                            <option value="">Select Wallet...</option>
                            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </Form.Select>
                    </Form.Group>

                    <div className="table-responsive">
                        <Table hover className="align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th>Item</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedItems.map(it => (
                                    <tr key={it.id}>
                                        <td>
                                            <div className="fw-bold small">{it.item}</div>
                                            <div className="x-small text-muted">{it.date || 'Today'}</div>
                                        </td>
                                        <td><Badge bg="secondary" className="bg-opacity-10 text-dark border">{it.category}</Badge></td>
                                        <td className="fw-bold text-danger">{it.amount}</td>
                                        <td className="text-end">
                                            <Button variant="link" className="text-danger p-0" onClick={() => removeItem(it.id)}>
                                                <FaTrash />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>

                    <Button 
                        variant="success" 
                        className="w-100 rounded-pill py-2 fw-bold mt-3 text-white shadow-sm"
                        onClick={handleBulkSave}
                        disabled={!selectedWallet}
                    >
                        <FaCheck className="me-2" /> Bulk Save {parsedItems.length} Transactions
                    </Button>
                </Card.Body>
            </Card>
        </motion.div>
      )}
      <style>{`
        .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06); }
        .x-small { font-size: 0.75rem; }
      `}</style>
    </div>
  );
};

export default StatementParser;