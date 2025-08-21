import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './VoicePermissionModal.scss';
import { SketchyButton } from './ui/SketchyButton';

interface VoicePermissionModalProps {
  isOpen: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

const VoicePermissionModal: React.FC<VoicePermissionModalProps> = ({
  isOpen,
  onAllow,
  onDeny
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="voice-permission-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="voice-permission-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className="modal-content">
              <div className="modal-icon">🎤</div>
              <h2>Let's talk! 💬</h2>
              <p>Pi needs to hear you to help with math problems.</p>
              <p className="privacy-note">
                🔒 Your voice stays private and safe
              </p>
              
              <div className="button-group">
                <SketchyButton 
                  onClick={onAllow}
                  size="large"
                  variant="primary"
                >
                  Yes, let's talk!
                </SketchyButton>
                
                <button 
                  className="text-button"
                  onClick={onDeny}
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VoicePermissionModal;