// Debug Script for Slide Advancement Issues
// Run this in browser console to diagnose problems

console.log("🔍 Debugging Slide Advancement System");

// Check if lesson config is loaded
const lessonConfigCheck = () => {
  console.log("\n1. LESSON CONFIG CHECK:");
  const app = document.querySelector('.app-container');
  if (app) {
    console.log("✅ App container found");
  } else {
    console.log("❌ App container not found");
  }
  
  // Check if lesson config is available (this might be in React state)
  console.log("📚 Lesson config would be in React state - check console for lesson loading logs");
};

// Check if slide advancement events are being listened for
const eventListenerCheck = () => {
  console.log("\n2. EVENT LISTENER CHECK:");
  
  // Test if advance-slide event can be fired and received
  let eventReceived = false;
  
  const testHandler = (event) => {
    eventReceived = true;
    console.log("✅ advance-slide event listener is working");
    console.log("Event detail:", event.detail);
    window.removeEventListener('advance-slide', testHandler);
  };
  
  window.addEventListener('advance-slide', testHandler);
  
  // Fire test event
  window.dispatchEvent(new CustomEvent('advance-slide', {
    detail: {
      currentSlide: 1,
      nextSlide: 2,
      masteryEvidence: "Test evidence"
    }
  }));
  
  setTimeout(() => {
    if (!eventReceived) {
      console.log("❌ advance-slide event listener not working properly");
    }
  }, 100);
};

// Check if AI tools are available
const toolsCheck = () => {
  console.log("\n3. AI TOOLS CHECK:");
  
  // Check if tool implementations are available
  if (typeof window.toolImplementations !== 'undefined') {
    console.log("✅ Tool implementations available");
    if (window.toolImplementations.advance_slide) {
      console.log("✅ advance_slide tool implementation found");
    } else {
      console.log("❌ advance_slide tool implementation missing");
    }
  } else {
    console.log("❌ Tool implementations not available on window");
    console.log("Note: Tool implementations might be module-scoped");
  }
};

// Check if AI connection is active
const connectionCheck = () => {
  console.log("\n4. AI CONNECTION CHECK:");
  
  // Look for indicators of Gemini connection
  const indicators = [
    'Connected to Gemini Live',
    'Gemini Live setup complete'
  ];
  
  console.log("Check console logs for these messages:", indicators);
  console.log("If not found, AI connection might be inactive");
};

// Manual slide advancement test
const testSlideAdvancement = () => {
  console.log("\n5. MANUAL SLIDE ADVANCEMENT TEST:");
  
  // Try to manually fire the advance_slide tool
  console.log("Attempting to manually trigger slide advancement...");
  
  window.dispatchEvent(new CustomEvent('advance-slide', {
    detail: {
      id: 'test-advancement-' + Date.now(),
      currentSlide: 1,
      nextSlide: 2,
      masteryEvidence: "Manual test advancement",
      timestamp: Date.now(),
      validation: {
        confidence: 1,
        shouldAdvance: true,
        evidence: ["Manual test"],
        missingElements: []
      }
    }
  }));
  
  console.log("✅ Manual advancement event dispatched");
  console.log("Check if slide display updates");
};

// Check slide navigation functions
const navigationCheck = () => {
  console.log("\n6. NAVIGATION FUNCTIONS CHECK:");
  
  if (typeof window.goToSlide === 'function') {
    console.log("✅ goToSlide function available");
    console.log("Try: window.goToSlide(2) to test manual navigation");
  } else {
    console.log("❌ goToSlide function not available");
    console.log("Development navigation might not be set up");
  }
  
  if (typeof window.getCurrentSlide === 'function') {
    console.log("✅ getCurrentSlide function available");
    const currentState = window.getCurrentSlide();
    console.log("Current slide state:", currentState);
  } else {
    console.log("❌ getCurrentSlide function not available");
  }
};

// System instruction check
const systemInstructionCheck = () => {
  console.log("\n7. SYSTEM INSTRUCTION CHECK:");
  console.log("Look for these console messages:");
  console.log("- '🎯 Enhanced system instruction with lesson context for: intro-fractions slide: X'");
  console.log("- If not found, AI may not be receiving lesson-aware instructions");
  console.log("- Check that lesson config loads successfully");
};

// Run all checks
const runAllChecks = () => {
  lessonConfigCheck();
  eventListenerCheck();
  toolsCheck();
  connectionCheck();
  navigationCheck();
  systemInstructionCheck();
  
  console.log("\n🔧 DIAGNOSTIC ACTIONS:");
  console.log("1. testSlideAdvancement() - Test manual slide advancement");
  console.log("2. window.goToSlide(2) - Manual navigation (if available)");
  console.log("3. window.getCurrentSlide() - Check current state (if available)");
};

// Make functions available globally
window.debugSlides = {
  runAllChecks,
  testSlideAdvancement,
  lessonConfigCheck,
  eventListenerCheck,
  toolsCheck,
  connectionCheck,
  navigationCheck,
  systemInstructionCheck
};

console.log("🔧 Debug tools loaded. Run window.debugSlides.runAllChecks() to start");

// Auto-run on load
runAllChecks();