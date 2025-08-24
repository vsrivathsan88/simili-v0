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
              <div className="pi-character-large">
                <img src="/assets/pi-character.png" alt="Pi asking for permission" className="pi-img" />
                <div className="pi-sparkles">✨</div>
              </div>
              
              <div className="pi-speech-bubble-large">
                <p>🎤 Can I hear you?</p>
              </div>
              
              <div className="button-group">
                <SketchyButton 
                  onClick={onAllow}
                  size="large"
                  variant="primary"
                >
                  <span className="btn-emoji">🚀</span>
                  Yes!
                  <span className="btn-sparkle">✨</span>
                </SketchyButton>
                
                <button 
                  className="not-now-button"
                  onClick={onDeny}
                >
                  Not now
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