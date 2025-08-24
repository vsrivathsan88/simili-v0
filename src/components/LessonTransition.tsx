import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LessonTransition.scss';

interface LessonTransitionProps {
  isActive: boolean;
  lessonTitle: string;
  onComplete: () => void;
}

const LessonTransition: React.FC<LessonTransitionProps> = ({
  isActive,
  lessonTitle,
  onComplete
}) => {
  const [stage, setStage] = useState<'growing' | 'speaking' | 'transitioning' | 'complete'>('growing');

  useEffect(() => {
    if (!isActive) return;
    
    console.log('LessonTransition started for:', lessonTitle);

    const timer1 = setTimeout(() => {
      console.log('Transition stage: speaking');
      setStage('speaking');
    }, 800);
    const timer2 = setTimeout(() => {
      console.log('Transition stage: transitioning');
      setStage('transitioning');
    }, 2800);
    const timer3 = setTimeout(() => {
      console.log('Transition stage: complete, calling onComplete');
      setStage('complete');
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="lesson-transition-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="transition-content">
          {/* Pi Character Animation */}
          <motion.div
            className="pi-character-transition"
            initial={{ scale: 1, y: 0 }}
            animate={stage === 'growing' ? 
              { scale: 1.5, y: -50 } : 
              stage === 'speaking' ?
              { scale: 1.5, y: -50 } :
              { scale: 0.8, y: 100, x: -200 }
            }
            transition={{ 
              duration: stage === 'growing' ? 0.8 : 
                       stage === 'speaking' ? 0.2 :
                       1.0,
              ease: "easeInOut" 
            }}
          >
            <img 
              src="/assets/pi-character.png" 
              alt="Pi transitioning to lesson" 
              className="pi-transition-img"
            />
            <div className="pi-sparkles-transition">✨</div>
          </motion.div>

          {/* Speech Bubble */}
          <AnimatePresence>
            {stage === 'speaking' && (
              <motion.div
                className="pi-speech-transition"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <p>Great choice! Let's explore {lessonTitle.toLowerCase()}! 🚀</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Background Elements */}
          <motion.div
            className="transition-sparkles"
            animate={{
              rotate: 360,
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="sparkle"
                style={{
                  transform: `rotate(${i * 45}deg) translateY(-80px)`,
                  animationDelay: `${i * 0.2}s`
                }}
              >
                ⭐
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LessonTransition;