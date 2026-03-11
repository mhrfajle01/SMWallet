import React, { useState, useEffect, useMemo } from 'react';
import { Card, ProgressBar, Badge, Spinner } from 'react-bootstrap';
import { FaBolt, FaHeart, FaCommentDots, FaShieldAlt } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import { useProductivity } from '../context/ProductivityContext';
import { aiService } from '../utils/aiService';
import { motion, AnimatePresence } from 'framer-motion';

const FinancialAvatar = () => {
  const { avatarState, globalStats, budgets } = useApp();
  const { todos, habitLogs } = useProductivity();
  const [dialogue, setDialogue] = useState("Hello! I'm your financial guide. Let's grow together!");
  const [isTyping, setIsTyping] = useState(false);

  const statsSummary = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const doneTasks = todos.filter(t => t.completed).length;
    const doneHabits = habitLogs.filter(l => l.date === today && l.status).length;
    
    return {
        level: avatarState.level,
        health: avatarState.health,
        spent: globalStats.totalSpent,
        tasks: doneTasks,
        habits: doneHabits
    };
  }, [avatarState, globalStats, todos, habitLogs]);

  useEffect(() => {
    const fetchDialogue = async () => {
        setIsTyping(true);
        const promptSummary = {
            current_status: `Level ${statsSummary.level}, Health ${statsSummary.health}/100`,
            performance: `Spent ${statsSummary.spent} BDT, ${statsSummary.tasks} tasks done, ${statsSummary.habits} habits done today.`
        };
        
        try {
            const response = await aiService.getFinancialInsights(promptSummary);
            setDialogue(response.split('\n')[0] || "Keep up the great work!");
        } catch (e) {
            setDialogue(statsSummary.health < 50 ? "We need to save more!" : "Doing great today!");
        } finally {
            setIsTyping(false);
        }
    };

    const timer = setTimeout(fetchDialogue, 2000);
    return () => clearTimeout(timer);
  }, [statsSummary.health, statsSummary.level]);

  const getMoodColor = () => {
    if (statsSummary.health > 80) return '#10b981'; // Green
    if (statsSummary.health > 50) return '#3b82f6'; // Blue
    if (statsSummary.health > 30) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <Card className="border-0 shadow-sm overflow-hidden mb-4" style={{ background: 'var(--card-bg)' }}>
      <Card.Body className="p-4">
        <div className="d-flex flex-column flex-md-row align-items-center gap-4">
          {/* Avatar Visual */}
          <div className="position-relative">
            <motion.div 
                animate={{ 
                    y: [0, -10, 0],
                    scale: statsSummary.health < 40 ? [1, 0.98, 1] : 1
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="avatar-container rounded-circle d-flex align-items-center justify-content-center shadow-lg"
                style={{ 
                    width: '120px', 
                    height: '120px', 
                    background: `radial-gradient(circle, ${getMoodColor()}22 0%, ${getMoodColor()}00 70%)`,
                    border: `2px solid ${getMoodColor()}44`
                }}
            >
                <svg width="80" height="80" viewBox="0 0 100 100">
                    {/* Body */}
                    <motion.circle cx="50" cy="50" r="40" fill={getMoodColor()} initial={{ scale: 0 }} animate={{ scale: 1 }} />
                    {/* Eyes */}
                    <g fill="white">
                        <motion.circle cx="35" cy="40" r={statsSummary.health < 40 ? 3 : 6} animate={{ scaleY: [1, 0.1, 1] }} transition={{ repeat: Infinity, duration: 3, times: [0, 0.1, 0.2] }} />
                        <motion.circle cx="65" cy="40" r={statsSummary.health < 40 ? 3 : 6} animate={{ scaleY: [1, 0.1, 1] }} transition={{ repeat: Infinity, duration: 3, times: [0, 0.1, 0.2] }} />
                    </g>
                    {/* Mouth */}
                    <motion.path 
                        d={statsSummary.health > 60 ? "M 35 65 Q 50 75 65 65" : "M 35 70 Q 50 60 65 70"} 
                        stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"
                    />
                    {/* Accessories based on level */}
                    {statsSummary.level >= 2 && (
                        <path d="M 20 20 L 50 5 L 80 20" fill="none" stroke="#fbbf24" strokeWidth="4" />
                    )}
                </svg>
            </motion.div>
            <Badge bg="primary" className="position-absolute bottom-0 end-0 rounded-pill px-2 py-1 shadow">
                LVL {statsSummary.level}
            </Badge>
          </div>

          {/* Stats & Dialogue */}
          <div className="flex-grow-1 w-100">
            <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <h5 className="fw-bold mb-0">Financial Spirit</h5>
                    <small className="text-muted">Your journey companion</small>
                </div>
                <div className="text-end">
                    <div className="d-flex align-items-center gap-2 small fw-bold" style={{ color: getMoodColor() }}>
                        <FaHeart /> Health {statsSummary.health}%
                    </div>
                </div>
            </div>

            <div className="dialogue-box p-3 rounded-4 mb-3 position-relative" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                <FaCommentDots className="position-absolute top-0 start-0 m-2 opacity-25" />
                {isTyping ? (
                    <div className="py-1"><Spinner animation="grow" size="sm" variant="primary" /></div>
                ) : (
                    <p className="mb-0 small fw-medium" style={{ color: 'var(--text-primary)' }}>{dialogue}</p>
                )}
            </div>

            <div className="stats-grid d-flex gap-3">
                <div className="flex-grow-1">
                    <div className="d-flex justify-content-between x-small fw-bold text-muted mb-1">
                        <span>XP Progress</span>
                        <span>{avatarState.xp % 100}/100</span>
                    </div>
                    <ProgressBar now={avatarState.xp % 100} style={{ height: '6px', background: 'var(--bg-color)' }} />
                </div>
            </div>
          </div>
        </div>
      </Card.Body>

      <style>{`
        .avatar-container {
            background: var(--bg-surface);
            transition: all 0.5s ease;
        }
        .dialogue-box::before {
            content: '';
            position: absolute;
            left: -10px;
            top: 50%;
            transform: translateY(-50%);
            border-top: 10px solid transparent;
            border-bottom: 10px solid transparent;
            border-right: 10px solid var(--border-color);
            display: none;
        }
        @media (min-width: 768px) {
            .dialogue-box::before { display: block; }
        }
      `}</style>
    </Card>
  );
};

export default FinancialAvatar;