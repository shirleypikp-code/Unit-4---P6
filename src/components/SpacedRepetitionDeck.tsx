import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { VocabularyWord, WordProgress, UserStats } from '../types';
import { VOCABULARY_WORDS } from '../data/vocabulary';
import { calculateNextReview, isDueForReview, formatTimeUntilDue } from '../utils/srs';
import { soundManager } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Volume2,
  RotateCw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle,
  Lightbulb,
  ThumbsUp,
  Flame,
  Award
} from 'lucide-react';

interface SpacedRepetitionDeckProps {
  wordProgress: Record<string, WordProgress>;
  onUpdateProgress: (newProgress: Record<string, WordProgress>) => void;
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  onSelectWordDetail?: (word: VocabularyWord) => void;
}

export const SpacedRepetitionDeck: React.FC<SpacedRepetitionDeckProps> = ({
  wordProgress,
  onUpdateProgress,
  stats,
  onUpdateStats,
  onSelectWordDetail
}) => {
  const [filterMode, setFilterMode] = useState<'due' | 'all' | 'box1' | 'mastered'>('due');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionReviewedCount, setSessionReviewedCount] = useState(0);

  // Filter deck
  const activeWords: VocabularyWord[] = useMemo(() => {
    if (filterMode === 'due') {
      const due = VOCABULARY_WORDS.filter(w => {
        const prog = wordProgress[w.id];
        return !prog || isDueForReview(prog);
      });
      return due.length > 0 ? due : VOCABULARY_WORDS;
    }
    if (filterMode === 'box1') {
      return VOCABULARY_WORDS.filter(w => (wordProgress[w.id]?.box || 1) <= 2);
    }
    if (filterMode === 'mastered') {
      return VOCABULARY_WORDS.filter(w => (wordProgress[w.id]?.box || 1) >= 4);
    }
    return VOCABULARY_WORDS;
  }, [filterMode, wordProgress]);

  // Current active word
  const currentWord = activeWords[currentIndex] || activeWords[0];
  const currentProg = currentWord ? (wordProgress[currentWord.id] || {
    wordId: currentWord.id,
    box: 1,
    repetitionCount: 0,
    easeFactor: 2.5,
    intervalDays: 1,
    lastReviewedAt: null,
    nextReviewAt: new Date().toISOString(),
    timesCorrect: 0,
    timesIncorrect: 0,
    consecutiveStreak: 0,
    masteryScore: 0
  }) : null;

  // Handle grade submission
  const handleGrade = useCallback((grade: 1 | 2 | 3 | 4) => {
    if (!currentWord || !currentProg) return;

    soundManager.playClick();
    if (grade >= 3) {
      soundManager.playCorrect();
    } else {
      soundManager.playIncorrect();
    }

    const updated = calculateNextReview(currentProg, grade);
    const newProgressMap = {
      ...wordProgress,
      [currentWord.id]: updated
    };
    onUpdateProgress(newProgressMap);

    // Update stats: XP gains
    const earnedXp = grade === 4 ? 25 : grade === 3 ? 15 : grade === 2 ? 10 : 5;
    const newStats: UserStats = {
      ...stats,
      xp: stats.xp + earnedXp,
      todayReviewedCount: stats.todayReviewedCount + 1,
      totalWordsLearned: Object.values(newProgressMap).filter(p => p.box >= 2).length,
    };

    // Check badges
    if (!newStats.unlockedBadgeIds.includes('srs_box_explorer')) {
      const box3Count = Object.values(newProgressMap).filter(p => p.box >= 3).length;
      if (box3Count >= 5) {
        newStats.unlockedBadgeIds.push('srs_box_explorer');
        confetti({ particleCount: 80, spread: 60 });
        soundManager.playStreakFanfare();
      }
    }

    onUpdateStats(newStats);
    setSessionReviewedCount(prev => prev + 1);

    // Move to next card or complete
    if (currentIndex + 1 < activeWords.length) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionCompleted(true);
      soundManager.playVictory();
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
  }, [currentWord, currentProg, wordProgress, onUpdateProgress, stats, onUpdateStats, currentIndex, activeWords.length]);

  const handleSpeak = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundManager.speak(text);
  };

  const handleFlip = () => {
    soundManager.playCardFlip();
    setIsFlipped(!isFlipped);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionCompleted) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === '1') handleGrade(1);
        if (e.key === '2') handleGrade(2);
        if (e.key === '3') handleGrade(3);
        if (e.key === '4') handleGrade(4);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, sessionCompleted, handleGrade]);

  const restartDeck = () => {
    setSessionCompleted(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionReviewedCount(0);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Filter and SRS Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-indigo-900/40 shadow-sm">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Spaced Repetition Deck</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
            SM-2 Algorithm
          </span>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => { setFilterMode('due'); setCurrentIndex(0); setIsFlipped(false); }}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filterMode === 'due' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Due for Review
          </button>
          <button
            onClick={() => { setFilterMode('all'); setCurrentIndex(0); setIsFlipped(false); }}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filterMode === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All 20 Words
          </button>
          <button
            onClick={() => { setFilterMode('box1'); setCurrentIndex(0); setIsFlipped(false); }}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filterMode === 'box1' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Need Practice (Box 1-2)
          </button>
          <button
            onClick={() => { setFilterMode('mastered'); setCurrentIndex(0); setIsFlipped(false); }}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filterMode === 'mastered' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mastered (Box 4-5)
          </button>
        </div>
      </div>

      {sessionCompleted ? (
        /* Completion Screen */
        <div className="bg-gradient-to-b from-slate-900 to-indigo-950/70 p-8 rounded-3xl border border-indigo-500/30 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              Review Session Complete!
            </h3>
            <p className="text-slate-300 max-w-md mx-auto text-sm">
              You reviewed {sessionReviewedCount} words. Your spaced repetition intervals have been automatically rescheduled based on your memory retention curve!
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto">
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
              <span className="text-xs text-slate-400 block">Reviewed</span>
              <span className="text-xl font-bold text-amber-300">+{sessionReviewedCount}</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
              <span className="text-xs text-slate-400 block">XP Earned</span>
              <span className="text-xl font-bold text-emerald-400">+{sessionReviewedCount * 18} XP</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-400 block">Current Streak</span>
              <span className="text-xl font-bold text-rose-400 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 fill-rose-400" /> {stats.currentStreak}d
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={restartDeck}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition hover:scale-105"
            >
              Practice Again
            </button>
            <button
              onClick={() => {
                setFilterMode('all');
                restartDeck();
              }}
              className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition"
            >
              Browse All 20 Words
            </button>
          </div>
        </div>
      ) : activeWords.length === 0 ? (
        <div className="bg-slate-900/80 p-10 rounded-3xl border border-slate-800 text-center space-y-4">
          <Sparkles className="w-12 h-12 text-amber-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">No words match this filter right now</h3>
          <p className="text-slate-400 text-sm">Switch filters to see your words or check due reviews.</p>
          <button
            onClick={() => setFilterMode('all')}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition"
          >
            Show All 20 Words
          </button>
        </div>
      ) : (
        /* Active Flashcard */
        <div className="space-y-4">
          {/* Card Meta & Leitner Box Header */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">
                Card {currentIndex + 1} of {activeWords.length}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-indigo-400 font-medium">{currentWord.category}</span>
            </div>

            {/* Leitner Box Level Badges */}
            <div className="flex items-center gap-1.5" title="Leitner Spaced Repetition Box">
              <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">SRS Level:</span>
              {[1, 2, 3, 4, 5].map((b) => {
                const currentBox = currentProg?.box || 1;
                const isReached = b <= currentBox;
                return (
                  <div
                    key={b}
                    className={`w-6 h-5 rounded flex items-center justify-center font-bold text-[10px] transition-all ${
                      isReached
                        ? b === 5
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm shadow-amber-500/50'
                          : 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-500 border border-slate-700/60'
                    }`}
                  >
                    B{b}
                  </div>
                );
              })}
              <span className="text-[10px] ml-1 text-slate-400 font-mono">
                ({formatTimeUntilDue(currentProg?.nextReviewAt || new Date().toISOString())})
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / activeWords.length) * 100}%` }}
            />
          </div>

          {/* 3D Flip Card Container */}
          <div
            onClick={handleFlip}
            className="cursor-pointer group relative min-h-[360px] sm:min-h-[380px] w-full rounded-3xl p-6 sm:p-8 transition-all duration-300 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/80 border-2 border-indigo-700/40 hover:border-indigo-500 shadow-xl shadow-indigo-950/40 flex flex-col justify-between select-none"
          >
            {/* Top row of card */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-950/80 border border-indigo-700/60 text-indigo-300">
                  {currentWord.partOfSpeech}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {currentProg?.timesCorrect || 0}✓ / {currentProg?.timesIncorrect || 0}✗
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleSpeak(currentWord.word, e)}
                  title="Listen to pronunciation"
                  className="p-2.5 rounded-full bg-indigo-800/50 hover:bg-indigo-600 text-indigo-200 hover:text-white transition shadow-sm"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <div className="text-xs text-slate-400 flex items-center gap-1 group-hover:text-indigo-300 transition">
                  <RotateCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="hidden sm:inline">Flip</span>
                </div>
              </div>
            </div>

            {/* Middle Content */}
            {!isFlipped ? (
              /* FRONT OF CARD */
              <div className="my-auto text-center space-y-4 py-8">
                <span className="inline-block text-xs uppercase tracking-widest text-indigo-400 font-semibold">
                  Tap to Reveal Definition
                </span>
                <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-amber-200 tracking-tight font-['Outfit']">
                  {currentWord.word}
                </h1>
                <p className="text-slate-400 text-base sm:text-lg font-mono">
                  {currentWord.pronunciation}
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 text-slate-300 text-xs border border-slate-700/80">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    Press Spacebar or Click to flip
                  </span>
                </div>
              </div>
            ) : (
              /* BACK OF CARD */
              <div className="my-auto space-y-4 py-4 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-['Outfit']">
                      {currentWord.word}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">{currentWord.pronunciation}</span>
                  </div>
                  <p className="text-lg text-slate-100 font-medium leading-snug">
                    {currentWord.definition}
                  </p>
                </div>

                {/* Friendly explanation */}
                <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-indigo-900/40 space-y-1">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" /> In Simple Words:
                  </span>
                  <p className="text-sm text-slate-300 italic">
                    "{currentWord.childFriendlyDefinition}"
                  </p>
                </div>

                {/* Example sentence */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Context in Action:
                  </span>
                  <p className="text-sm text-emerald-300/95 font-medium bg-emerald-950/40 p-3 rounded-xl border border-emerald-900/40">
                    "{currentWord.exampleSentence}"
                  </p>
                </div>

                {/* Mnemonic trick */}
                <div className="flex items-start gap-2 text-xs text-amber-200/90 bg-amber-950/30 p-2.5 rounded-xl border border-amber-800/40">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Memory Hook: </span>
                    {currentWord.mnemonic}
                  </div>
                </div>

                {/* Synonyms */}
                {currentWord.synonyms.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-xs text-slate-400">Synonyms:</span>
                    {currentWord.synonyms.map(syn => (
                      <span key={syn} className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {syn}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom hint */}
            <div className="text-center pt-2">
              <span className="text-[11px] text-slate-500 font-medium">
                LexiQuest Spaced Repetition Engine • SuperMemo SM-2 & Leitner Box
              </span>
            </div>
          </div>

          {/* Rating Buttons - Visible when card flipped */}
          {isFlipped ? (
            <div className="space-y-2 pt-2">
              <div className="text-center text-xs text-slate-400 font-medium">
                How easily did you recall this word? (Shortcuts: keys 1 to 4)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1 - Again */}
                <button
                  onClick={() => handleGrade(1)}
                  className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-950/60 hover:bg-rose-900/80 border-2 border-rose-800 text-rose-200 transition-all hover:scale-102"
                >
                  <span className="font-bold text-sm flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5" /> Again (1)
                  </span>
                  <span className="text-[10px] text-rose-400">Review today (Box 1)</span>
                </button>

                {/* 2 - Hard */}
                <button
                  onClick={() => handleGrade(2)}
                  className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-950/60 hover:bg-amber-900/80 border-2 border-amber-800 text-amber-200 transition-all hover:scale-102"
                >
                  <span className="font-bold text-sm flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Hard (2)
                  </span>
                  <span className="text-[10px] text-amber-400">Review soon (~1-2d)</span>
                </button>

                {/* 3 - Good */}
                <button
                  onClick={() => handleGrade(3)}
                  className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/80 border-2 border-emerald-800 text-emerald-200 transition-all hover:scale-102"
                >
                  <span className="font-bold text-sm flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5" /> Good (3)
                  </span>
                  <span className="text-[10px] text-emerald-400">+1 Box level</span>
                </button>

                {/* 4 - Easy */}
                <button
                  onClick={() => handleGrade(4)}
                  className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-950/60 hover:bg-indigo-900/80 border-2 border-indigo-700 text-indigo-200 transition-all hover:scale-102"
                >
                  <span className="font-bold text-sm flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Easy (4)
                  </span>
                  <span className="text-[10px] text-indigo-300">+2 Boxes (Accelerate)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Navigation Arrows when not flipped */
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button
                onClick={handleFlip}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
              >
                Reveal Answer (Space)
              </button>

              <button
                onClick={() => setCurrentIndex(prev => Math.min(activeWords.length - 1, prev + 1))}
                disabled={currentIndex === activeWords.length - 1}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
