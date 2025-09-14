import { useCallback } from 'react';
import { lessons } from '../config/lessonStructure';
import { useThreeActStore } from '../stores/threeActStore';
import { contextCards, ContextCardSystem } from '../lib/contextCards';

export interface UseLessonManagerArgs {
  selectedLesson: string | null;
  setSelectedLesson: (lessonId: string | null) => void;
  currentProblemIndex: number;
  setCurrentProblemIndex: (index: number) => void;
  setProblemImage: (dataUrl: string) => void;
  onClearCanvas: () => void;
  client: any;
  connected: boolean;
}

export interface UseLessonManagerApi {
  selectLesson: (lessonId: string) => { title: string } | null;
  nextProblem: () => void;
  previousProblem: () => void;
  loadProblemImage: (imageFile: string) => Promise<void>;
}

export function useLessonManager({
  selectedLesson,
  setSelectedLesson,
  currentProblemIndex,
  setCurrentProblemIndex,
  setProblemImage,
  onClearCanvas,
  client,
  connected,
}: UseLessonManagerArgs): UseLessonManagerApi {
  const resetToAct1 = useCallback(() => {
    useThreeActStore.getState().setAct('act1');
  }, []);

  const loadProblemImage = useCallback(async (imageFile: string) => {
    const imagePath = imageFile === 'lego-blocks.svg'
      ? '/assets/lego-blocks.svg'
      : `/assets/problems/${imageFile}`;

    try {
      const res = await fetch(imagePath);
      const svgText = await res.text();

      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setProblemImage(jpegDataUrl);
          }
          URL.revokeObjectURL(url);
          resolve();
        };
        img.src = url;
      });
    } catch (err) {
      console.error('Failed to load problem image:', imagePath, err);
    }
  }, [setProblemImage]);

  const selectLesson = useCallback((lessonId: string) => {
    const lesson = lessons[lessonId];
    if (!lesson) {
      console.error('Lesson not found:', lessonId);
      return null;
    }

    setSelectedLesson(lessonId);
    setCurrentProblemIndex(0);

    const firstProblem = lesson.problems[0];
    if (firstProblem) {
      loadProblemImage(firstProblem.imageFile);
      // Update narrative/context cards
      contextCards.addCard(ContextCardSystem.getNarrativeCard(firstProblem.narrativeKey));
      contextCards.addCard(ContextCardSystem.getActCard('act1'));
    }

    resetToAct1();

    return { title: lesson.title };
  }, [setSelectedLesson, setCurrentProblemIndex, loadProblemImage, resetToAct1]);

  const nextProblem = useCallback(() => {
    if (!selectedLesson) return;
    const lesson = lessons[selectedLesson];
    if (!lesson) return;

    if (currentProblemIndex < lesson.problems.length - 1) {
      const nextIndex = currentProblemIndex + 1;
      const nextProblem = lesson.problems[nextIndex];

      onClearCanvas();
      loadProblemImage(nextProblem.imageFile);
      setCurrentProblemIndex(nextIndex);
      resetToAct1();

      // Update context cards
      contextCards.addCard(ContextCardSystem.getNarrativeCard(nextProblem.narrativeKey));
      contextCards.addCard(ContextCardSystem.getActCard('act1'));

      // Notify Pi about new problem
      if (client && connected) {
        client.send({
          text: `[NEW PROBLEM] Moving to problem ${nextIndex + 1}: "${nextProblem.title}". Share the new story!`
        });
      }
    }
  }, [selectedLesson, currentProblemIndex, onClearCanvas, loadProblemImage, setCurrentProblemIndex, resetToAct1, client, connected]);

  const previousProblem = useCallback(() => {
    if (!selectedLesson) return;
    const lesson = lessons[selectedLesson];
    if (!lesson) return;

    if (currentProblemIndex > 0) {
      const prevIndex = currentProblemIndex - 1;
      const prevProblem = lesson.problems[prevIndex];

      onClearCanvas();
      loadProblemImage(prevProblem.imageFile);
      setCurrentProblemIndex(prevIndex);
      resetToAct1();

      contextCards.addCard(ContextCardSystem.getNarrativeCard(prevProblem.narrativeKey));
      contextCards.addCard(ContextCardSystem.getActCard('act1'));
    }
  }, [selectedLesson, currentProblemIndex, onClearCanvas, loadProblemImage, setCurrentProblemIndex, resetToAct1]);

  return {
    selectLesson,
    nextProblem,
    previousProblem,
    loadProblemImage,
  };
}
