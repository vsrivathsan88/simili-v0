import React, { useState, useEffect } from 'react';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import './OnboardingFlow.scss';

interface OnboardingFlowProps {
  onComplete: () => void;
  onNameCapture: (name: string) => void;
  childName: string;
}

type OnboardingStep = 'welcome' | 'voice-connect' | 'voice-test' | 'name-capture' | 'ready';

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onNameCapture, childName }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [nameInput, setNameInput] = useState('');
  const { client, connected, connect } = useLiveAPIContext();

  const handleConnectVoice = async () => {
    try {
      await connect();
      setCurrentStep('voice-test');
    } catch (error) {
      console.error('Failed to connect to Pi:', error);
    }
  };

  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      const name = nameInput.trim();
      onNameCapture(name);
      setNameInput('');
      // Tell Pi the child's name
      if (connected) {
        client.send({ text: `The child's name is ${name}. Please acknowledge their name excitedly and say how great it is to meet them!` });
      }
    }
  };

  // Handle Pi's introduction and voice test
  useEffect(() => {
    if (connected && currentStep === 'voice-test') {
      // Give Pi a moment to connect, then start introduction
      setTimeout(() => {
        client.send({ text: "This is onboarding. Please introduce yourself warmly and ask the student to say something back so you can test if you can hear each other." });
      }, 1000);
    }
  }, [connected, currentStep, client]);

  // Handle Pi asking for the child's name
  useEffect(() => {
    if (connected && currentStep === 'name-capture') {
      setTimeout(() => {
        client.send({ text: "Now ask the student their name enthusiastically! Say something like 'What's your name, my new adventure buddy?' and when they tell you, repeat it back excitedly and then say something like 'That's such a cool name!'" });
      }, 1000);
    }
  }, [connected, currentStep, client]);

  // Listen for when voice test is successful
  useEffect(() => {
    if (connected && currentStep === 'ready') {
      // Give Pi time to acknowledge they heard the kid, then move to adventures
      setTimeout(() => {
        onComplete();
      }, 3000);
    }
  }, [connected, currentStep, onComplete]);

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">

        {/* Step 1: Simple Pi Introduction */}
        {currentStep === 'welcome' && (
          <div className="onboarding-step welcome-step">
            <div className="pi-avatar-intro">
              <img
                src="/assets/pi-headphones.png"
                alt="Pi ready to chat"
                className="pi-image-large floating"
              />
              <div className="sparkle-effects">✨</div>
            </div>

            <div className="welcome-content">
              <h1 className="welcome-title">
                Hi! I'm Pi! 👋
              </h1>

              <button
                className="continue-btn"
                onClick={() => setCurrentStep('voice-connect')}
              >
                <span className="btn-text">Hi Pi!</span>
                <span className="btn-icon">🎉</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Connect Voice */}
        {currentStep === 'voice-connect' && (
          <div className="onboarding-step voice-step">
            <div className="pi-avatar-intro">
              <img
                src="/assets/pi-headphones.png"
                alt="Pi ready to talk"
                className="pi-image-large talking"
              />
            </div>

            <div className="voice-content">
              <h2 className="step-title">
                Let's talk! 🎤
              </h2>

              <button
                className="voice-test-btn"
                onClick={handleConnectVoice}
              >
                <span className="btn-text">Start Talking</span>
                <span className="btn-icon">🎤</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Voice Test - Pi introduces himself and listens */}
        {currentStep === 'voice-test' && (
          <div className="onboarding-step voice-step">
            <div className="pi-avatar-intro">
              <img
                src="/assets/pi-headphones.png"
                alt="Pi listening and talking"
                className="pi-image-large talking"
              />
            </div>

            <div className="voice-content">
              <h2 className="step-title">
                🎤 Pi wants to hear from you!
              </h2>

              <div className="listening-indicator">
                <div className="voice-waves">
                  <div className="wave"></div>
                  <div className="wave"></div>
                  <div className="wave"></div>
                </div>
                <p>Listen to Pi, then say something back!</p>
              </div>

              <button
                className="voice-test-btn"
                onClick={() => setCurrentStep('name-capture')}
                style={{ marginTop: '20px' }}
              >
                <span className="btn-text">I can hear Pi!</span>
                <span className="btn-icon">✅</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Name Capture - Pi asks for the kid's name */}
        {currentStep === 'name-capture' && (
          <div className="onboarding-step voice-step">
            <div className="pi-avatar-intro">
              <img
                src="/assets/pi-headphones.png"
                alt="Pi excited to learn your name"
                className="pi-image-large talking"
              />
            </div>

            <div className="voice-content">
              <h2 className="step-title">
                🎤 What's your name, adventure buddy?
              </h2>

              <div className="listening-indicator">
                <div className="voice-waves">
                  <div className="wave"></div>
                  <div className="wave"></div>
                  <div className="wave"></div>
                </div>
                <p>Tell Pi your name, or type it below!</p>
              </div>

              {!childName && (
                <div className="name-input-section">
                  <input
                    type="text"
                    placeholder="Type your name here..."
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                    className="name-input"
                  />
                  <button
                    className="voice-test-btn"
                    onClick={handleNameSubmit}
                    disabled={!nameInput.trim()}
                    style={{ marginTop: '16px' }}
                  >
                    <span className="btn-text">That's my name!</span>
                    <span className="btn-icon">✨</span>
                  </button>
                </div>
              )}

              {childName && (
                <div className="name-confirmed">
                  <p className="success-text">Hi {childName}! 🎉</p>
                  <button
                    className="voice-test-btn"
                    onClick={() => setCurrentStep('ready')}
                    style={{ marginTop: '20px' }}
                  >
                    <span className="btn-text">That's me!</span>
                    <span className="btn-icon">✨</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Ready - Pi confirms he heard the kid */}
        {currentStep === 'ready' && (
          <div className="onboarding-step preview-step">
            <div className="pi-avatar-intro">
              <img
                src="/assets/pi-headphones.png"
                alt="Pi excited"
                className="pi-image-large excited"
              />
            </div>

            <div className="preview-content">
              <h2 className="step-title">
                🎉 Perfect{childName ? `, ${childName}` : ''}! Let's start our adventures!
              </h2>

              <div className="listening-indicator">
                <div className="voice-waves">
                  <div className="wave"></div>
                  <div className="wave"></div>
                  <div className="wave"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;