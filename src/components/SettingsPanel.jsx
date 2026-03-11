import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Badge, InputGroup, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { FaUser, FaWallet, FaMoon, FaSun, FaShieldAlt, FaBell, FaCheckCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsPanel = () => {
  const { user, userData, updateUserSettings } = useAuth();
  const { wallets } = useApp();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="settings-container pb-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="fw-bold mb-4">Settings</h2>

        <Row className="g-4">
          <Col lg={8}>
            {/* Profile Card */}
            <Card className="dash-card border-0 shadow-sm mb-4" style={{ borderRadius: '1.5rem' }}>
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
            <Card className="dash-card border-0 shadow-sm" style={{ borderRadius: '1.5rem' }}>
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                  <FaShieldAlt className="text-danger" /> System & Security
                </h5>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h6 className="fw-bold mb-1">Cloud Sync</h6>
                        <p className="small text-muted mb-0">Your data is securely stored in Firebase.</p>
                    </div>
                    <Badge bg="primary" className="rounded-pill px-3">Connected</Badge>
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
            <Card className="dash-card border-0 shadow-sm p-4 bg-primary text-white" style={{ borderRadius: '1.5rem' }}>
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2"><FaBell /> Version Info</h5>
                <p className="small opacity-90 mb-0">SMWallet v2.2.0<br/>Privacy-first smart finance.</p>
            </Card>
          </Col>
        </Row>
      </motion.div>
      <style>{`
        .dash-card { background: var(--card-bg); transition: all 0.3s ease; }
      `}</style>
    </div>
  );
};

export default SettingsPanel;