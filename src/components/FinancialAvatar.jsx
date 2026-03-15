import React, { useState, useEffect, useMemo } from 'react';
import { Card, ProgressBar, Badge, Spinner, Row, Col } from 'react-bootstrap';
import { FaBolt, FaHeart, FaCommentDots, FaShieldAlt, FaChartLine, FaSeedling, FaGem, FaFire, FaSkull } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import { useProductivity } from '../context/ProductivityContext';
import { useQuests } from '../context/QuestContext';
import { aiService } from '../utils/aiService';
import { motion, AnimatePresence } from 'framer-motion';

const FinancialAvatar = () => {
  const { avatarState, globalStats, budgets, wallets, meals, purchases } = useApp();
  const { todos, habitLogs } = useProductivity();
  const { dailyQuests, claimQuestReward, loading: loadingQuests } = useQuests();
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

  // Derived Bosses Logic
  const activeBosses = useMemo(() => {
    const bosses = [];
    // Debt Boss
    if (globalStats.totalDebt > 5000) {
        bosses.push({ 
            id: 'debt_boss',
            name: 'Debt Titan', 
            health: Math.max(10, 100 - (globalStats.totalDebt / 500)), 
            icon: <FaSkull className="text-danger" />,
            description: 'A massive weight on your spirit. Settle your liabilities to defeat it.'
        });
    }
    // Budget Bosses
    budgets.forEach(b => {
        const catSpent = meals.filter(m => m.category === b.id).reduce((a, c) => a + Number(c.amount || 0), 0) +
                         purchases.filter(p => p.category === b.id).reduce((a, c) => a + Number(c.amount || 0), 0);
        if (catSpent > b.limit) {
            const overPercent = ((catSpent / b.limit) - 1) * 100;
            bosses.push({
                id: `budget_${b.id}`,
                name: `${b.id} Glutton`,
                health: Math.max(5, 100 - overPercent),
                icon: <FaBolt className="text-warning" />,
                description: `You've overspent in ${b.label}. Stop spending here to weaken it!`
            });
        }
    });
    return bosses;
  }, [globalStats.totalDebt, budgets, meals, purchases]);

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

  const renderAvatarSVG = () => {
    const lvl = statsSummary.level;
    const color = getMoodColor();
    
    // Level 1-10: Spirit (Circle)
    // Level 11-20: Guardian (Shield)
    // Level 21+: Archon (Diamond/Crown)

    return (
        <svg width="80" height="80" viewBox="0 0 100 100">
            {/* Body Evolution */}
            {lvl <= 10 ? (
                <motion.circle cx="50" cy="50" r="40" fill={color} initial={{ scale: 0 }} animate={{ scale: 1 }} />
            ) : lvl <= 20 ? (
                <motion.path 
                    d="M 50 10 L 85 25 L 85 65 Q 50 95 15 65 L 15 25 Z" 
                    fill={color} initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                />
            ) : (
                <motion.path 
                    d="M 50 5 L 90 40 L 50 95 L 10 40 Z" 
                    fill={color} initial={{ rotate: -45 }} animate={{ rotate: 0 }} 
                />
            )}

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

            {/* Level Decoration */}
            {lvl >= 5 && <path d="M 30 20 L 50 5 L 70 20" fill="none" stroke="#fbbf24" strokeWidth="4" />}
            {lvl >= 25 && <circle cx="50" cy="50" r="45" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="10 5" />}
        </svg>
    );
  };

  return (
    <Card className="border-0 shadow-sm overflow-hidden mb-4" style={{ background: 'var(--card-bg)' }}>
      <Card.Body className="p-4">
        <Row className="align-items-start g-4">
          <Col xs={12} md={4} className="text-center border-md-end border-color">
            {/* Avatar Visual */}
            <div className="position-relative d-inline-block mb-3">
                <motion.div 
                    animate={{ 
                        y: [0, -10, 0],
                        scale: statsSummary.health < 40 ? [1, 0.98, 1] : 1
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="avatar-container rounded-circle d-flex align-items-center justify-content-center shadow-lg mx-auto"
                    style={{ 
                        width: '140px', 
                        height: '140px', 
                        background: `radial-gradient(circle, ${getMoodColor()}22 0%, ${getMoodColor()}00 70%)`,
                        border: `2px solid ${getMoodColor()}44`
                    }}
                >
                    {renderAvatarSVG()}
                </motion.div>
                <Badge bg="primary" className="position-absolute bottom-0 end-0 rounded-pill px-3 py-2 shadow border border-2 border-white">
                    LVL {statsSummary.level}
                </Badge>
                
                {avatarState.streak > 1 && (
                    <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="position-absolute top-0 start-0 badge rounded-pill bg-warning text-dark px-2 py-1 shadow d-flex align-items-center gap-1"
                    >
                        <FaFire /> {avatarState.streak} Day Streak
                    </motion.div>
                )}
            </div>

            <div className="mt-2">
                <div className="d-flex align-items-center justify-content-center gap-2 small fw-bold mb-1" style={{ color: getMoodColor() }}>
                    <FaHeart /> Health {statsSummary.health}%
                </div>
                <ProgressBar now={statsSummary.health} variant={statsSummary.health > 50 ? 'success' : statsSummary.health > 25 ? 'warning' : 'danger'} style={{ height: '6px' }} />
                <div className="x-small text-muted mt-2 fw-bold text-uppercase tracking-wider">
                    Multiplier: {(avatarState.multiplier || 1).toFixed(2)}x
                </div>
            </div>
          </Col>

          <Col xs={12} md={8}>
            <div className="dialogue-box p-3 rounded-4 mb-3 position-relative" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                <FaCommentDots className="position-absolute top-0 start-0 m-2 opacity-25" />
                {isTyping ? (
                    <div className="py-1"><Spinner animation="grow" size="sm" variant="primary" /></div>
                ) : (
                    <p className="mb-0 small fw-medium" style={{ color: 'var(--text-primary)' }}>{dialogue}</p>
                )}
            </div>

            {/* Skill Trees */}
            <h6 className="x-small fw-bold text-muted text-uppercase mb-3 tracking-wider d-flex align-items-center gap-2">
                <FaChartLine /> Financial Skill Mastery
            </h6>
            <Row className="g-3 mb-4">
                <Col xs={4}>
                    <div className="skill-card p-2 rounded-3 text-center" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
                        <FaSeedling className="text-primary mb-1" />
                        <div className="x-small fw-bold text-muted">Frugality</div>
                        <div className="small fw-bold">{avatarState.xp_frugality || 0}</div>
                        <ProgressBar now={(avatarState.xp_frugality || 0) % 100} style={{ height: '3px' }} className="mt-1" />
                    </div>
                </Col>
                <Col xs={4}>
                    <div className="skill-card p-2 rounded-3 text-center" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                        <FaGem className="text-success mb-1" />
                        <div className="x-small fw-bold text-muted">Wealth</div>
                        <div className="small fw-bold">{avatarState.xp_wealth || 0}</div>
                        <ProgressBar now={(avatarState.xp_wealth || 0) % 100} style={{ height: '3px' }} className="mt-1" variant="success" />
                    </div>
                </Col>
                <Col xs={4}>
                    <div className="skill-card p-2 rounded-3 text-center" style={{ background: 'rgba(139, 92, 246, 0.05)' }}>
                        <FaShieldAlt className="text-purple mb-1" />
                        <div className="x-small fw-bold text-muted">Consistency</div>
                        <div className="small fw-bold">{avatarState.xp_consistency || 0}</div>
                        <ProgressBar now={(avatarState.xp_consistency || 0) % 100} style={{ height: '3px' }} className="mt-1" variant="info" />
                    </div>
                </Col>
            </Row>

            {/* Daily Quests Section */}
            {loadingQuests ? (
                <div className="quests-section mb-4 text-center py-3">
                    <Spinner animation="border" size="sm" variant="primary" className="me-2" />
                    <span className="small text-muted">AI is generating your quests...</span>
                </div>
            ) : dailyQuests && (
                <div className="quests-section mb-4">
                    <h6 className="x-small fw-bold text-muted text-uppercase mb-3 tracking-wider d-flex align-items-center gap-2">
                        <FaBolt className="text-warning" /> AI Daily Quests
                    </h6>
                    <div className="d-flex flex-column gap-2">
                        {dailyQuests.tasks.map(task => (
                            <div key={task.id} className="p-2 rounded-3 border-0" style={{ background: 'var(--bg-color)' }}>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <div className="d-flex flex-column">
                                        <span className="small fw-bold" style={{ color: 'var(--text-primary)' }}>{task.title}</span>
                                        <span className="x-small text-muted">{task.description}</span>
                                    </div>
                                    {task.completed && !task.rewardClaimed ? (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => claimQuestReward(task.id)}
                                            className="btn btn-warning btn-sm py-0 px-2 x-small fw-bold rounded-pill"
                                        >
                                            Claim {task.xp} XP
                                        </motion.button>
                                    ) : task.rewardClaimed ? (
                                        <Badge bg="success" className="rounded-pill px-2 py-1 x-small">Done +{task.xp}</Badge>
                                    ) : (
                                        <span className="x-small fw-bold text-primary">{Math.round(task.progress * 100)}%</span>
                                    )}
                                </div>
                                <ProgressBar now={task.progress * 100} style={{ height: '4px' }} variant={task.completed ? 'success' : 'primary'} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Bosses */}
            {activeBosses.length > 0 && (
                <div className="boss-section">
                    <h6 className="x-small fw-bold text-danger text-uppercase mb-3 tracking-wider d-flex align-items-center gap-2">
                        <FaSkull /> Active Financial Bosses
                    </h6>
                    <div className="d-flex flex-column gap-3">
                        {activeBosses.map(boss => (
                            <div key={boss.id} className="boss-card p-3 rounded-4 border border-danger border-opacity-25" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div className="d-flex align-items-center gap-2 fw-bold small">
                                        {boss.icon} {boss.name}
                                    </div>
                                    <Badge bg="danger" className="x-small">BOSS</Badge>
                                </div>
                                <ProgressBar now={boss.health} variant="danger" style={{ height: '8px' }} className="mb-2 shadow-sm" />
                                <p className="x-small text-muted mb-0">{boss.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Total XP Bar if no bosses */}
            {activeBosses.length === 0 && (
                <div className="mt-4">
                    <div className="d-flex justify-content-between x-small text-muted mb-1 px-1">
                        <span>XP Progress</span>
                        <span>{Math.round(avatarState.xpInLevel || 0)}/{Math.round(avatarState.nextLevelXp || 100)} XP</span>
                    </div>
                    <ProgressBar 
                        now={((avatarState.xpInLevel || 0) / (avatarState.nextLevelXp || 100)) * 100} 
                        style={{ height: '10px' }} 
                        className="rounded-pill shadow-sm" 
                    />
                </div>
            )}
          </Col>
        </Row>
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
        .text-purple { color: #8b5cf6; }
        .skill-card { transition: transform 0.2s; }
        .skill-card:hover { transform: translateY(-2px); }
        .boss-card { animation: pulse-border 2s infinite; }
        @keyframes pulse-border {
            0% { border-color: rgba(239, 68, 68, 0.25); }
            50% { border-color: rgba(239, 68, 68, 0.5); }
            100% { border-color: rgba(239, 68, 68, 0.25); }
        }
        @media (min-width: 768px) {
            .dialogue-box::before { display: block; }
        }
      `}</style>
    </Card>
  );
};

export default FinancialAvatar;