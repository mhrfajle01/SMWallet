import React from 'react';
import { Card, ProgressBar, Row, Col, Badge } from 'react-bootstrap';
import { useProductivity } from '../../context/ProductivityContext';
import { motion } from 'framer-motion';
import { FaTrophy, FaStar, FaMedal } from 'react-icons/fa';

const GamifyDashboard = () => {
  const { gamifyData } = useProductivity();
  const { points, level, badges } = gamifyData;

  // Calculate progress to next level
  const currentLevelBase = (level - 1) * 500;
  const nextLevelBase = level * 500;
  const progress = ((points - currentLevelBase) / (nextLevelBase - currentLevelBase)) * 100;

  return (
    <Card className="border-0 shadow-sm mb-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white' }}>
      <Card.Body className="p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h5 className="mb-0 fw-bold opacity-75 text-uppercase letter-spacing-2">My Level</h5>
            <h1 className="display-4 fw-bold mb-0">Level {level}</h1>
          </div>
          <div className="text-end">
            <div className="bg-white bg-opacity-25 rounded-circle p-3 d-inline-flex mb-2">
              <FaTrophy size={32} className="text-warning" />
            </div>
            <div className="fw-bold">{points} XP</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between small mb-1 opacity-75">
             <span>Level {level}</span>
             <span>Level {level + 1}</span>
          </div>
          <ProgressBar 
            now={progress} 
            className="rounded-pill bg-black bg-opacity-25" 
            variant="warning" 
            style={{ height: '10px' }} 
            animated
          />
          <div className="text-center small mt-2 opacity-75">
            {Math.max(0, nextLevelBase - points)} XP to next level
          </div>
        </div>

        <div>
          <h6 className="fw-bold opacity-75 mb-3 d-flex align-items-center gap-2">
            <FaMedal /> Badges Collection
          </h6>
          <div className="d-flex gap-2 flex-wrap">
            {badges && badges.length > 0 ? (
              badges.map((badge, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-white text-dark px-3 py-1 rounded-pill small fw-bold d-flex align-items-center gap-1 shadow-sm"
                >
                  <FaStar className="text-warning" /> {badge}
                </motion.div>
              ))
            ) : (
              <span className="opacity-50 small fst-italic">No badges yet. Keep going!</span>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default GamifyDashboard;
