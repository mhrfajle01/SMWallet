import React, { useState, useEffect, useMemo } from 'react';
import { Card, ProgressBar, Badge, Spinner, Row, Col, Modal, Button } from 'react-bootstrap';
import { FaBolt, FaHeart, FaCommentDots, FaShieldAlt, FaChartLine, FaSeedling, FaGem, FaFire, FaSkull, FaTrophy, FaLock, FaInfoCircle, FaStar } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import { useProductivity } from '../context/ProductivityContext';
import { useQuests } from '../context/QuestContext';
import { useAchievements } from '../context/AchievementContext';
import { useAI } from '../context/AIContext';
import { aiService } from '../utils/aiService';
import { motion, AnimatePresence } from 'framer-motion';

const FinancialAvatar = () => {
  const { avatarState, globalStats, budgets, wallets, meals, purchases, earnXP, isShieldActive } = useApp();
  const { todos, habitLogs } = useProductivity();
  const { dailyQuests, weeklyQuest, claimQuestReward, claimWeeklyReward, loading: loadingQuests } = useQuests();
  const { achievements } = useAchievements();
  const { aiSettings } = useAI();
  
  const [dialogue, setDialogue] = useState("Hello! I'm your financial guide. Let's grow together!");
  const [isTyping, setIsTyping] = useState(false);
  const [attackTarget, setAttackTarget] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showPerks, setShowPerks] = useState(false);

  const lang = aiSettings.language || 'english';

  const t = {
    english: {
        achievements: "Achievements",
        viewAll: "View All",
        noAchievements: "No achievements yet. Keep growing!",
        galleryTitle: "Achievement Gallery",
        close: "Close",
        skillMastery: "Financial Skill Mastery",
        frugality: "Frugality",
        wealth: "Wealth",
        consistency: "Consistency",
        activeQuests: "AI Active Quests",
        weeklyMega: "WEEKLY MEGA QUEST",
        claimXp: "Claim",
        done: "Done",
        bosses: "Active Financial Bosses",
        bossLabel: "BOSS",
        attack: "ATTACK",
        xpProgress: "XP Progress",
        perksTitle: "Skill Mastery Perks",
        activePerks: "Active Perks",
        lockedPerks: "Locked Perks",
        unlockAt: "Unlocks at level",
        level: "LVL",
        streak: "Day Streak",
        health: "Health",
        multiplier: "Multiplier"
    },
    bangla: {
        achievements: "অর্জনসমূহ",
        viewAll: "সব দেখুন",
        noAchievements: "এখনো কোনো অর্জন নেই। এগিয়ে যান!",
        galleryTitle: "অর্জন গ্যালারি",
        close: "বন্ধ করুন",
        skillMastery: "আর্থিক দক্ষতা অর্জন",
        frugality: "মিতব্যয়িতা",
        wealth: "সম্পদ",
        consistency: "ধারাবাহিকতা",
        activeQuests: "AI সক্রিয় কোয়েস্ট",
        weeklyMega: "সাপ্তাহিক মেগা কোয়েস্ট",
        claimXp: "সংগ্রহ করুন",
        done: "সম্পন্ন",
        bosses: "সক্রিয় আর্থিক বস",
        bossLabel: "বস",
        attack: "আক্রমণ",
        xpProgress: "XP অগ্রগতি",
        perksTitle: "দক্ষতার সুবিধা",
        activePerks: "সক্রিয় সুবিধাসমূহ",
        lockedPerks: "লক করা সুবিধাসমূহ",
        unlockAt: "আনলক হবে লেভেল",
        level: "লেভেল",
        streak: "দিনের ধারাবাহিকতা",
        health: "স্বাস্থ্য",
        multiplier: "গুণিতক"
    }
  }[lang];

  // Skill Perks Definitions
  const perks = useMemo(() => [
    { id: 'f1', type: 'frugality', lvl: 5, title: 'Bargain Hunter', desc: '5% easier spend targets in quests', active: (avatarState.xp_frugality || 0) >= 500 },
    { id: 'f2', type: 'frugality', lvl: 15, title: 'Zero-Waste Master', desc: '10% easier spend targets in quests', active: (avatarState.xp_frugality || 0) >= 1500 },
    { id: 'w1', type: 'wealth', lvl: 5, title: 'Investor Mindset', desc: '+10% XP from all goal deposits', active: (avatarState.xp_wealth || 0) >= 500 },
    { id: 'w2', type: 'wealth', lvl: 15, title: 'Compound Interest', desc: '+20% XP from all goal deposits', active: (avatarState.xp_wealth || 0) >= 1500 },
    { id: 'c1', type: 'consistency', lvl: 5, title: 'Early Riser', desc: '5% bonus XP for morning tasks', active: (avatarState.xp_consistency || 0) >= 500 },
    { id: 'c2', type: 'consistency', lvl: 15, title: 'Unstoppable', desc: 'Reduced health loss when missing targets', active: (avatarState.xp_consistency || 0) >= 1500 },
  ], [avatarState]);

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
    // Debt Boss - Health increases with debt
    if (globalStats.totalDebt > 5000) {
        bosses.push({ 
            id: 'debt_boss',
            name: lang === 'bangla' ? 'ঋণের দানব' : 'Debt Titan', 
            health: Math.min(100, (globalStats.totalDebt / 500)), 
            icon: <FaSkull className="text-danger" />,
            description: lang === 'bangla' ? 'আপনার ঋণের বোঝা এই দানবকে শক্তিশালী করে।' : 'Your debt burden fuels this titan.',
            attackMethod: lang === 'bangla' ? 'লক্ষ্যে জমা করে একে দুর্বল করুন!' : 'Make a Goal Deposit to weaken it!'
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
                name: lang === 'bangla' ? `${b.label} পেটুক` : `${b.label} Glutton`,
                health: Math.min(100, overPercent),
                icon: <FaBolt className="text-warning" />,
                description: lang === 'bangla' ? `আপনি ${b.label}-এ অতিরিক্ত ব্যয় করেছেন!` : `You've overspent in ${b.label}!`,
                attackMethod: lang === 'bangla' ? 'ব্যয় কমিয়ে একে পরাজিত করুন!' : 'Stop spending here to defeat it!'
            });
        }
    });
    return bosses;
  }, [globalStats.totalDebt, budgets, meals, purchases, lang]);

  const handleAttack = async (bossId) => {
    setAttackTarget(bossId);
    setTimeout(() => setAttackTarget(null), 1000);
  };

  useEffect(() => {
    const fetchDialogue = async () => {
        setIsTyping(true);
        const promptSummary = {
            current_status: `Level ${statsSummary.level}, Health ${statsSummary.health}/100`,
            performance: `Spent ${statsSummary.spent} BDT, ${statsSummary.tasks} tasks done, ${statsSummary.habits} habits done today.`,
            bosses: activeBosses.map(b => b.name).join(', '),
            language: lang
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
  }, [statsSummary.health, statsSummary.level, activeBosses.length, lang]);

  const getMoodColor = () => {
    if (statsSummary.health > 80) return '#10b981'; // Green
    if (statsSummary.health > 50) return '#3b82f6'; // Blue
    if (statsSummary.health > 30) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const renderAvatarSVG = () => {
    const lvl = statsSummary.level;
    const color = getMoodColor();
    const streak = avatarState.streak || 1;
    const shadowLvl = avatarState.shadowLevel || 0;
    
    return (
        <svg width="80" height="80" viewBox="0 0 100 100">
            {/* Shadow Rival Silhouette */}
            {shadowLvl > 0 && (
                <motion.path 
                    d="M 50 5 L 90 40 L 50 95 L 10 40 Z" 
                    fill="#000" 
                    opacity={Math.min(0.5, shadowLvl * 0.15)}
                    initial={{ scale: 0.8, x: 5, y: 5 }}
                    animate={{ 
                        scale: [0.8, 0.85, 0.8],
                        x: [5, 8, 5]
                    }}
                    transition={{ repeat: Infinity, duration: 4 }}
                />
            )}

            {/* Streak Aura */}
            {streak >= 3 && (
                <motion.circle 
                    cx="50" cy="50" r="48" 
                    fill="none" stroke={color} strokeWidth="2" 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                        opacity: [0.2, 0.5, 0.2],
                        scale: [0.9, 1.1, 0.9]
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
            )}

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

            {/* Wings for high level */}
            {lvl >= 30 && (
                <g fill={color} opacity="0.4">
                    <path d="M 15 40 Q 0 20 15 10" />
                    <path d="M 85 40 Q 100 20 85 10" />
                </g>
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

            {/* Emergency Shield Layer */}
            {isShieldActive && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <path 
                        d="M 50 85 L 20 70 L 20 30 L 50 15 L 80 30 L 80 70 Z" 
                        fill="none" 
                        stroke="#fbbf24" 
                        strokeWidth="3"
                        strokeDasharray="5 2"
                    />
                    <motion.path 
                        d="M 50 85 L 20 70 L 20 30 L 50 15 L 80 30 L 80 70 Z" 
                        fill="rgba(251, 191, 36, 0.1)" 
                        animate={{ opacity: [0.1, 0.3, 0.1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                </motion.g>
            )}

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
                        scale: statsSummary.health < 40 ? [1, 0.98, 1] : 1,
                        x: attackTarget ? [0, 20, 0] : 0
                    }}
                    transition={{ duration: attackTarget ? 0.2 : 4, repeat: attackTarget ? 0 : Infinity, ease: "easeInOut" }}
                    className="avatar-container rounded-circle d-flex align-items-center justify-content-center shadow-lg mx-auto"
                    style={{ 
                        width: '140px', 
                        height: '140px', 
                        background: `radial-gradient(circle, ${getMoodColor()}22 0%, ${getMoodColor()}00 70%)`,
                        border: `2px solid ${getMoodColor()}44`,
                        cursor: 'pointer'
                    }}
                    onClick={() => setShowPerks(true)}
                >
                    {renderAvatarSVG()}
                </motion.div>
                <Badge bg="primary" className="position-absolute bottom-0 end-0 rounded-pill px-3 py-2 shadow border border-2 border-white">
                    {t.level} {statsSummary.level}
                </Badge>
                
                {isShieldActive && (
                    <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="position-absolute top-0 end-0 badge rounded-pill bg-info text-white px-2 py-1 shadow d-flex align-items-center gap-1 border border-2 border-white"
                        style={{ transform: 'translate(20%, -20%)' }}
                        title="Emergency Shield Active: -50% Damage taken"
                    >
                        <FaShieldAlt /> SHIELD
                    </motion.div>
                )}
                
                {avatarState.streak > 1 && (
                    <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="position-absolute top-0 start-0 badge rounded-pill bg-warning text-dark px-2 py-1 shadow d-flex align-items-center gap-1"
                    >
                        <FaFire /> {avatarState.streak} {t.streak}
                    </motion.div>
                )}
            </div>

            <div className="mt-2">
                <div className="d-flex align-items-center justify-content-center gap-2 small fw-bold mb-1" style={{ color: getMoodColor() }}>
                    <FaHeart /> {t.health} {statsSummary.health}%
                </div>
                <ProgressBar now={statsSummary.health} variant={statsSummary.health > 50 ? 'success' : statsSummary.health > 25 ? 'warning' : 'danger'} style={{ height: '6px' }} />
                <div className="x-small text-muted mt-2 fw-bold text-uppercase tracking-wider">
                    {t.multiplier}: {(avatarState.multiplier || 1).toFixed(2)}x
                </div>
                <Button variant="link" size="sm" className="p-0 x-small text-decoration-none mt-1" onClick={() => setShowPerks(true)}>
                    <FaStar className="text-warning me-1" /> View Active Perks
                </Button>
            </div>

            {/* Achievement Badges Mini Section */}
            <div className="mt-4 pt-3 border-top border-color">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="x-small fw-bold text-muted text-uppercase mb-0 tracking-wider">{t.achievements}</h6>
                    <Button variant="link" size="sm" className="p-0 x-small text-decoration-none" onClick={() => setShowAchievements(true)}>{t.viewAll}</Button>
                </div>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                    {achievements.filter(a => a.unlocked).length > 0 ? (
                        achievements.filter(a => a.unlocked).slice(0, 5).map(a => (
                            <motion.span 
                                key={a.id} 
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                title={a.title}
                                className="badge rounded-circle bg-light border p-2"
                                style={{ fontSize: '1.2rem', cursor: 'pointer' }}
                                onClick={() => setShowAchievements(true)}
                            >
                                {a.icon}
                            </motion.span>
                        ))
                    ) : (
                        <div className="x-small text-muted py-2">{t.noAchievements}</div>
                    )}
                </div>
            </div>

            {/* Achievements Modal */}
            <Modal show={showAchievements} onHide={() => setShowAchievements(false)} centered size="lg" className="achievement-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold d-flex align-items-center gap-2">
                        <FaTrophy className="text-warning" /> {t.galleryTitle}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-4">
                    <Row className="g-3">
                        {achievements.map(a => (
                            <Col xs={12} sm={6} key={a.id}>
                                <div className={`achievement-item p-3 rounded-4 border ${a.unlocked ? 'border-primary' : 'opacity-75 grayscale'}`} style={{ background: a.unlocked ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-color)' }}>
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="achievement-icon display-6">
                                            {a.unlocked ? a.icon : <FaLock className="text-muted" style={{ fontSize: '1.5rem' }} />}
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div className="fw-bold small">{a.title}</div>
                                                {a.unlocked && <Badge bg="success" className="x-small rounded-pill">+{a.rewardXP} XP</Badge>}
                                            </div>
                                            <div className="x-small text-muted">{a.description}</div>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="outline-secondary" onClick={() => setShowAchievements(false)} className="rounded-pill px-4">{t.close}</Button>
                </Modal.Footer>
            </Modal>

            {/* Skill Perks Modal */}
            <Modal show={showPerks} onHide={() => setShowPerks(false)} centered className="perks-modal">
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold d-flex align-items-center gap-2">
                        <FaStar className="text-warning" /> {t.perksTitle}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-4">
                        <h6 className="x-small fw-bold text-primary text-uppercase mb-3 tracking-wider">{t.activePerks}</h6>
                        <div className="d-flex flex-column gap-2">
                            {perks.filter(p => p.active).length > 0 ? perks.filter(p => p.active).map(p => (
                                <div key={p.id} className="p-3 rounded-4 bg-success bg-opacity-10 border border-success border-opacity-25 d-flex align-items-center gap-3">
                                    <div className="bg-success rounded-circle p-2 text-white"><FaStar size={12} /></div>
                                    <div>
                                        <div className="small fw-bold">{p.title}</div>
                                        <div className="x-small text-muted">{p.desc}</div>
                                    </div>
                                </div>
                            )) : <div className="text-center py-3 text-muted x-small">No perks active yet. Reach Level 5 in any skill!</div>}
                        </div>
                    </div>
                    <hr className="opacity-10" />
                    <div>
                        <h6 className="x-small fw-bold text-muted text-uppercase mb-3 tracking-wider">{t.lockedPerks}</h6>
                        <div className="d-flex flex-column gap-2">
                            {perks.filter(p => !p.active).map(p => (
                                <div key={p.id} className="p-3 rounded-4 bg-light border opacity-75 d-flex align-items-center gap-3">
                                    <div className="bg-secondary rounded-circle p-2 text-white"><FaLock size={12} /></div>
                                    <div className="flex-grow-1">
                                        <div className="small fw-bold text-muted">{p.title}</div>
                                        <div className="x-small text-muted">{p.desc}</div>
                                    </div>
                                    <Badge bg="secondary" className="x-small rounded-pill">{t.unlockAt} {p.lvl}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
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
                <FaChartLine /> {t.skillMastery}
            </h6>
            <Row className="g-3 mb-4">
                <Col xs={4}>
                    <div className="skill-card p-2 rounded-3 text-center" style={{ background: 'rgba(59, 130, 246, 0.05)', cursor: 'pointer' }} onClick={() => setShowPerks(true)}>
                        <FaSeedling className="text-primary mb-1" />
                        <div className="x-small fw-bold text-muted">{t.frugality}</div>
                        <div className="small fw-bold">{avatarState.xp_frugality || 0}</div>
                        <ProgressBar now={(avatarState.xp_frugality || 0) % 100} style={{ height: '3px' }} className="mt-1" />
                    </div>
                </Col>
                <Col xs={4}>
                    <div className="skill-card p-2 rounded-3 text-center" style={{ background: 'rgba(16, 185, 129, 0.05)', cursor: 'pointer' }} onClick={() => setShowPerks(true)}>
                        <FaGem className="text-success mb-1" />
                        <div className="x-small fw-bold text-muted">{t.wealth}</div>
                        <div className="small fw-bold">{avatarState.xp_wealth || 0}</div>
                        <ProgressBar now={(avatarState.xp_wealth || 0) % 100} style={{ height: '3px' }} className="mt-1" variant="success" />
                    </div>
                </Col>
                <Col xs={4}>
                    <div className="skill-card p-2 rounded-3 text-center" style={{ background: 'rgba(139, 92, 246, 0.05)', cursor: 'pointer' }} onClick={() => setShowPerks(true)}>
                        <FaShieldAlt className="text-purple mb-1" />
                        <div className="x-small fw-bold text-muted">{t.consistency}</div>
                        <div className="small fw-bold">{avatarState.xp_consistency || 0}</div>
                        <ProgressBar now={(avatarState.xp_consistency || 0) % 100} style={{ height: '3px' }} className="mt-1" variant="info" />
                    </div>
                </Col>
            </Row>

            {/* Quests Section */}
            <div className="quests-section mb-4">
                <h6 className="x-small fw-bold text-muted text-uppercase mb-3 tracking-wider d-flex align-items-center gap-2">
                    <FaBolt className="text-warning" /> {t.activeQuests}
                </h6>
                
                {/* Weekly Quest */}
                {weeklyQuest && (
                    <div className="p-3 rounded-4 border border-primary border-opacity-25 mb-3" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <Badge bg="primary" className="x-small px-2 py-1">{t.weeklyMega}</Badge>
                            {weeklyQuest.completed && !weeklyQuest.claimed && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={claimWeeklyReward}
                                    className="btn btn-primary btn-sm py-0 px-2 x-small fw-bold rounded-pill"
                                >
                                    {t.claimXp} {weeklyQuest.xp} XP
                                </motion.button>
                            )}
                            {weeklyQuest.claimed && <Badge bg="success" className="rounded-pill px-2 py-1 x-small">{t.done}</Badge>}
                        </div>
                        <div className="small fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>{weeklyQuest.title}</div>
                        <div className="x-small text-muted mb-2">{weeklyQuest.description}</div>
                        <ProgressBar now={weeklyQuest.progress * 100} style={{ height: '6px' }} className="rounded-pill shadow-sm" variant="primary" />
                    </div>
                )}

                {/* Daily Quests */}
                {loadingQuests ? (
                    <div className="text-center py-2">
                        <Spinner animation="border" size="sm" variant="primary" />
                    </div>
                ) : dailyQuests && (
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
                                            {t.claimXp} {task.xp} XP
                                        </motion.button>
                                    ) : task.rewardClaimed ? (
                                        <Badge bg="success" className="rounded-pill px-2 py-1 x-small">{t.done} +{task.xp}</Badge>
                                    ) : (
                                        <span className="x-small fw-bold text-primary">{Math.round(task.progress * 100)}%</span>
                                    )}
                                </div>
                                <ProgressBar now={task.progress * 100} style={{ height: '4px' }} variant={task.completed ? 'success' : 'primary'} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Active Bosses */}
            {activeBosses.length > 0 && (
                <div className="boss-section">
                    <h6 className="x-small fw-bold text-danger text-uppercase mb-3 tracking-wider d-flex align-items-center gap-2">
                        <FaSkull /> {t.bosses}
                    </h6>
                    <div className="d-flex flex-column gap-3">
                        {activeBosses.map(boss => (
                            <div key={boss.id} className="boss-card p-3 rounded-4 border border-danger border-opacity-25 position-relative overflow-hidden" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                                <AnimatePresence>
                                    {attackTarget === boss.id && (
                                        <motion.div 
                                            initial={{ opacity: 1, scale: 0 }}
                                            animate={{ opacity: 0, scale: 2 }}
                                            className="position-absolute top-50 start-50 translate-middle text-danger display-4"
                                            style={{ zIndex: 10, pointerEvents: 'none' }}
                                        >
                                            💥
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div className="d-flex align-items-center gap-2 fw-bold small">
                                        {boss.icon} {boss.name}
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleAttack(boss.id)}
                                            className="btn btn-outline-danger btn-sm py-0 px-2 x-small fw-bold rounded-pill"
                                        >
                                            {t.attack}
                                        </motion.button>
                                        <Badge bg="danger" className="x-small">{t.bossLabel}</Badge>
                                    </div>
                                </div>
                                <ProgressBar now={boss.health} variant="danger" style={{ height: '8px' }} className="mb-2 shadow-sm" />
                                <p className="x-small text-muted mb-0 fw-bold">{boss.attackMethod}</p>
                                <p className="x-small text-muted mb-0 mt-1">{boss.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Total XP Bar if no bosses */}
            {activeBosses.length === 0 && (
                <div className="mt-4">
                    <div className="d-flex justify-content-between x-small text-muted mb-1 px-1">
                        <span>{t.xpProgress}</span>
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
        .grayscale { filter: grayscale(1); }
        .achievement-modal .modal-content, .perks-modal .modal-content {
            background: var(--card-bg);
            color: var(--text-primary);
            border-radius: 24px;
            border: 1px solid var(--border-color);
        }
        .achievement-item, .skill-card {
            transition: transform 0.2s;
        }
        .achievement-item:hover, .skill-card:hover {
            transform: translateY(-2px);
        }
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