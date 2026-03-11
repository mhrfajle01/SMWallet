import React, { useState, useRef } from 'react';
import { Button, Card, Spinner, Form, Alert, Badge } from 'react-bootstrap';
import { FaCamera, FaFileUpload, FaMagic, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { createWorker } from 'tesseract.js';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '../utils/aiService';

const ReceiptScanner = ({ onScanComplete, onCancel }) => {
  const [isProcessing, setIsDarkMode] = useState(false);
  const [scanMode, setScanMode] = useState('photo'); // 'photo' or 'text'
  const [pasteInput, setPasteInput] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const processImage = async (imageFile) => {
    setIsDarkMode(true);
    setError(null);
    setProgress(0);

    try {
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(parseInt(m.progress * 80)); // 80% for OCR
          }
        }
      });

      const { data: { text } } = await worker.recognize(imageFile);
      await worker.terminate();
      
      setProgress(90);

      // AI Refinement using DeepSeek
      const aiParsed = await aiService.parseReceiptWithAI(text);
      
      if (aiParsed) {
          onScanComplete({ 
              amount: aiParsed.amount, 
              item: aiParsed.merchant, 
              date: aiParsed.date,
              category: aiParsed.category,
              rawText: text 
          });
      } else {
          // Fallback to local logic
          const parsedData = parseReceiptText(text);
          onScanComplete({ ...parsedData, rawText: text });
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setError('Failed to scan receipt. Please try a clearer photo or manual entry.');
    } finally {
      setIsDarkMode(false);
    }
  };

  const handlePasteProcess = async () => {
    if (!pasteInput.trim()) return;
    setIsDarkMode(true);
    
    const aiParsed = await aiService.parseReceiptWithAI(pasteInput);
    
    if (aiParsed) {
        onScanComplete({
            amount: aiParsed.amount,
            item: aiParsed.merchant,
            date: aiParsed.date,
            category: aiParsed.category
        });
    } else {
        const parsedData = parseReceiptText(pasteInput);
        onScanComplete(parsedData);
    }
    setIsDarkMode(false);
  };

  const parseReceiptText = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    let amount = 0;
    let merchant = '';
    let date = new Date().toISOString().split('T')[0];

    // 1. Merchant Detection (Look at top lines, skip common garbage text)
    const skipKeywords = ['welcome', 'receipt', 'invoice', 'order', 'tax', 'date', 'time', 'tel', 'phone', 'customer'];
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i].toLowerCase();
        if (!skipKeywords.some(k => line.includes(k)) && line.length > 3) {
            merchant = lines[i];
            break;
        }
    }

    // 2. Powerful Amount Detection
    const totalKeywords = ['total', 'amount', 'payable', 'sum', 'cash', 'net', 'due', 'paid', 'tk', 'bdt'];
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].toLowerCase();
        if (totalKeywords.some(k => line.includes(k))) {
            const matches = lines[i].match(/([\d,]+\.?\d*)/);
            if (matches && parseFloat(matches[0].replace(/,/g, '')) > 0) {
                amount = parseFloat(matches[0].replace(/,/g, ''));
                break;
            }
        }
    }

    if (amount === 0) {
        const allNumbers = text.match(/([\d,]+\.\d{2})/g);
        if (allNumbers) {
            const prices = allNumbers.map(p => parseFloat(p.replace(/,/g, ''))).filter(p => p < 100000);
            if (prices.length > 0) amount = Math.max(...prices);
        }
    }

    // 3. Date Detection
    const dateRegexes = [
        /(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/,
        /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/
    ];
    for (const regex of dateRegexes) {
        const match = text.match(regex);
        if (match) {
            const d = new Date(match[0]);
            if (!isNaN(d.getTime())) {
                date = d.toISOString().split('T')[0];
                break;
            }
        }
    }

    return { 
        amount: amount || 0, 
        item: merchant || 'Scanned Receipt', 
        date,
        category: inferCategory(merchant)
    };
  };

  const inferCategory = (merchant) => {
    const m = merchant.toLowerCase();
    if (/(cafe|restaurant|food|kitchen|pizza|burger|coffee|bakery|snacks)/i.test(m)) return 'Food';
    if (/(uber|pathao|bus|rail|train|flight|air|travel|trip|cng|taxi)/i.test(m)) return 'Travel';
    if (/(mart|store|shop|super|grocery|mall|retail)/i.test(m)) return 'Shopping';
    if (/(pharmacy|med|health|doctor|clinic|hospital)/i.test(m)) return 'Health';
    if (/(bill|electric|water|internet|gas|mobile|recharge)/i.test(m)) return 'Bills';
    return 'Other';
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      processImage(file);
    }
  };

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <Card.Body className="p-0">
        <div className="d-flex gap-2 mb-3 p-1 rounded-pill mx-auto" style={{ width: 'fit-content', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
            <Button variant={scanMode === 'photo' ? 'primary' : 'transparent'} size="sm" className="rounded-pill px-3 border-0" onClick={() => setScanMode('photo')} style={{ color: scanMode === 'photo' ? 'white' : 'var(--text-secondary)' }}>
                <FaCamera className="me-1"/> Photo
            </Button>
            <Button variant={scanMode === 'text' ? 'primary' : 'transparent'} size="sm" className="rounded-pill px-3 border-0" onClick={() => setScanMode('text')} style={{ color: scanMode === 'text' ? 'white' : 'var(--text-secondary)' }}>
                <FaFileUpload className="me-1"/> Paste Info
            </Button>
        </div>

        {scanMode === 'photo' ? (
          !previewUrl ? (
            <div className="text-center py-2">
              <div 
                  className="upload-zone p-5 rounded-4 border-2 border-dashed d-flex flex-column align-items-center gap-3 cursor-pointer mb-3"
                  style={{ borderColor: 'var(--border-color)', background: 'var(--bg-color)', cursor: 'pointer' }}
                  onClick={() => fileInputRef.current.click()}
              >
                <div className="bg-primary bg-opacity-10 p-4 rounded-circle text-primary">
                  <FaCamera size={32} />
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Snap or Upload Receipt</h6>
                  <p className="text-muted small mb-0">AI will read the text from image</p>
                </div>
              </div>
              <Form.Control 
                type="file" 
                accept="image/*" 
                capture="environment"
                className="d-none" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
              />
            </div>
          ) : (
            <div className="position-relative">
              <img src={previewUrl} alt="Receipt Preview" className="w-100 rounded-4 shadow-sm mb-3" style={{ maxHeight: '300px', objectFit: 'contain', background: '#000' }} />
              
              <AnimatePresence>
                {isProcessing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="position-absolute top-0 start-0 w-100 h-100 rounded-4 d-flex flex-column align-items-center justify-content-center"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100 }}
                  >
                    <div className="scanning-line" />
                    <Spinner animation="border" variant="light" className="mb-3" />
                    <div className="text-white fw-bold mb-1 text-center px-3">AI Reading Receipt...</div>
                    <div className="w-50">
                      <div className="progress" style={{ height: '6px', background: 'rgba(255,255,255,0.2)' }}>
                          <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                    <div className="text-white-50 small mt-2">{progress}% Complete</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                  <Alert variant="warning" className="small border-0 shadow-sm d-flex align-items-center gap-2 py-2">
                      <FaExclamationTriangle className="flex-shrink-0" />
                      <div>{error}</div>
                  </Alert>
              )}

              {!isProcessing && (
                  <div className="d-flex gap-2">
                      <Button variant="outline-danger" size="sm" className="flex-grow-1 rounded-pill" onClick={() => { setPreviewUrl(null); setProgress(0); }}>
                          <FaTimes className="me-1" /> Retake
                      </Button>
                  </div>
              )}
            </div>
          )
        ) : (
          <div className="p-2 text-center" style={{ minHeight: '200px' }}>
              <AnimatePresence mode="wait">
                {isProcessing ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-5">
                        <Spinner animation="grow" variant="primary" className="mb-3" />
                        <div className="fw-bold text-primary">DeepSeek AI Analyzing Text...</div>
                    </motion.div>
                ) : (
                    <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2 d-block text-start">Paste Content Here</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={5} 
                            placeholder="Paste store details, prices, or messy receipt text here. AI will extract the total."
                            className="rounded-4 p-3 mb-3"
                            style={{ background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                            value={pasteInput}
                            onChange={(e) => setPasteInput(e.target.value)}
                        />
                        <Button 
                            variant="primary" 
                            className="w-100 rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                            onClick={handlePasteProcess}
                            disabled={!pasteInput.trim()}
                        >
                            <FaMagic /> Process with AI
                        </Button>
                    </motion.div>
                )}
              </AnimatePresence>
          </div>
        )}
      </Card.Body>

      <style>{`
        .scanning-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(to bottom, transparent, #3b82f6, transparent);
          box-shadow: 0 0 15px #3b82f6;
          animation: scan 2s linear infinite;
          z-index: 10;
        }
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        .upload-zone:hover {
          background: var(--border-color) !important;
          transition: 0.2s;
        }
      `}</style>
    </Card>
  );
};

export default ReceiptScanner;