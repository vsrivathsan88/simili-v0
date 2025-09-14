import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThreeActStore } from '../stores/threeActStore';
import './ActTransition.scss';

interface ActTransitionProps {
  onTransitionComplete?: () => void;
}

const ActTransition: React.FC<ActTransitionProps> = ({ onTransitionComplete }) => {
  const { currentAct, isTransitioning } = useThreeActStore();
  const [showTransition, setShowTransition] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState('');

  useEffect(() => {
    if (isTransitioning) {
      setShowTransition(true);
      
      // Set message based on the act we're transitioning to
      switch (currentAct) {
        case 'act1':
          setTransitionMessage('🌟 Notice & Wonder 🌟');
          break;
        case 'act2':
          setTransitionMessage('🛠️ Time to Explore! 🛠️');
          break;
        case 'act3':
          setTransitionMessage('🎉 Showcase Your Thinking! 🎉');
          break;
      }

      // Hide after animation
      setTimeout(() => {
        setShowTransition(false);
        if (onTransitionComplete) {
          onTransitionComplete();
        }
      }, 2000);
    }
  }, [isTransitioning, currentAct, onTransitionComplete]);

  // Also listen for custom events from Pi's tool calls
  useEffect(() => {
    const handleActChange = (event: CustomEvent) => {
      const { act } = event.detail;
      setShowTransition(true);
      
      switch (act) {
        case 'act1':
          setTransitionMessage('🌟 Notice & Wonder 🌟');
          break;
        case 'act2':
          setTransitionMessage('🛠️ Time to Explore! 🛠️');
          break;
        case 'act3':
          setTransitionMessage('🎉 Showcase Your Thinking! 🎉');
          break;
      }

      setTimeout(() => {
        setShowTransition(false);
      }, 2000);
    };

    window.addEventListener('lesson-act-changed', handleActChange as EventListener);
    return () => {
      window.removeEventListener('lesson-act-changed', handleActChange as EventListener);
    };
  }, []);

  return (
    <AnimatePresence>
      {showTransition && (
        <motion.div 
          className="act-transition-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="transition-content"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
          >
            <h2>{transitionMessage}</h2>
            
            {/* Fun visual elements */}
            <div className="sparkles">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="sparkle"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 0.5
                  }}
                >
                  ✨
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ActTransition;