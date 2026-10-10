import { WordProgress } from '../types';

export const LEITNER_INTERVALS = [0, 1, 3, 7, 14, 30]; // Days corresponding to boxes 1..5

export function createInitialWordProgress(wordId: string): WordProgress {
  const now = new Date();
  return {
    wordId,
    box: 1,
    repetitionCount: 0,
    easeFactor: 2.5,
    intervalDays: 1,
    lastReviewedAt: null,
    nextReviewAt: now.toISOString(),
    timesCorrect: 0,
    timesIncorrect: 0,
    consecutiveStreak: 0,
    masteryScore: 0,
  };
}

/**
 * SuperMemo SM-2 & Leitner Box combination rating:
 * Rating 1: Again (Forgotten)
 * Rating 2: Hard (Struggled)
 * Rating 3: Good (Recalled well)
 * Rating 4: Easy (Effortless)
 */
export function calculateNextReview(
  current: WordProgress,
  grade: 1 | 2 | 3 | 4
): WordProgress {
  const now = new Date();
  let { box, easeFactor, intervalDays, repetitionCount, consecutiveStreak, timesCorrect, timesIncorrect } = current;

  // Update ease factor (SM-2 formula approximation)
  // EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  const gradeScore = grade === 1 ? 1 : grade === 2 ? 3 : grade === 3 ? 4 : 5;
  easeFactor = easeFactor + (0.1 - (5 - gradeScore) * (0.08 + (5 - gradeScore) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;
  if (easeFactor > 3.0) easeFactor = 3.0;

  if (grade === 1) {
    // Again: reset consecutive streak and drop box
    box = Math.max(1, box - 1);
    intervalDays = 1;
    consecutiveStreak = 0;
    timesIncorrect += 1;
  } else if (grade === 2) {
    // Hard: maintain or slow advancement
    intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
    consecutiveStreak = Math.max(1, consecutiveStreak);
    timesCorrect += 1;
  } else if (grade === 3) {
    // Good: standard Leitner advancement
    box = Math.min(5, box + 1);
    repetitionCount += 1;
    consecutiveStreak += 1;
    timesCorrect += 1;
    if (repetitionCount === 1) {
      intervalDays = 1;
    } else if (repetitionCount === 2) {
      intervalDays = 3;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
  } else {
    // Easy: accelerated leap
    box = Math.min(5, box + (box < 4 ? 2 : 1));
    repetitionCount += 1;
    consecutiveStreak += 2;
    timesCorrect += 1;
    if (repetitionCount === 1) {
      intervalDays = 3;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor * 1.35);
    }
  }

  // Calculate next review timestamp
  const nextDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  // Compute mastery score (0-100)
  const accuracy = (timesCorrect / (timesCorrect + timesIncorrect || 1)) * 100;
  const boxWeight = (box / 5) * 60;
  const accuracyWeight = (accuracy / 100) * 40;
  const masteryScore = Math.min(100, Math.round(boxWeight + accuracyWeight));

  return {
    ...current,
    box,
    easeFactor: Number(easeFactor.toFixed(2)),
    intervalDays,
    repetitionCount,
    consecutiveStreak,
    timesCorrect,
    timesIncorrect,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: nextDate.toISOString(),
    masteryScore,
  };
}

export function isDueForReview(progress: WordProgress): boolean {
  if (!progress.lastReviewedAt) return true;
  return new Date(progress.nextReviewAt).getTime() <= Date.now();
}

export function formatTimeUntilDue(nextReviewAt: string): string {
  const diffMs = new Date(nextReviewAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Due now';
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Due in minutes';
  if (hours < 24) return `Due in ${hours}h`;
  const days = Math.round(hours / 24);
  return `Due in ${days}d`;
}
