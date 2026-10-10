import React, { useState, useEffect } from 'react';
import { VocabularyWord, WordProgress, UserStats } from '../types';
import { VOCABULARY_WORDS } from '../data/vocabulary';
import { soundManager } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  Sparkles,
  Volume2,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Flame,
  Award
} from 'lucide-react';

interface StoryPuzzle {
  id: string;
  storyTitle: string;
  sentenceBefore: string;
  targetWord: VocabularyWord;
  sentenceAfter: string;
  distractors: string[];
}

interface ContextMatchProps {
  wordProgress: Record<string, WordProgress>;
  onUpdateProgress: (newProgress: Record<string, WordProgress>) => void;
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
}

export const ContextMatch: React.FC<ContextMatchProps> = ({
  wordProgress,
  onUpdateProgress,
  stats,
  onUpdateStats
}) => {
  const [puzzles, setPuzzles] = useState<StoryPuzzle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  // Generate narrative fill-in puzzles
  useEffect(() => {
    const storyList: StoryPuzzle[] = VOCABULARY_WORDS.map((w, idx) => {
      // Create context snippet
      const sentence = w.exampleSentence;
      const regex = new RegExp(`\\b${w.word}\\b`, 'i');
      const parts = sentence.split(regex);
      const before = parts[0] || '';
      const after = parts.slice(1).join(w.word) || '';

      const otherWords = VOCABULARY_WORDS
        .filter(item => item.id !== w.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(item => item.word);

      const allOptions = [w.word, ...otherWords].sort(() => 0.5 - Math.random());

      return {
        id: `story-${w.id}-${idx}`,
        storyTitle: `${w.category} Chronicle`,
        sentenceBefore: before,
        targetWord: w,
        sentenceAfter: after,
        distractors: allOptions
      };
    }).sort(() => 0.5 - Math.random());

    setPuzzles(storyList);
  }, []);

  const currentPuzzle = puzzles[currentIndex];

  const handleSelectOption = (word: string) => {
    if (isAnswered || !currentPuzzle) return;

    setSelectedWord(word);
    setIsAnswered(true);

    const match = word.toLowerCase() === currentPuzzle.targetWord.word.toLowerCase();
    setIsCorrect(match);

    if (match) {
      soundManager.playCorrect();
      const nextCount = completedCount + 1;
      setCompletedCount(nextCount);

      const newStats: UserStats = {
        ...stats,
        xp: stats.xp + 30,
        todayReviewedCount: stats.todayReviewedCount + 1
      };

      if (nextCount >= 5 && !newStats.unlockedBadgeIds.includes('context_weaver')) {
        newStats.unlockedBadgeIds.push('context_weaver');
        confetti({ particleCount: 90, spread: 60 });
        soundManager.playStreakFanfare();
      }

      onUpdateStats(newStats);
      confetti({ particleCount: 50, spread: 50 });
    } else {
      soundManager.playIncorrect();
    }
  };

  const handleNext = () => {
    soundManager.playClick();
    if (currentIndex + 1 < puzzles.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedWord(null);
      setIsAnswered(false);
      setIsCorrect(false);
    } else {
      setCurrentIndex(0);
      setSelectedWord(null);
      setIsAnswered(false);
      setIsCorrect(false);
    }
  };

  if (!currentPuzzle) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/90 p-4 rounded-2xl border border-indigo-900/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">Story Context Weaver</h2>
            <p className="text-[11px] text-slate-400">Match words into natural narrative sentences</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold bg-indigo-950/60 border border-indigo-800 px-3 py-1 rounded-xl">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Solved: {completedCount}</span>
        </div>
      </div>

      {/* Main Story Board */}
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-indigo-900/40 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            {currentPuzzle.storyTitle}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {currentIndex + 1} of {puzzles.length}
          </span>
        </div>

        {/* Narrative Box */}
        <div className="bg-slate-950/80 p-6 rounded-2xl border-2 border-indigo-900/60 leading-relaxed text-base sm:text-lg text-slate-200">
          <span>{currentPuzzle.sentenceBefore}</span>
          <span className={`inline-flex items-center justify-center min-w-[120px] px-3 py-1 mx-2 rounded-xl border-2 font-bold font-['Outfit'] transition-all ${
            isAnswered
              ? isCorrect
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40'
                : 'bg-rose-950/90 border-rose-500 text-rose-300'
              : 'bg-indigo-950/70 border-indigo-700/80 text-indigo-300 border-dashed animate-pulse'
          }`}>
            {selectedWord || '___________'}
          </span>
          <span>{currentPuzzle.sentenceAfter}</span>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Select the word that fits this story context:
          </span>

          <div className="grid grid-cols-2 gap-3">
            {currentPuzzle.distractors.map((word, idx) => {
              const isSelected = selectedWord === word;
              const isRight = word.toLowerCase() === currentPuzzle.targetWord.word.toLowerCase();

              let style = 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700';

              if (isAnswered) {
                if (isRight) {
                  style = 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold';
                } else if (isSelected) {
                  style = 'bg-rose-950 border-rose-500 text-rose-200 font-bold';
                } else {
                  style = 'bg-slate-900 border-slate-800 text-slate-500 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(word)}
                  disabled={isAnswered}
                  className={`p-4 rounded-2xl border-2 text-center font-bold text-sm sm:text-base font-['Outfit'] transition-all ${style}`}
                >
                  {word}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback details */}
        {isAnswered && (
          <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-amber-300 font-['Outfit']">
                  {currentPuzzle.targetWord.word}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {currentPuzzle.targetWord.pronunciation}
                </span>
                <button
                  onClick={() => soundManager.speak(currentPuzzle.targetWord.word)}
                  className="p-1 rounded bg-slate-800 text-indigo-300 hover:text-white"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {currentPuzzle.targetWord.partOfSpeech}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300">
              {currentPuzzle.targetWord.definition}
            </p>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-md transition hover:scale-105"
              >
                Next Story <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
