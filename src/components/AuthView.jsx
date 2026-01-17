import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope, FaLock, FaGoogle, FaWallet, FaArrowRight, FaUserPlus, FaSignInAlt } from 'react-icons/fa';

const AuthView = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, loginWithGoogle } = useAuth();
  const { isDarkMode } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      setError(err.message.replace('Firebase:', ''));
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message.replace('Firebase:', ''));
    }
  };

  return (
    <div className="auth-wrapper d-flex align-items-center justify-content-center" 
      style={{ 
        minHeight: '100vh', 
        background: isDarkMode ? '#0f172a' : '#f0f4f8',
        padding: '20px'
      }}>
      
      {/* Background Orbs for Color */}
      <div style={{
        position: 'fixed',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%)',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        bottom: '10%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0) 70%)',
        zIndex: 0
      }} />

      <Container style={{ zIndex: 1 }}>
        <Row className="justify-content-center">
          <Col md={10} lg={8} xl={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-0 shadow-lg overflow-hidden" 
                style={{ 
                  borderRadius: '24px',
                  background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(20px)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.5)'
                }}>
                <Row className="g-0">
                  {/* Visual Side (Hidden on Mobile) */}
                  <Col md={5} className="d-none d-md-block" 
                    style={{ 
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      color: 'white'
                    }}>
                    <div className="h-100 d-flex flex-column justify-content-center p-4 text-center">
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                      >
                        <FaWallet size={60} className="mb-4" />
                      </motion.div>
                      <h2 className="fw-bold mb-3">SMWallet</h2>
                      <p className="opacity-75">Your intelligent companion for smart savings and expense tracking.</p>
                      <div className="mt-4 pt-4 border-top border-white border-opacity-20">
                        <small className="d-block mb-2">Secure & Encrypted</small>
                        <div className="d-flex justify-content-center gap-2">
                          <div className="bg-white bg-opacity-20 rounded-pill px-3 py-1 small">Safe</div>
                          <div className="bg-white bg-opacity-20 rounded-pill px-3 py-1 small">Fast</div>
                        </div>
                      </div>
                    </div>
                  </Col>

                  {/* Form Side */}
                  <Col md={7}>
                    <Card.Body className="p-4 p-lg-5">
                      <div className="d-flex align-items-center mb-4 d-md-none">
                        <div className="bg-primary rounded-circle p-2 me-2 text-white">
                          <FaWallet size={20} />
                        </div>
                        <h4 className="fw-bold mb-0 text-primary">SMWallet</h4>
                      </div>

                      <div className="mb-4">
                        <h3 className="fw-bold mb-1">{isLogin ? 'Welcome Back' : 'Create Account'}</h3>
                        <p className="text-muted small">
                          {isLogin ? 'Enter your credentials to access your wallet' : 'Start your journey to financial freedom today'}
                        </p>
                      </div>

                      <AnimatePresence mode="wait">
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                          >
                            <Alert variant="danger" className="py-2 small border-0 rounded-3">
                              {error}
                            </Alert>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-bold text-muted">EMAIL ADDRESS</Form.Label>
                          <InputGroup className="shadow-sm rounded-3 overflow-hidden">
                            <InputGroup.Text className="border-0 bg-light px-3">
                              <FaEnvelope className="text-primary" />
                            </InputGroup.Text>
                            <Form.Control 
                              type="email" 
                              placeholder="name@example.com" 
                              className="border-0 bg-light py-2"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                            />
                          </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-4">
                          <Form.Label className="small fw-bold text-muted">PASSWORD</Form.Label>
                          <InputGroup className="shadow-sm rounded-3 overflow-hidden">
                            <InputGroup.Text className="border-0 bg-light px-3">
                              <FaLock className="text-primary" />
                            </InputGroup.Text>
                            <Form.Control 
                              type="password" 
                              placeholder="••••••••" 
                              className="border-0 bg-light py-2"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                          </InputGroup>
                        </Form.Group>

                        <Button 
                          type="submit" 
                          variant="primary" 
                          className="w-100 py-2 fw-bold rounded-3 shadow-sm btn-primary-custom mb-3 d-flex align-items-center justify-content-center gap-2"
                          disabled={loading}
                        >
                          {loading ? 'Processing...' : (
                            <>
                              {isLogin ? <><FaSignInAlt /> Login</> : <><FaUserPlus /> Sign Up</>}
                              <FaArrowRight size={12} />
                            </>
                          )}
                        </Button>

                        <div className="text-center mb-3">
                          <span className="text-muted small">Or continue with</span>
                        </div>

                        <Button 
                          variant="outline-light" 
                          className={`w-100 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2 mb-4 ${isDarkMode ? 'border-secondary' : 'border-light text-dark'}`}
                          style={{ border: !isDarkMode ? '1px solid #e2e8f0' : '' }}
                          onClick={handleGoogleSignIn}
                        >
                          <FaGoogle className="text-danger" /> Google
                        </Button>

                        <div className="text-center">
                          <p className="text-muted small mb-0">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <Button 
                              variant="link" 
                              className="p-0 ms-1 fw-bold text-decoration-none small"
                              onClick={() => setIsLogin(!isLogin)}
                            >
                              {isLogin ? 'Sign Up' : 'Login'}
                            </Button>
                          </p>
                        </div>
                      </Form>
                    </Card.Body>
                  </Col>
                </Row>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AuthView;