import React, { useState, useMemo, useRef } from 'react';
import { Card, Form, Button, Table, Spinner, Badge, Nav, Alert, InputGroup, Dropdown } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import { useAI } from '../context/AIContext';
import { aiService } from '../utils/aiService';
import { FaMagic, FaCheck, FaTrash, FaListUl, FaTimes, FaExclamationCircle, FaFileCsv, FaCalendarAlt, FaWallet, FaEdit, FaSave, FaExclamationTriangle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { getLocalISO } from '../utils/dateUtils';
import { playSound } from '../utils/soundEffects';
import Papa from 'papaparse';

const StatementParser = ({ onComplete }) => {
  const { addMeal, addPurchase, categories, wallets, meals, purchases } = useApp();
  const { aiSettings } = useAI();
  
  const [mode, setMode] = useState('manual'); // 'ai' or 'manual' or 'csv'
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  
  // Global Overrides
  const [globalWallet, setGlobalWallet] = useState('');
  const [globalDate, setGlobalDate] = useState(getLocalISO());

  const fileInputRef = useRef(null);

  // Duplicate Detection Logic
  const checkDuplicate = (item, amount, date) => {
    const isMealDup = meals.some(m => 
        m.item.toLowerCase() === item.toLowerCase() && 
        Number(m.amount) === Number(amount) && 
        m.date === date
    );
    const isPurchaseDup = purchases.some(p => 
        p.item.toLowerCase() === item.toLowerCase() && 
        Number(p.amount) === Number(amount) && 
        p.date === date
    );
    return isMealDup || isPurchaseDup;
  };

  const processParsedItems = (items) => {
    const processed = items.map((it, idx) => {
        const id = it.id || `p_${idx}_${Date.now()}`;
        const isDup = checkDuplicate(it.item, it.amount, it.date || getLocalISO());
        return { 
            ...it, 
            id, 
            isDuplicate: isDup,
            walletId: it.walletId || wallets[0]?.id,
            walletName: it.walletName || wallets[0]?.name,
            date: it.date || getLocalISO(),
            time: it.time || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        };
    });
    setParsedItems(processed);
    setSelectedIds(new Set(processed.filter(it => !it.isDuplicate).map(it => it.id)));
  };

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
            return { error: "Invalid format", raw: line };
        }

        const foundWallet = wallets.find(w => w.name.toLowerCase() === walletName.toLowerCase()) || wallets[0];
        const foundCat = categories.find(c => c.label.toLowerCase().includes(category.toLowerCase()) || c.id.toLowerCase() === category.toLowerCase()) || { id: 'Other' };

        return {
            item: item || "Unnamed Item",
            amount: parseFloat(amount) || 0,
            category: foundCat.id,
            date: today,
            time: time,
            walletId: foundWallet?.id,
            walletName: foundWallet?.name,
            type: foundCat.id === 'Food' ? 'meal' : 'purchase'
        };
    }).filter(it => !it.error);

    processParsedItems(newItems);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsParsing(true);
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            const items = results.data.map(row => {
                // Try to map common CSV headers
                const item = row.item || row.description || row.title || row.memo;
                const amount = parseFloat(row.amount || row.value || row.debit || 0);
                const category = row.category || row.type || 'Other';
                const date = row.date || getLocalISO();
                
                const foundCat = categories.find(c => c.id.toLowerCase() === category.toLowerCase()) || { id: 'Other' };
                
                return {
                    item: item || "CSV Item",
                    amount: Math.abs(amount),
                    category: foundCat.id,
                    date: date,
                    type: foundCat.id === 'Food' ? 'meal' : 'purchase'
                };
            });
            processParsedItems(items);
            setIsParsing(false);
        },
        error: (err) => {
            console.error(err);
            setIsParsing(false);
            alert("Error parsing CSV");
        }
    });
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
        
        processParsedItems(items);
    } catch (error) {
        console.error(error);
    } finally {
        setIsParsing(false);
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === parsedItems.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(parsedItems.map(it => it.id)));
  };

  const removeItem = (id) => {
    setParsedItems(prev => prev.filter(it => it.id !== id));
    const newSelected = new Set(selectedIds);
    newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const updateItem = (id, field, value) => {
    setParsedItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
  };

  const applyGlobalOverrides = () => {
    setParsedItems(prev => prev.map(it => {
        if (!selectedIds.has(it.id)) return it;
        let updated = { ...it };
        if (globalWallet) {
            const wallet = wallets.find(w => w.id === globalWallet);
            updated.walletId = wallet.id;
            updated.walletName = wallet.name;
        }
        if (globalDate) updated.date = globalDate;
        return updated;
    }));
  };

  const handleBulkSave = async () => {
    const itemsToSave = parsedItems.filter(it => selectedIds.has(it.id));
    if (itemsToSave.length === 0) return;

    for (const it of itemsToSave) {
        const wallet = wallets.find(w => w.id === it.walletId);
        if (!wallet) continue;

        const data = {
            item: it.item,
            amount: it.amount.toString(),
            date: it.date,
            time: it.time || '12:00 PM',
            walletId: wallet.id,
            walletName: wallet.name,
            month: it.date.substring(0, 7)
        };

        if (it.type === 'meal' || it.category === 'Food') {
            await addMeal({ ...data, mealType: 'Snack' });
        } else {
            await addPurchase({ ...data, category: it.category || 'Other' });
        }
    }
    
    playSound('success');
    setParsedItems([]);
    setSelectedIds(new Set());
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
                        <FaListUl /> Manual
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link active={mode === 'ai'} onClick={() => setMode('ai')} className="rounded-pill py-1 px-3 small d-flex align-items-center gap-2 text-primary">
                        <FaMagic /> AI Magic
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link active={mode === 'csv'} onClick={() => setMode('csv')} className="rounded-pill py-1 px-3 small d-flex align-items-center gap-2 text-success">
                        <FaFileCsv /> CSV Upload
                    </Nav.Link>
                </Nav.Item>
            </Nav>

            <h5 className="fw-bold mb-3">Bulk Transaction Entry</h5>
            
            {mode === 'manual' && (
                <Alert variant="info" className="border-0 rounded-4 py-2 px-3 small mb-3">
                    <FaExclamationCircle className="me-2" />
                    <strong>Format:</strong> item, amount, category, [time], wallet
                </Alert>
            )}
            
            {mode === 'csv' ? (
                <div className="mb-3">
                    <div className="text-center py-4 bg-light rounded-4 border-dashed mb-2" onClick={() => fileInputRef.current.click()} style={{ cursor: 'pointer', border: '2px dashed #dee2e6' }}>
                        <FaFileCsv size={40} className="text-success mb-2" />
                        <p className="mb-0 small fw-bold">Click to upload CSV statement</p>
                        <p className="text-muted x-small">Headers: item, amount, category, date</p>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="d-none" />
                    </div>
                    <div className="text-center">
                        <Button 
                            variant="link" 
                            size="sm" 
                            className="text-decoration-none text-muted x-small"
                            onClick={() => {
                                const csvContent = "item,amount,category,date\nLunch at Cafe,450,Food,2026-03-18\nInternet Bill,1200,Bills,2026-03-15\nNew Shirt,1500,Shopping,2026-03-10";
                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = "smwallet_bulk_sample.csv";
                                a.click();
                            }}
                        >
                            <FaDownload className="me-1" /> Download Sample CSV Template
                        </Button>
                    </div>
                </div>
            ) : (
                <Form.Control 
                    as="textarea" 
                    rows={6} 
                    placeholder={mode === 'manual' 
                        ? "Example:\nBurger, 500, Food, 2:30 PM, Cash\nFuel, 2000, Travel, Fuel Card"
                        : "Paste bank SMS, email text, or lists here..."}
                    className="rounded-4 border-0 bg-light p-3 mb-3 shadow-inner"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    style={{ fontSize: '0.9rem', fontFamily: mode === 'manual' ? 'monospace' : 'inherit' }}
                />
            )}
            
            {mode !== 'csv' && (
                <Button 
                    variant={mode === 'manual' ? "dark" : "primary"} 
                    className="w-100 rounded-pill py-2 fw-bold"
                    onClick={handleParse}
                    disabled={isParsing || !inputText.trim()}
                >
                    {isParsing ? <><Spinner animation="border" size="sm" className="me-2" /> Parsing...</> : "Parse Transactions"}
                </Button>
            )}
          </Card.Body>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-bold mb-0">Review {parsedItems.length} Items</h5>
                        <Button variant="outline-danger" size="sm" className="rounded-pill px-3" onClick={() => setParsedItems([])}>
                            <FaTimes className="me-1" /> Cancel
                        </Button>
                    </div>

                    {/* Global Overrides UI */}
                    <div className="bg-light p-3 rounded-4 mb-4 border">
                        <p className="x-small fw-bold text-muted text-uppercase mb-2">Apply to Selected</p>
                        <div className="row g-2">
                            <div className="col-5">
                                <InputGroup size="sm">
                                    <InputGroup.Text className="bg-white border-end-0"><FaWallet /></InputGroup.Text>
                                    <Form.Select className="border-start-0" value={globalWallet} onChange={(e) => setGlobalWallet(e.target.value)}>
                                        <option value="">Same Wallet</option>
                                        {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </Form.Select>
                                </InputGroup>
                            </div>
                            <div className="col-5">
                                <InputGroup size="sm">
                                    <InputGroup.Text className="bg-white border-end-0"><FaCalendarAlt /></InputGroup.Text>
                                    <Form.Control type="date" className="border-start-0" value={globalDate} onChange={(e) => setGlobalDate(e.target.value)} />
                                </InputGroup>
                            </div>
                            <div className="col-2">
                                <Button variant="dark" size="sm" className="w-100 rounded-3" onClick={applyGlobalOverrides} disabled={selectedIds.size === 0}>
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="table-responsive" style={{ maxHeight: '400px' }}>
                        <Table hover className="align-middle small mb-0">
                            <thead className="bg-light sticky-top">
                                <tr>
                                    <th style={{ width: '40px' }}>
                                        <Form.Check type="checkbox" checked={selectedIds.size === parsedItems.length && parsedItems.length > 0} onChange={toggleSelectAll} />
                                    </th>
                                    <th>Item Details</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th className="text-end">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedItems.map(it => (
                                    <tr key={it.id} className={it.isDuplicate ? 'table-warning opacity-75' : ''}>
                                        <td>
                                            <Form.Check type="checkbox" checked={selectedIds.has(it.id)} onChange={() => toggleSelect(it.id)} />
                                        </td>
                                        <td>
                                            {editingId === it.id ? (
                                                <Form.Control size="sm" value={it.item} onChange={(e) => updateItem(it.id, 'item', e.target.value)} />
                                            ) : (
                                                <div className="d-flex align-items-center gap-2">
                                                    <div>
                                                        <div className="fw-bold">{it.item}</div>
                                                        <div className="x-small text-muted">{it.date} • {it.walletName}</div>
                                                    </div>
                                                    {it.isDuplicate && <Badge bg="warning" text="dark" className="x-small"><FaExclamationTriangle /> Dup</Badge>}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {editingId === it.id ? (
                                                <Form.Select size="sm" value={it.category} onChange={(e) => updateItem(it.id, 'category', e.target.value)}>
                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                                </Form.Select>
                                            ) : (
                                                <Badge bg="secondary" className="bg-opacity-10 text-dark border fw-normal">{it.category}</Badge>
                                            )}
                                        </td>
                                        <td>
                                            {editingId === it.id ? (
                                                <Form.Control size="sm" type="number" value={it.amount} onChange={(e) => updateItem(it.id, 'amount', parseFloat(e.target.value))} />
                                            ) : (
                                                <span className="fw-bold text-danger">-{it.amount}</span>
                                            )}
                                        </td>
                                        <td className="text-end">
                                            <div className="d-flex justify-content-end gap-2">
                                                {editingId === it.id ? (
                                                    <Button variant="link" className="text-success p-0" onClick={() => setEditingId(null)}><FaSave /></Button>
                                                ) : (
                                                    <Button variant="link" className="text-muted p-0" onClick={() => setEditingId(it.id)}><FaEdit /></Button>
                                                )}
                                                <Button variant="link" className="text-danger p-0" onClick={() => removeItem(it.id)}><FaTrash /></Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>

                    <Button 
                        variant="success" 
                        className="w-100 rounded-pill py-3 fw-bold mt-4 text-white shadow-sm d-flex align-items-center justify-content-center gap-2"
                        onClick={handleBulkSave}
                        disabled={selectedIds.size === 0}
                    >
                        <FaCheck /> Save {selectedIds.size} Transactions
                    </Button>
                </Card.Body>
            </Card>
        </motion.div>
      )}
      <style>{`
        .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06); }
        .x-small { font-size: 0.7rem; }
        .border-dashed { border-style: dashed !important; transition: all 0.2s; }
        .border-dashed:hover { background: #f8f9fa !important; border-color: #0d6efd !important; }
      `}</style>
    </div>
  );
};

export default StatementParser;