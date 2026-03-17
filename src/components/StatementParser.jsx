import React, { useState, useMemo } from 'react';
import { Card, Form, Button, Table, Spinner, Badge, Nav, Alert } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { useAI } from '../context/AIContext';
import { aiService } from '../utils/aiService';
import { FaMagic, FaCheck, FaTrash, FaListUl, FaTimes, FaExclamationCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { getLocalISO } from '../utils/dateUtils';
import { playSound } from '../utils/soundEffects';

const StatementParser = ({ onComplete }) => {
  const { addMeal, addPurchase, categories, wallets } = useApp();
  const { aiSettings } = useAI();
  
  const [mode, setMode] = useState('manual'); // 'ai' or 'manual'
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState('');

  // Manual Parsing Logic
  const parseManualText = () => {
    const lines = inputText.split('\n').filter(l => l.trim() && l.includes(','));
    const today = getLocalISO();
    const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const newItems = lines.map((line, idx) => {
        const parts = line.split(',').map(p => p.trim());
        
        // Rules: item, amount, category, [time], wallet
        let item, amount, category, time, walletName;

        if (parts.length === 5) {
            [item, amount, category, time, walletName] = parts;
        } else if (parts.length === 4) {
            [item, amount, category, walletName] = parts;
            time = now;
        } else {
            return { error: "Invalid format (needs 4 or 5 parts)", raw: line };
        }

        // Validate Wallet
        const foundWallet = wallets.find(w => w.name.toLowerCase() === walletName.toLowerCase()) || wallets[0];
        // Validate Category
        const foundCat = categories.find(c => c.label.toLowerCase().includes(category.toLowerCase()) || c.id.toLowerCase() === category.toLowerCase()) || { id: 'Other' };

        return {
            id: `m_${idx}_${Date.now()}`,
            item: item || "Unnamed Item",
            amount: parseFloat(amount) || 0,
            category: foundCat.id,
            date: today,
            time: time,
            walletId: foundWallet?.id,
            walletName: foundWallet?.name,
            type: foundCat.id === 'Food' ? 'meal' : 'purchase',
            isValid: !isNaN(parseFloat(amount)) && item
        };
    });

    setParsedItems(newItems.filter(it => !it.error));
  };

  const handleParse = async () => {
    if (!inputText.trim()) return;
    
    if (mode === 'manual') {
        parseManualText();
        return;
    }

    setIsParsing(true);
    try {
        const prompt = `Analyze this financial text and extract transactions. 
        Output ONLY a JSON array of objects:
        { "item": string, "amount": number, "type": "meal|purchase", "category": string, "date": "YYYY-MM-DD" }
        Categories must be one of: ${categories.map(c => c.id).join(', ')}.
        Text: "${inputText}"`;

        const response = await aiService.requestAI(aiSettings, [
            { role: "system", content: "Financial data extractor. Output strictly JSON array." },
            { role: "user", content: prompt }
        ]);

        let items = [];
        try {
            const cleanJson = response.includes('```') ? response.match(/\[[\s\S]*\]/)?.[0] : response;
            items = JSON.parse(cleanJson);
        } catch (e) {
            console.error("Parse error", e);
            alert("AI could not parse this text.");
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
    const today = getLocalISO();

    for (const it of parsedItems) {
        const wallet = wallets.find(w => w.id === (it.walletId || selectedWallet));
        if (!wallet) continue;

        const data = {
            item: it.item,
            amount: it.amount.toString(),
            date: it.date || today,
            time: it.time || '12:00 PM',
            walletId: wallet.id,
            walletName: wallet.name,
            month: (it.date || today).substring(0, 7)
        };

        if (it.type === 'meal' || it.category === 'Food') {
            await addMeal({ ...data, mealType: 'Snack' });
        } else {
            await addPurchase({ ...data, category: it.category || 'Other' });
        }
    }
    
    playSound('success');
    setParsedItems([]);
    setInputText('');
    if (onComplete) onComplete();
  };

  return (
    <div className="statement-parser">
      {!parsedItems.length ? (
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <Card.Body className="p-4">
            <Nav variant="pills" className="bg-light p-1 rounded-pill mb-4" style={{ width: 'fit-content' }}>
                <Nav.Item>
                    <Nav.Link active={mode === 'manual'} onClick={() => setMode('manual')} className="rounded-pill py-1 px-3 small d-flex align-items-center gap-2">
                        <FaListUl /> Manual Rules
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link active={mode === 'ai'} onClick={() => setMode('ai')} className="rounded-pill py-1 px-3 small d-flex align-items-center gap-2 text-primary">
                        <FaMagic /> AI Magic
                    </Nav.Link>
                </Nav.Item>
            </Nav>

            <h5 className="fw-bold mb-3">Bulk Transaction Entry</h5>
            
            {mode === 'manual' ? (
                <Alert variant="info" className="border-0 rounded-4 py-2 px-3 small mb-3">
                    <FaExclamationCircle className="me-2" />
                    <strong>Format:</strong> item, amount, category, [time], wallet
                </Alert>
            ) : (
                <p className="small text-muted mb-3">Paste text from bank SMS, email, or statements. The AI will extract data.</p>
            )}
            
            <Form.Control 
                as="textarea" 
                rows={6} 
                placeholder={mode === 'manual' 
                    ? "Example:\nBurger, 500, Food, 2:30 PM, Cash\nFuel, 2000, Travel, Fuel Card\nCoffee, 80, Food, bKash"
                    : "Paste any text here..."}
                className="rounded-4 border-0 bg-light p-3 mb-3 shadow-inner"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ fontSize: '0.9rem', fontFamily: mode === 'manual' ? 'monospace' : 'inherit' }}
            />
            
            <Button 
                variant={mode === 'manual' ? "dark" : "primary"} 
                className="w-100 rounded-pill py-2 fw-bold"
                onClick={handleParse}
                disabled={isParsing || !inputText.trim()}
            >
                {isParsing ? <><Spinner animation="border" size="sm" className="me-2" /> Parsing...</> : "Parse Transactions"}
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="fw-bold mb-0">Review {parsedItems.length} Transactions</h5>
                        <Button variant="outline-danger" size="sm" className="rounded-pill px-3" onClick={() => setParsedItems([])}>
                            <FaTimes className="me-1" /> Cancel
                        </Button>
                    </div>

                    <div className="table-responsive" style={{ maxHeight: '300px' }}>
                        <Table hover className="align-middle small">
                            <thead className="bg-light sticky-top">
                                <tr>
                                    <th>Item & Time</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Wallet</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedItems.map(it => (
                                    <tr key={it.id}>
                                        <td>
                                            <div className="fw-bold">{it.item}</div>
                                            <div className="x-small text-muted">{it.time}</div>
                                        </td>
                                        <td><Badge bg="secondary" className="bg-opacity-10 text-dark border fw-normal">{it.category}</Badge></td>
                                        <td className="fw-bold text-danger">-{it.amount}</td>
                                        <td className="small text-muted">{it.walletName}</td>
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
                    >
                        <FaCheck className="me-2" /> Bulk Save All
                    </Button>
                </Card.Body>
            </Card>
        </motion.div>
      )}
      <style>{`
        .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06); }
        .x-small { font-size: 0.7rem; }
      `}</style>
    </div>
  );
};

export default StatementParser;