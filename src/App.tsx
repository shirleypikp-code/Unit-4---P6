/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TabType, UserStats, WordProgress, VocabularyWord, LeaderboardUser } from './types';
import { VOCABULARY_WORDS } from './data/vocabulary';
import {
  loadUserStats,
  saveUserStats,
  loadWordProgress,
  saveWordProgress,
  loadLeaderboard,
  saveLeaderboard,
  getTodayDateString,
  BADGES
} from './utils/storage';
import { isDueForReview } from './utils/srs';
import { soundManager } from './utils/sound';
import { Header } from './components/Header';
import { OfflineBanner } from './components/OfflineBanner';
import { SpacedRepetitionDeck } from './components/SpacedRepetitionDeck';
import { QuizArena } from './components/QuizArena';
import { WordScramble } from './components/WordScramble';
import { ContextMatch } from './components/ContextMatch';
import { WordBattle } from './components/WordBattle';
import { InsightsDashboard } from './components/InsightsDashboard';
import { LeaderboardView } from './components/LeaderboardView';
import { WordVault } from './components/WordVault';
import { WordDetailModal } from './components/WordDetailModal';
import { BadgesModal } from './components/BadgesModal';
import confetti from 'canvas-confetti';

export default function App() {
  const [stats, setStats] = useState<UserStats>(loadUserStats);
  const [wordProgress, setWordProgress] = useState<Record<string, WordProgress>>(loadWordProgress);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(loadLeaderboard);
  const [currentTab, setCurrentTab] = useState<TabType>('practice');

  // Modals & inspect
  const [inspectWord, setInspectWord] = useState<VocabularyWord | null>(null);
  const [isBadgesOpen, setIsBadgesOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [battleChallengeScore, setBattleChallengeScore] = useState<number | null>(null);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sound manager mute sync
    soundManager.enabled = stats.soundEnabled;

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [stats.soundEnabled]);

  // Save changes to localStorage
  const handleUpdateStats = useCallback((newStats: UserStats) => {
    setStats(newStats);
    saveUserStats(newStats);
  }, []);

  const handleUpdateProgress = useCallback((newProgress: Record<string, WordProgress>) => {
    setWordProgress(newProgress);
    saveWordProgress(newProgress);

    // Calculate words learned count
    const learnedCount = Object.values(newProgress).filter(p => p.box >= 2).length;
    if (learnedCount !== stats.totalWordsLearned) {
      const updatedStats = { ...stats, totalWordsLearned: learnedCount };
      setStats(updatedStats);
      saveUserStats(updatedStats);
    }
  }, [stats]);

  // Count words due today
  const dueCount = useMemo(() => {
    return VOCABULARY_WORDS.filter(w => {
      const p = wordProgress[w.id];
      return !p || isDueForReview(p);
    }).length;
  }, [wordProgress]);

  // Handle battle challenge initiated from quiz
  const handleInitiateBattleWithScore = (score: number, accuracy: number) => {
    setBattleChallengeScore(score);
    setCurrentTab('battle');
  };

  const handleChallengeRival = (rivalName: string) => {
    setCurrentTab('battle');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        stats={stats}
        onStatsChange={handleUpdateStats}
        isOnline={isOnline}
        onOpenBadges={() => setIsBadgesOpen(true)}
        dueCount={dueCount}
      />

      {/* Offline Status Notice */}
      <OfflineBanner isOnline={isOnline} />

      {/* Main View Area */}
      <main className="flex-1 pb-16 pt-2">
        {currentTab === 'practice' && (
          <SpacedRepetitionDeck
            wordProgress={wordProgress}
            onUpdateProgress={handleUpdateProgress}
            stats={stats}
            onUpdateStats={handleUpdateStats}
            onSelectWordDetail={setInspectWord}
          />
        )}

        {currentTab === 'quiz' && (
          <QuizArena
            wordProgress={wordProgress}
            onUpdateProgress={handleUpdateProgress}
            stats={stats}
            onUpdateStats={handleUpdateStats}
            onNavigateTab={setCurrentTab}
            onInitiateBattleWithScore={handleInitiateBattleWithScore}
          />
        )}

        {currentTab === 'scramble' && (
          <WordScramble
            wordProgress={wordProgress}
            onUpdateProgress={handleUpdateProgress}
            stats={stats}
            onUpdateStats={handleUpdateStats}
          />
        )}

        {currentTab === 'context' && (
          <ContextMatch
            wordProgress={wordProgress}
            onUpdateProgress={handleUpdateProgress}
            stats={stats}
            onUpdateStats={handleUpdateStats}
          />
        )}

        {currentTab === 'battle' && (
          <WordBattle
            wordProgress={wordProgress}
            onUpdateProgress={handleUpdateProgress}
            stats={stats}
            onUpdateStats={handleUpdateStats}
            initialScoreToChallenge={battleChallengeScore}
          />
        )}

        {currentTab === 'insights' && (
          <InsightsDashboard
            wordProgress={wordProgress}
            stats={stats}
            onNavigateTab={setCurrentTab}
            onSelectWordDetail={setInspectWord}
          />
        )}

        {currentTab === 'leaderboard' && (
          <LeaderboardView
            leaderboard={leaderboard}
            stats={stats}
            onNavigateTab={setCurrentTab}
            onChallengeRival={handleChallengeRival}
          />
        )}

        {currentTab === 'dictionary' && (
          <WordVault
            wordProgress={wordProgress}
            stats={stats}
            onSelectWord={setInspectWord}
            onNavigateTab={setCurrentTab}
          />
        )}
      </main>

      {/* Word Detail Modal */}
      <WordDetailModal
        word={inspectWord}
        progress={inspectWord ? wordProgress[inspectWord.id] : undefined}
        onClose={() => setInspectWord(null)}
      />

      {/* Badges Modal */}
      <BadgesModal
        stats={stats}
        wordProgress={wordProgress}
        isOpen={isBadgesOpen}
        onClose={() => setIsBadgesOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p className="max-w-xl mx-auto px-4">
          LexiQuest • 20 Core Target Words • Spaced Repetition (SM-2) • Interactive Quizzes • Offline Capable
        </p>
      </footer>
    </div>
  );
}
