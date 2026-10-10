import { UserStats, WordProgress, Badge, LeaderboardUser } from '../types';
import { VOCABULARY_WORDS } from '../data/vocabulary';
import { createInitialWordProgress } from './srs';

const STATS_KEY = 'lexiquest_stats_v1';
const PROGRESS_KEY = 'lexiquest_progress_v1';
const LEADERBOARD_KEY = 'lexiquest_leaderboard_v1';

export const BADGES: Badge[] = [
  {
    id: 'first_spark',
    title: 'First Spark',
    description: 'Began your vocabulary journey today!',
    icon: '🔥',
    category: 'streak',
    tier: 'bronze',
    target: 1,
    progress: (stats) => Math.min(1, stats.currentStreak)
  },
  {
    id: 'streak_flame_3',
    title: 'Flame Keeper',
    description: 'Maintained a 3-day learning streak!',
    icon: '⚡',
    category: 'streak',
    tier: 'silver',
    target: 3,
    progress: (stats) => Math.min(3, stats.currentStreak)
  },
  {
    id: 'streak_champion_7',
    title: 'Solar Streak',
    description: 'Achieved an epic 7-day learning streak!',
    icon: '🌟',
    category: 'streak',
    tier: 'gold',
    target: 7,
    progress: (stats) => Math.min(7, stats.currentStreak)
  },
  {
    id: 'quiz_sharp_shooter',
    title: 'Bullseye Scholar',
    description: 'Score 100% on a full 10-question vocabulary quiz!',
    icon: '🎯',
    category: 'quiz',
    tier: 'silver',
    target: 1,
    progress: (stats) => stats.unlockedBadgeIds.includes('quiz_sharp_shooter') ? 1 : 0
  },
  {
    id: 'srs_box_explorer',
    title: 'Spaced Repetition Pro',
    description: 'Advance 5 different words to Leitner Box 3 or higher!',
    icon: '🧠',
    category: 'mastery',
    tier: 'silver',
    target: 5,
    progress: (_, wordProgress) => {
      return Object.values(wordProgress).filter(p => p.box >= 3).length;
    }
  },
  {
    id: 'lexicon_conqueror',
    title: 'Lexicon Master',
    description: 'Master all 20 target vocabulary words!',
    icon: '👑',
    category: 'mastery',
    tier: 'diamond',
    target: 20,
    progress: (_, wordProgress) => {
      return Object.values(wordProgress).filter(p => p.box >= 4 || p.masteryScore >= 80).length;
    }
  },
  {
    id: 'duel_warrior',
    title: 'Arena Contender',
    description: 'Challenge a rival or friend in Word Battle!',
    icon: '⚔️',
    category: 'battle',
    tier: 'bronze',
    target: 1,
    progress: (stats) => Math.min(1, stats.battlesWon)
  },
  {
    id: 'duel_champion',
    title: 'Word Duel Grandmaster',
    description: 'Win 3 Word Battles against rivals!',
    icon: '🏆',
    category: 'battle',
    tier: 'gold',
    target: 3,
    progress: (stats) => Math.min(3, stats.battlesWon)
  },
  {
    id: 'wordsmith_scramble',
    title: 'Letter Sleuth',
    description: 'Unscramble 5 difficult words with high accuracy!',
    icon: '🧩',
    category: 'quiz',
    tier: 'bronze',
    target: 5,
    progress: (stats) => stats.unlockedBadgeIds.includes('wordsmith_scramble') ? 5 : 0
  },
  {
    id: 'context_weaver',
    title: 'Context Weaver',
    description: 'Complete 5 in-sentence story fill challenges!',
    icon: '📖',
    category: 'quiz',
    tier: 'silver',
    target: 5,
    progress: (stats) => stats.unlockedBadgeIds.includes('context_weaver') ? 5 : 0
  }
];

export const INITIAL_LEADERBOARD: LeaderboardUser[] = [
  { id: '1', name: 'Aria Nightingale', avatar: '🦊', xp: 2450, streak: 14, wordsMastered: 19, badge: 'Diamond Master' },
  { id: '2', name: 'Marcus Sterling', avatar: '🦉', xp: 2180, streak: 9, wordsMastered: 17, badge: 'Gold Scholar' },
  { id: '3', name: 'Elena Rostova', avatar: '🐯', xp: 1890, streak: 8, wordsMastered: 15, badge: 'Silver Ace' },
  { id: '4', name: 'Kai Takahashi', avatar: '🐼', xp: 1420, streak: 5, wordsMastered: 12, badge: 'Silver Ace' },
  { id: '5', name: 'You (Champion)', avatar: '🚀', xp: 350, streak: 1, wordsMastered: 3, badge: 'Rising Star', isCurrentUser: true },
  { id: '6', name: 'Zoe Chen', avatar: '🐨', xp: 310, streak: 2, wordsMastered: 3, badge: 'Cadet' },
  { id: '7', name: 'Oliver Twist', avatar: '🦁', xp: 240, streak: 1, wordsMastered: 2, badge: 'Cadet' },
  { id: '8', name: 'Maya Lin', avatar: '🦄', xp: 190, streak: 1, wordsMastered: 1, badge: 'New Explorer' },
];

export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadUserStats(): UserStats {
  try {
    const data = localStorage.getItem(STATS_KEY);
    const today = getTodayDateString();
    if (data) {
      const parsed: UserStats = JSON.parse(data);
      // Streak continuity check
      if (parsed.lastActiveDate !== today) {
        const lastDate = new Date(parsed.lastActiveDate);
        const currDate = new Date(today);
        const diffTime = Math.abs(currDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 2) {
          if (parsed.streakFreezeAvailable > 0) {
            // Used streak freeze
            parsed.streakFreezeAvailable -= 1;
          } else {
            parsed.currentStreak = 1;
          }
        }
        parsed.todayReviewedCount = 0;
      }
      return parsed;
    }
  } catch {
    // Fallback on error
  }

  return {
    xp: 150,
    level: 1,
    currentStreak: 1,
    bestStreak: 1,
    lastActiveDate: getTodayDateString(),
    todayReviewedCount: 0,
    totalQuizzesTaken: 0,
    totalWordsLearned: 0,
    battlesWon: 0,
    streakFreezeAvailable: 1,
    soundEnabled: true,
    unlockedBadgeIds: ['first_spark'],
  };
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Storage quota or private browsing
  }
}

export function loadWordProgress(): Record<string, WordProgress> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Fallback
  }

  // Pre-initialize for all 20 words
  const initialMap: Record<string, WordProgress> = {};
  VOCABULARY_WORDS.forEach((w, index) => {
    const prog = createInitialWordProgress(w.id);
    // Give first 2 words a slight initial seed so learner sees how the Leitner distribution works
    if (index === 0) {
      prog.box = 2;
      prog.repetitionCount = 2;
      prog.masteryScore = 45;
      prog.timesCorrect = 2;
    } else if (index === 5) {
      prog.box = 3;
      prog.repetitionCount = 3;
      prog.masteryScore = 70;
      prog.timesCorrect = 3;
    }
    initialMap[w.id] = prog;
  });
  return initialMap;
}

export function saveWordProgress(progress: Record<string, WordProgress>): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Storage fallback
  }
}

export function loadLeaderboard(): LeaderboardUser[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Fallback
  }
  return INITIAL_LEADERBOARD;
}

export function saveLeaderboard(users: LeaderboardUser[]): void {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(users));
  } catch {
    // Fallback
  }
}

export function calculateLevel(xp: number): { level: number; progress: number; nextLevelXp: number } {
  // Levels: L1: 0-250, L2: 250-600, L3: 600-1100, L4: 1100-1800, L5: 1800-2700, etc.
  const levels = [0, 250, 600, 1100, 1800, 2700, 3800, 5100, 6600, 8500];
  let level = 1;
  for (let i = 0; i < levels.length; i++) {
    if (xp >= levels[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  const currentFloor = levels[Math.min(level - 1, levels.length - 1)];
  const nextCeiling = levels[Math.min(level, levels.length - 1)] || currentFloor + 1500;
  const progress = Math.min(100, Math.max(0, Math.round(((xp - currentFloor) / (nextCeiling - currentFloor)) * 100)));

  return { level, progress, nextLevelXp: nextCeiling };
}
