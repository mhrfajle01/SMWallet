import React from 'react';
import { motion } from 'framer-motion';

const PageLoader = () => {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100%', minHeight: '300px' }}>
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
          borderRadius: ["20%", "20%", "50%", "50%", "20%"]
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          times: [0, 0.2, 0.5, 0.8, 1],
          repeat: Infinity,
          repeatDelay: 1
        }}
        style={{
          width: 50,
          height: 50,
          background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
        }}
      />
    </div>
  );
};

export default PageLoader;
