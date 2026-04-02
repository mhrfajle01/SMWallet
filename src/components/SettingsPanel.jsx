import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Badge, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useAI } from '../context/AIContext';
import { useQuests } from '../context/QuestContext';
import { FaUser, FaWallet, FaMoon, FaSun, FaShieldAlt, FaBell, FaCheckCircle, FaGlobe, FaRobot, FaCoins, FaVolumeUp, FaSync, FaSave, FaMobileAlt, FaExclamationTriangle, FaTrashAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { requestNotificationPermission, sendNotification } from '../utils/notifications';
import ConfirmModal from './ConfirmModal';

const SettingsPanel = () => {
  const { user, userData, updateUserSettings } = useAuth();
  const { wallets, factoryReset } = useApp();
  const { isDarkMode, toggleTheme } = useTheme();
  const { aiSettings, updateAISettings } = useAI();
  const { forceRegenerate, loading: questsLoading } = useQuests();

  const [editName, setEditName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSavingSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
        await updateUserSettings({ displayName: editName });
        setShowSavingSuccess(true);
        setTimeout(() => setShowSavingSuccess(false), 3000);
    } catch (e) {
        console.error(e);
    } finally {
        setIsSaving(false);
    }
  };

  const handleFactoryReset = async () => {
    setIsResetting(true);
    try {
        await factoryReset();
        alert("System Reset Successful. All data has been cleared.");
        window.location.reload();
    } catch (e) {
        console.error(e);
        alert("Failed to reset system. Please try again.");
    } finally {
        setIsResetting(false);
    }
  };

  const currencies = [
    { code: 'BDT', symbol: '৳', label: 'Bangladeshi Taka' },
    { code: 'USD', symbol: '$', label: 'US Dollar' },
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  ];

  return (
    <div className="settings-container pb-5 px-3 px-md-0">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
            <h2 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>System Settings</h2>
            {showSuccess && <Badge bg="success" className="p-2 px-3 rounded-pill animate__animated animate__fadeIn"><FaCheckCircle className="me-2" /> All Changes Applied</Badge>}
        </div>

        <Row className="g-4">
          <Col lg={8}>
            {/* Profile & Identity */}
            <Card className="dash-card border-0 shadow-sm mb-4" style={{ borderRadius: '1.5rem', background: 'var(--card-bg)' }}>
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FaUser className="text-primary" /> Profile & Identity
                </h5>
                <Row className="align-items-center g-4">
                    <Col md={3} className="text-center">
                        <div className="bg-primary bg-opacity-10 p-4 rounded-circle text-primary mx-auto d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                            <FaUser size={40} />
                        </div>
                    </Col>
                    <Col md={9}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Display Name</Form.Label>
                            <InputGroup className="shadow-sm rounded-pill overflow-hidden border border-color">
                                <Form.Control 
                                    className="border-0 px-4 py-2" 
                                    placeholder="Enter your name" 
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    style={{ background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                                />
                                <Button variant="primary" className="px-4" onClick={handleSaveProfile} disabled={isSaving}>
                                    {isSaving ? <Spinner animation="border" size="sm" /> : <FaSave />}
                                </Button>
                            </InputGroup>
                        </Form.Group>
                        <p className="small mb-0" style={{ color: 'var(--text-secondary)' }}>Registered Email: <span className="fw-bold text-primary">{user?.email}</span></p>
                    </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* AI configuration */}
            <Card className="dash-card border-0 shadow-sm mb-4" style={{ borderRadius: '1.5rem', background: 'var(--card-bg)' }}>
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FaRobot className="text-purple" /> AI Intelligent Engine
                </h5>
                
                <Row className="g-3">
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Preferred Language</Form.Label>
                            <Form.Select 
                                className="rounded-pill px-4 border border-color shadow-sm py-2"
                                value={aiSettings.language || 'english'}
                                onChange={(e) => updateAISettings({ language: e.target.value })}
                                style={{ background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                            >
                                <option value="english">English (Global)</option>
                                <option value="bangla">Bangla (বাংলা)</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Select AI Model</Form.Label>
                            <Form.Select 
                                className="rounded-pill px-4 border border-color shadow-sm py-2"
                                value={aiSettings.preferredModel || 'builtIn'}
                                onChange={(e) => updateAISettings({ preferredModel: e.target.value })}
                                style={{ background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                            >
                                <option value="builtIn">Google Gemini (Recommended)</option>
                                <option value="deepseek">DeepSeek AI (Advanced)</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>

                <hr className="my-4 opacity-10" />

                <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Gemini API Key</Form.Label>
                    <Form.Control 
                        type="password"
                        className="rounded-pill px-4 border border-color shadow-sm py-2"
                        placeholder="Paste your API key securely here"
                        value={aiSettings.geminiKey || ''}
                        onChange={(e) => updateAISettings({ geminiKey: e.target.value })}
                        style={{ background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                    />
                    <Form.Text className="text-muted small px-2">Your keys are stored securely and never shared.</Form.Text>
                </Form.Group>

                <div className="d-grid mt-4">
                    <Button 
                        variant="outline-primary" 
                        className="rounded-pill py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                        onClick={forceRegenerate}
                        disabled={questsLoading}
                    >
                        {questsLoading ? <Spinner animation="border" size="sm" /> : <FaSync className={questsLoading ? 'animate-spin' : ''} />}
                        Sync & Regenerate AI Tasks
                    </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Localization & Preferences */}
            <Card className="dash-card border-0 shadow-sm mb-4" style={{ borderRadius: '1.5rem', background: 'var(--card-bg)' }}>
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FaCoins className="text-warning" /> Localization & Display
                </h5>
                <Row className="g-3">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="small fw-bold text-uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Base Currency</Form.Label>
                            <Form.Select 
                                className="rounded-pill px-4 border border-color shadow-sm py-2"
                                value={aiSettings.currency || 'BDT'}
                                onChange={(e) => updateAISettings({ currency: e.target.value })}
                                style={{ background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                            >
                                {currencies.map(c => <option key={c.code} value={c.code}>{c.symbol} - {c.label}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="small fw-bold text-uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Interactions</Form.Label>
                            <div className="d-flex flex-column gap-2 mt-2 px-3">
                                <Form.Check 
                                    type="switch"
                                    id="sound-switch"
                                    label="Sound Effects"
                                    className="small fw-medium"
                                    checked={aiSettings.soundsEnabled !== false}
                                    onChange={(e) => updateAISettings({ soundsEnabled: e.target.checked })}
                                />
                                <Form.Check 
                                    type="switch"
                                    id="haptic-switch"
                                    label="Haptic Vibration"
                                    className="small fw-medium"
                                    checked={aiSettings.hapticEnabled !== false}
                                    onChange={(e) => updateAISettings({ hapticEnabled: e.target.checked })}
                                />
                                <Form.Check 
                                    type="switch"
                                    id="notif-switch"
                                    label="Push Notifications"
                                    className="small fw-medium"
                                    checked={aiSettings.notifEnabled === true}
                                    onChange={async (e) => {
                                        const granted = await requestNotificationPermission();
                                        if (granted) {
                                            updateAISettings({ notifEnabled: true });
                                            sendNotification("Notifications Enabled", { body: "You will now receive alerts for tasks and goals!" });
                                        } else {
                                            updateAISettings({ notifEnabled: false });
                                            alert("Please enable notification permission in your browser settings.");
                                        }
                                    }}
                                />
                            </div>
                        </Form.Group>
                    </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Danger Zone */}
            <Card className="dash-card border-0 shadow-sm mb-4" style={{ borderRadius: '1.5rem', background: 'var(--card-bg)', borderColor: '#fee2e2 !important' }}>
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2 text-danger">
                  <FaExclamationTriangle /> Danger Zone
                </h5>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div>
                        <h6 className="fw-bold mb-1">Factory Reset System</h6>
                        <p className="small text-muted mb-0">Permanently delete all wallets, transactions, habits, goals, and history. This cannot be undone.</p>
                    </div>
                    <Button 
                        variant="outline-danger" 
                        className="rounded-pill px-4 fw-bold flex-shrink-0"
                        onClick={() => setShowResetConfirm(true)}
                        disabled={isResetting}
                    >
                        {isResetting ? <Spinner animation="border" size="sm" /> : <><FaTrashAlt className="me-2" /> Reset All Data</>}
                    </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            {/* Theme Toggle Card */}
            <Card className="dash-card border-0 shadow-sm mb-4" style={{ borderRadius: '1.5rem', background: 'var(--card-bg)' }}>
              <Card.Body className="p-4">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    {isDarkMode ? <FaMoon className="text-warning" /> : <FaSun className="text-warning" />} Theme Appearance
                </h6>
                <Button 
                    variant={isDarkMode ? "light" : "dark"} 
                    className="w-100 rounded-pill py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm fw-bold" 
                    onClick={toggleTheme}
                    style={{ transition: 'all 0.3s ease' }}
                >
                    {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                </Button>
                <p className="x-small text-muted text-center mt-3 mb-0">Switching modes applies instantly to all components.</p>
              </Card.Body>
            </Card>

            {/* Cloud Status */}
            <Card className="border-0 shadow-sm mb-4 text-white" style={{ borderRadius: '1.5rem', background: 'var(--primary-gradient)' }}>
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-white">
                    <FaShieldAlt /> System Status
                </h5>
                <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="rounded-circle bg-white bg-opacity-20 p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        <FaSync className="animate-spin text-white" />
                    </div>
                    <div>
                        <div className="small fw-bold text-white">Cloud Sync Active</div>
                        <div className="x-small text-white opacity-90">All data secured via Firebase</div>
                    </div>
                </div>
                <hr className="bg-white opacity-20" />
                <div className="d-flex justify-content-between x-small text-white opacity-90">
                    <span>App Version</span>
                    <span className="fw-bold">v2.2.0-PRO</span>
                </div>
              </Card.Body>
            </Card>

            <Alert variant="info" className="border-0 rounded-4 shadow-sm bg-info bg-opacity-10 border-start border-4 border-info">
                <h6 className="fw-bold d-flex align-items-center gap-2 text-info"><FaRobot /> AI Intelligence</h6>
                <p className="x-small mb-0" style={{ color: 'var(--text-primary)' }}>Language changes require task regeneration. Use the button in the Intelligent Engine section to update your current quests.</p>
            </Alert>
          </Col>
        </Row>
      </motion.div>

      <ConfirmModal 
        show={showResetConfirm}
        onHide={() => setShowResetConfirm(false)}
        onConfirm={handleFactoryReset}
        title="Factory Reset System?"
        message="This will permanently delete ALL your financial data, habits, goals, and achievements. You will start over from Level 1. This action is irreversible."
        confirmText="Yes, Reset Everything"
      />

      <style>{`
        .dash-card { background: var(--card-bg); transition: all 0.3s ease; border: 1px solid var(--border-color) !important; }
        .text-purple { color: #a78bfa; }
        .border-color { border-color: var(--border-color) !important; }
        .animate-spin { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        body.dark-mode .text-purple { color: #c4b5fd; }
        body.dark-mode .bg-primary.bg-opacity-10 { background-color: rgba(96, 165, 250, 0.15) !important; }
        
        .form-select, .form-control {
            border: 1px solid var(--border-color) !important;
            color: var(--text-primary) !important;
        }

        .x-small { font-size: 0.75rem; }
        
        @media (max-width: 768px) {
            .settings-container h2 { font-size: 1.5rem; }
        }
      `}</style>
    </div>
  );
};

export default SettingsPanel;

