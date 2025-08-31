import React, { useState, useEffect } from 'react';
import SlideContainer from './SlideContainer';
import { loadLessonConfig } from '../config/lessons/index';
import { LessonConfig } from '../config/lessons/types';

/**
 * Test component for SlideDisplay system
 * This can be temporarily added to App.tsx for testing
 */
const SlideDisplayTest: React.FC = () => {
  const [lessonConfig, setLessonConfig] = useState<LessonConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testLoadLesson = async () => {
      try {
        console.log('🧪 Testing slide display system...');
        const result = await loadLessonConfig('intro-fractions');
        
        if (result.success && result.config) {
          setLessonConfig(result.config);
          console.log('✅ Lesson loaded successfully:', result.config.lessonId);
          console.log('📊 Slides:', result.config.slides.length);
        } else {
          setError(result.error || 'Failed to load lesson');
          console.error('❌ Failed to load lesson:', result.error);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('💥 Test failed:', err);
      } finally {
        setLoading(false);
      }
    };

    testLoadLesson();
  }, []);

  const handleSlideChange = (slide: any, slideNumber: number) => {
    console.log(`📚 Slide changed to: ${slideNumber} - ${slide?.name || 'Unknown'}`);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        color: '#666',
        fontSize: '1.1rem'
      }}>
        Loading lesson system...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        color: '#E53E3E',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>❌</div>
        <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>Slide System Test Failed</div>
        <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '10px',
        background: '#F0F8FF',
        borderBottom: '1px solid #E2E8F0',
        fontSize: '0.9rem',
        color: '#4A90E2'
      }}>
        🧪 <strong>Slide Display Test Mode</strong> - 
        Lesson: {lessonConfig?.lessonId} ({lessonConfig?.slides.length} slides)
      </div>
      
      <div style={{ flex: 1, padding: '20px' }}>
        <SlideContainer
          lessonConfig={lessonConfig}
          onSlideChange={handleSlideChange}
          initialSlideNumber={1}
        />
      </div>
      
      <div style={{
        padding: '10px',
        background: '#FFFBF0',
        borderTop: '1px solid #E2E8F0',
        fontSize: '0.8rem',
        color: '#B7791F'
      }}>
        💡 In development mode, you can manually navigate slides using the controls in bottom-right.
        In production, Pi will advance slides automatically when criteria are met.
      </div>
    </div>
  );
};

export default SlideDisplayTest;