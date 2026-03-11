import React, { useState } from 'react';
import { FaWallet } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const FloatingBalance = ({ isMobile = true }) => {
    const auth = useAuth();
    const app = useApp();
    const [showBalance, setShowBalance] = useState(false);

    // Safety checks for context
    if (!auth || !app) return null;

    const { userData } = auth;
    const { wallets = [], globalStats = { totalBalance: 0 } } = app;

    const pinnedWalletId = userData?.pinnedWalletId;
    const pinnedWallet = wallets.find(w => w.id === pinnedWalletId);
    
    // Find "Money bag" or "Moneybag" (flexible with spaces)
    const moneybagWallet = wallets.find(w => {
        const name = (w.name || '').toLowerCase().replace(/\s+/g, '');
        return name === 'moneybag' || name === 'moneybagaccount';
    });
    
    const selectedWallet = pinnedWallet || moneybagWallet;

    const balanceLabel = selectedWallet ? selectedWallet.name : 'Total Balance';
    const balanceValue = selectedWallet ? selectedWallet.remaining : globalStats.totalBalance;

    return (
        <motion.div 
            className={`balance-capsule ${isMobile ? 'mobile' : 'desktop'}`}
            onClick={() => setShowBalance(!showBalance)}
            whileTap={{ scale: 0.95 }}
        >
            <div className="balance-content">
                <div className="balance-icon">
                    <FaWallet size={12} />
                </div>
                <div className="balance-info">
                    <span className="balance-label text-truncate" style={{ maxWidth: isMobile ? '80px' : '120px' }}>{balanceLabel}</span>
                    <AnimatePresence mode="wait">
                        {showBalance ? (
                            <motion.span 
                                key="val"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="balance-value"
                            >
                                ৳ {new Intl.NumberFormat('en-BD').format(Number(balanceValue) || 0)}
                            </motion.span>
                        ) : (
                            <motion.span 
                                key="placeholder"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="balance-placeholder"
                            >
                                Tap for balance
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            
            <style>{`
                .balance-capsule {
                    background: white;
                    border-radius: 50px;
                    padding: 4px 12px 4px 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    user-select: none;
                    min-width: 140px;
                    height: 36px;
                    transition: all 0.2s;
                }
                .balance-capsule:hover {
                    border-color: #cbd5e1;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.07);
                }
                [data-theme='dark'] .balance-capsule {
                    background: #1e293b;
                    border-color: #334155;
                }
                .balance-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    width: 100%;
                }
                .balance-icon {
                    background: #6366f1;
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .balance-info {
                    display: flex;
                    flex-direction: column;
                    line-height: 1.1;
                    overflow: hidden;
                }
                .balance-label {
                    font-size: 0.6rem;
                    font-weight: 800;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .balance-value {
                    font-size: 0.8rem;
                    font-weight: 800;
                    color: #6366f1;
                }
                .balance-placeholder {
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: #94a3b8;
                }
                .balance-capsule.desktop {
                    margin: 0 auto 20px auto;
                    width: 100%;
                }
            `}</style>
        </motion.div>
    );
};

export default FloatingBalance;