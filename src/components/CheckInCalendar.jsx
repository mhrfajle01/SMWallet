import React, { useMemo, useState } from 'react';
import { Card, Badge, Modal, Button, Row, Col } from 'react-bootstrap';
import { FaFire, FaRegCircle, FaCheckCircle, FaCalendarAlt, FaClock, FaExchangeAlt, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { getLocalISO } from '../utils/dateUtils';

const CheckInCalendar = ({ history = [], streak = 0, sessionSeconds = 0, hasTransactionToday = false }) => {
  const [showMonthly, setShowMonthly] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const todayStr = getLocalISO();
  const isCheckedToday = history.includes(todayStr);

  const weekDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = getLocalISO(d);
      days.push({
        date: dateStr,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        isToday: dateStr === todayStr
      });
    }
    return days;
  }, [todayStr]);

  const progress = Math.min(100, (sessionSeconds / 120) * 100);

  // Calendar Logic for Modal
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const dateStr = getLocalISO(d);
        days.push({
            day: i,
            dateStr: dateStr,
            isToday: dateStr === todayStr,
            isChecked: history.includes(dateStr)
        });
    }
    return days;
  }, [viewDate, history, todayStr]);

  const changeMonth = (offset) => {
    const next = new Date(viewDate);
    next.setMonth(viewDate.getMonth() + offset);
    setViewDate(next);
  };

  return (
    <>
      <Card className="border-0 shadow-sm mb-4 overflow-hidden" style={{ borderRadius: '1.5rem', background: 'var(--card-bg)' }}>
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <FaFire className={streak > 0 ? "text-warning" : "text-muted"} /> Daily Consistency
            </h6>
            <div className="d-flex align-items-center gap-2">
                <Button variant="link" size="sm" className="p-0 text-primary" onClick={() => setShowMonthly(true)}>
                    <FaCalendarAlt />
                </Button>
                <Badge bg={streak > 0 ? "warning" : "secondary"} text={streak > 0 ? "dark" : "white"} className="rounded-pill px-3 py-2 fw-bold shadow-sm">
                    {streak} DAY STREAK
                </Badge>
            </div>
          </div>

          <div className="d-flex justify-content-between gap-2 mb-4">
            {weekDays.map((day, idx) => {
              const isChecked = history.includes(day.date);
              return (
                <div key={idx} className="text-center flex-grow-1">
                  <div className={`x-small fw-bold mb-2 ${day.isToday ? 'text-primary' : 'text-muted'}`}>{day.label}</div>
                  <div className="position-relative d-inline-block">
                    {day.isToday && !isChecked && (
                      <svg className="position-absolute top-50 start-50 translate-middle" width="44" height="44" style={{ transform: 'translate(-50%, -50%) rotate(-90deg)' }}>
                        <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border-color)" strokeWidth="3" opacity="0.3" />
                        <motion.circle 
                          cx="22" cy="22" r="18" fill="none" stroke="var(--primary-color)" strokeWidth="3"
                          strokeDasharray="113" strokeDashoffset={113 - (113 * progress) / 100}
                          transition={{ type: 'spring', stiffness: 50 }}
                        />
                      </svg>
                    )}
                    <div 
                      className={`rounded-circle d-flex align-items-center justify-content-center shadow-sm ${isChecked ? 'bg-warning text-white' : 'bg-light bg-opacity-50 text-muted'}`}
                      style={{ width: '36px', height: '36px', zIndex: 1, position: 'relative', border: isChecked ? 'none' : '1px dashed var(--border-color)' }}
                    >
                      {isChecked ? <FaFire size={18} /> : (day.isToday ? <div className="bg-primary rounded-circle" style={{width: '8px', height: '8px'}} /> : <FaRegCircle size={14} />)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!isCheckedToday ? (
            <div className="session-progress p-3 rounded-4 bg-primary bg-opacity-10 border border-primary border-opacity-10">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="fw-bold text-primary">Daily Check-in Tasks</small>
                <small className="fw-bold text-primary">{Math.floor(sessionSeconds / 60)}m / 2m</small>
              </div>
              
              <div className="d-flex flex-column gap-2 mb-3">
                <div className="d-flex align-items-center gap-2 x-small">
                    {sessionSeconds >= 120 ? <FaCheckCircle className="text-success"/> : <FaClock className="text-muted"/>}
                    <span className={sessionSeconds >= 120 ? "text-success fw-bold" : "text-muted"}>Spend 2 minutes in app</span>
                </div>
                <div className="d-flex align-items-center gap-2 x-small">
                    {hasTransactionToday ? <FaCheckCircle className="text-success"/> : <FaExchangeAlt className="text-muted"/>}
                    <span className={hasTransactionToday ? "text-success fw-bold" : "text-muted"}>Complete 1 transaction today</span>
                </div>
              </div>

              <div className="progress mb-2" style={{ height: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.05)' }}>
                <motion.div 
                  className="progress-bar bg-primary" 
                  initial={{ width: 0 }} 
                  animate={{ width: `${(Math.min(1, (sessionSeconds/120)) * 50) + (hasTransactionToday ? 50 : 0)}%` }} 
                  style={{ borderRadius: '4px' }}
                />
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-4 bg-success bg-opacity-10 border border-success border-opacity-10 d-flex align-items-center gap-3">
              <div className="bg-success text-white rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm">
                  <FaCheckCircle size={20} />
              </div>
              <div>
                  <h6 className="small fw-bold mb-0 text-success">Streak Secured!</h6>
                  <p className="x-small text-muted mb-0">Consistency is the key to wealth.</p>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Monthly View Modal */}
      <Modal show={showMonthly} onHide={() => setShowMonthly(false)} centered className="calendar-modal">
        <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold h5">Activity Calendar</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <Button variant="light" size="sm" className="rounded-circle" onClick={() => changeMonth(-1)}><FaArrowLeft /></Button>
                <h6 className="fw-bold mb-0">{viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h6>
                <Button variant="light" size="sm" className="rounded-circle" onClick={() => changeMonth(1)}><FaArrowRight /></Button>
            </div>

            <div className="calendar-grid">
                <div className="d-grid gap-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="text-center x-small fw-bold text-muted pb-2">{d}</div>)}
                    {calendarDays.map((d, i) => (
                        <div key={i} className="text-center py-2 position-relative">
                            {d && (
                                <>
                                    <div 
                                        className={`mx-auto rounded-circle d-flex align-items-center justify-content-center x-small fw-bold ${d.isChecked ? 'bg-warning text-white shadow-sm' : d.isToday ? 'border border-primary text-primary' : 'text-muted'}`}
                                        style={{ width: '30px', height: '30px', transition: 'all 0.3s ease' }}
                                    >
                                        {d.isChecked ? <FaFire size={12} /> : d.day}
                                    </div>
                                    {d.isToday && !d.isChecked && <div className="position-absolute bottom-0 start-50 translate-middle-x bg-primary rounded-circle" style={{ width: '4px', height: '4px' }} />}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 pt-3 border-top d-flex justify-content-around">
                <div className="text-center">
                    <div className="h4 fw-bold mb-0">{history.length}</div>
                    <div className="x-small text-muted">Total Days</div>
                </div>
                <div className="text-center">
                    <div className="h4 fw-bold mb-0 text-warning">{streak}</div>
                    <div className="x-small text-muted">Current Streak</div>
                </div>
            </div>
        </Modal.Body>
      </Modal>

      <style>{`
        .calendar-modal .modal-content { border-radius: 2rem; border: none; background: var(--card-bg); color: var(--text-primary); }
      `}</style>
    </>
  );
};

export default CheckInCalendar;