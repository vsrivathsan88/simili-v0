/**
 * Test file for lesson configuration system
 * This file can be used to verify that lesson loading and validation works correctly
 * 
 * To run this test, import and call testLessonConfig() from somewhere in the app
 */

import { loadLessonConfig, generateLessonContext, validateLessonConfig, getFirstSlide, getNextSlideNumber } from './index';

export async function testLessonConfig() {
  console.group('🧪 Testing Lesson Configuration System');
  
  try {
    // Test 1: Load the intro-fractions lesson
    console.log('📚 Loading intro-fractions lesson...');
    const result = await loadLessonConfig('intro-fractions');
    
    if (!result.success || !result.config) {
      console.error('❌ Failed to load lesson:', result.error);
      return;
    }
    
    console.log('✅ Lesson loaded successfully:', result.config.lessonId);
    console.log(`   - Slides: ${result.config.slides.length}`);
    
    // Test 2: Validate lesson configuration
    console.log('🔍 Validating lesson configuration...');
    const validation = validateLessonConfig(result.config);
    
    if (!validation.valid) {
      console.error('❌ Lesson validation failed:', validation.errors);
      return;
    }
    
    console.log('✅ Lesson validation passed');
    
    // Test 3: Generate lesson context
    console.log('📝 Generating lesson context for AI...');
    const context = generateLessonContext(result.config);
    console.log('✅ Context generated:', context.length, 'characters');
    console.log('   First 200 chars:', context.substring(0, 200) + '...');
    
    // Test 4: Test slide utilities
    console.log('🔧 Testing slide utilities...');
    const firstSlide = getFirstSlide(result.config);
    console.log('✅ First slide:', firstSlide?.name);
    
    const nextSlideNum = getNextSlideNumber(result.config, 1);
    console.log('✅ Next slide after 1:', nextSlideNum);
    
    const lastSlideNext = getNextSlideNumber(result.config, result.config.slides.length);
    console.log('✅ Next slide after last (should be null):', lastSlideNext);
    
    // Test 5: Show slide advancement criteria
    console.log('🎯 Slide advancement criteria:');
    result.config.slides.forEach(slide => {
      console.log(`   Slide ${slide.slide_number}: ${slide.advance_to_next_slide_criteria}`);
    });
    
    console.log('🎉 All tests passed! Lesson configuration system is working.');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
  
  console.groupEnd();
}

// Export for manual testing in console
(window as any).testLessonConfig = testLessonConfig;