export interface VocabularyWord {
  id: string;
  word: string;
  partOfSpeech: string;
  pronunciation: string;
  definition: string;
  childFriendlyDefinition: string;
  exampleSentence: string;
  secondarySentence: string;
  mnemonic: string;
  synonyms: string[];
  antonyms: string[];
  funFactOrContext: string;
  category: 'Character & People' | 'Actions & States' | 'Nature & World' | 'Language & Thought';
}

export interface WordProgress {
  wordId: string;
  box: number; // 1 to 5 (Leitner Box)
  repetitionCount: number;
  easeFactor: number; // SM-2 ease factor, default 2.5
  intervalDays: number;
  lastReviewedAt: string | null;
  nextReviewAt: string;
  timesCorrect: number;
  timesIncorrect: number;
  consecutiveStreak: number;
  masteryScore: number; // 0 to 100
}

export interface UserStats {
  xp: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  todayReviewedCount: number;
  totalQuizzesTaken: number;
  totalWordsLearned: number;
  battlesWon: number;
  streakFreezeAvailable: number;
  soundEnabled: boolean;
  unlockedBadgeIds: string[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'mastery' | 'battle' | 'quiz';
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  target: number;
  progress: (stats: UserStats, wordProgress: Record<string, WordProgress>) => number;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  streak: number;
  wordsMastered: number;
  badge: string;
  isCurrentUser?: boolean;
}

export interface BattleChallenge {
  id: string;
  creatorName: string;
  score: number;
  accuracy: number;
  timeSeconds: number;
  dateCreated: string;
  wordIds: string[];
}

export type TabType = 'practice' | 'quiz' | 'scramble' | 'context' | 'battle' | 'insights' | 'leaderboard' | 'dictionary';
