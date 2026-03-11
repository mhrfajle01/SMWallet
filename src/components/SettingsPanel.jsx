import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { FaUser, FaWallet, FaMoon, FaSun, FaShieldAlt, FaBell, FaCheckCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsPanel = () => {
  const { user, userData, updateUserSettings } = useAuth();
  const { wallets } = useApp();
  const { isDarkMode, toggleTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleWalletSelect = async (walletId) => {
    setSaving(true);
    try {
        await updateUserSettings({ pinnedWalletId: walletId });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    } catch (e) {
        console.error(e);
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="settings-container pb-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="fw-bold mb-4">Settings</h2>

        <Row className="g-4">
          <Col lg={8}>
            {/* Profile Card */}
            <Card className="dash-card border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-4">
                  <div className="bg-primary bg-opacity-10 p-4 rounded-circle text-primary">
                    <FaUser size={40} />
                  </div>
                  <div>
                    <h4 className="fw-bold mb-1">{user?.displayName || 'User'}</h4>
                    <p className="text-muted mb-0">{user?.email}</p>
                    <Badge bg="success" className="rounded-pill mt-2">Verified Pro</Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Security & System */}
            <Card className="dash-card border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                  <FaShieldAlt className="text-danger" /> Security
                </h5>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h6 className="fw-bold mb-1">Biometric / PIN Lock</h6>
                        <p className="small text-muted mb-0">Coming soon for Android users.</p>
                    </div>
                    <Form.Check type="switch" disabled />
                </div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h6 className="fw-bold mb-1">Cloud Sync</h6>
                        <p className="small text-muted mb-0">All data is encrypted and synced with Firebase.</p>
                    </div>
                    <Badge bg="primary">Active</Badge>
                </div>
                <hr className="my-4 opacity-10" />
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="fw-bold mb-1">App Theme</h6>
                    <p className="small text-muted mb-0">Switch between dark and light modes.</p>
                  </div>
                  <Button variant={isDarkMode ? "light" : "dark"} className="rounded-pill px-4 d-flex align-items-center gap-2" onClick={toggleTheme}>
                    {isDarkMode ? <><FaSun className="text-warning" /> Light</> : <><FaMoon /> Dark</>}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="dash-card border-0 shadow-sm p-4 bg-primary text-white">
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2"><FaBell /> Updates</h5>
                <p className="small opacity-90 mb-0">You are using SMWallet v2.0. All systems operational.</p>
            </Card>
          </Col>
        </Row>
      </motion.div>
    </div>
  );
};

export default SettingsPanel;