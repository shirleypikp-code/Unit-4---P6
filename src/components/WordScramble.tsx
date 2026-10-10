import React, { useState, useEffect } from 'react';
import { VocabularyWord, WordProgress, UserStats } from '../types';
import { VOCABULARY_WORDS } from '../data/vocabulary';
import { soundManager } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Puzzle,
  RotateCcw,
  Sparkles,
  Lightbulb,
  Volume2,
  CheckCircle2,
  Delete,
  Trophy,
  ArrowRight,
  Flame
} from 'lucide-react';

interface WordScrambleProps {
  wordProgress: Record<string, WordProgress>;
  onUpdateProgress: (newProgress: Record<string, WordProgress>) => void;
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
}

interface Tile {
  id: string;
  char: string;
  originalIndex: number;
}

export const WordScramble: React.FC<WordScrambleProps> = ({
  wordProgress,
  onUpdateProgress,
  stats,
  onUpdateStats
}) => {
  const [wordList, setWordList] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrambledTiles, setScrambledTiles] = useState<Tile[]>([]);
  const [placedTiles, setPlacedTiles] = useState<Tile[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isWrong, setIsWrong] = useState(false);
  const [hintLevel, setHintLevel] = useState(0); // 0: None, 1: Definition, 2: First Letter
  const [streak, setStreak] = useState(0);
  const [totalSolved, setTotalSolved] = useState(0);

  // Initialize randomized list of words
  useEffect(() => {
    const shuffled = [...VOCABULARY_WORDS].sort(() => 0.5 - Math.random());
    setWordList(shuffled);
  }, []);

  const currentWord = wordList[currentIndex] || VOCABULARY_WORDS[0];

  // Prepare tiles when current word changes
  useEffect(() => {
    if (!currentWord) return;

    const chars = currentWord.word.split('');
    const rawTiles: Tile[] = chars.map((ch, idx) => ({
      id: `${ch}-${idx}-${Math.random()}`,
      char: ch,
      originalIndex: idx
    }));

    // Shuffle characters while ensuring it's not identical to answer if possible
    let shuffled = [...rawTiles].sort(() => 0.5 - Math.random());
    if (shuffled.map(t => t.char).join('') === currentWord.word && chars.length > 2) {
      shuffled = shuffled.reverse();
    }

    setScrambledTiles(shuffled);
    setPlacedTiles([]);
    setIsSuccess(false);
    setIsWrong(false);
    setHintLevel(0);
  }, [currentIndex, wordList, currentWord]);

  const targetClean = currentWord ? currentWord.word.toLowerCase() : '';

  // Select tile from bank
  const handleSelectTile = (tile: Tile) => {
    soundManager.playClick();
    setScrambledTiles(prev => prev.filter(t => t.id !== tile.id));
    const nextPlaced = [...placedTiles, tile];
    setPlacedTiles(nextPlaced);

    // If all tiles placed, check answer!
    if (nextPlaced.length === targetClean.length) {
      checkAnswer(nextPlaced);
    }
  };

  // Remove tile from answer line
  const handleRemoveTile = (tile: Tile) => {
    soundManager.playClick();
    setPlacedTiles(prev => prev.filter(t => t.id !== tile.id));
    setScrambledTiles(prev => [...prev, tile]);
    setIsWrong(false);
  };

  const handleClear = () => {
    soundManager.playClick();
    setScrambledTiles(prev => [...prev, ...placedTiles]);
    setPlacedTiles([]);
    setIsWrong(false);
  };

  const checkAnswer = (tiles: Tile[]) => {
    const constructed = tiles.map(t => t.char).join('').toLowerCase();
    if (constructed === targetClean) {
      // Correct!
      soundManager.playCorrect();
      setIsSuccess(true);
      setIsWrong(false);
      setStreak(prev => prev + 1);
      setTotalSolved(prev => prev + 1);

      // Award XP
      const earnedXp = hintLevel === 0 ? 35 : hintLevel === 1 ? 25 : 15;
      const newStats: UserStats = {
        ...stats,
        xp: stats.xp + earnedXp,
        todayReviewedCount: stats.todayReviewedCount + 1,
      };

      if (totalSolved + 1 >= 5 && !newStats.unlockedBadgeIds.includes('wordsmith_scramble')) {
        newStats.unlockedBadgeIds.push('wordsmith_scramble');
        confetti({ particleCount: 90, spread: 60 });
        soundManager.playStreakFanfare();
      }

      onUpdateStats(newStats);
      confetti({ particleCount: 70, spread: 50 });
    } else {
      // Incorrect
      soundManager.playIncorrect();
      setIsWrong(true);
    }
  };

  const handleNextWord = () => {
    soundManager.playClick();
    if (currentIndex + 1 < wordList.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Reshuffle and start over
      const shuffled = [...VOCABULARY_WORDS].sort(() => 0.5 - Math.random());
      setWordList(shuffled);
      setCurrentIndex(0);
    }
  };

  const useHint = () => {
    soundManager.playClick();
    if (hintLevel < 2) {
      setHintLevel(prev => prev + 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-slate-900/90 p-4 rounded-2xl border border-indigo-900/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-white">
            <Puzzle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">Spell Scramble Quest</h2>
            <p className="text-[11px] text-slate-400">Reconstruct the 20 target vocabulary words</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-orange-950/60 border border-orange-800 text-orange-300 px-2.5 py-1 rounded-xl text-xs font-bold">
            <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
            <span>Streak: {streak}</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Word {currentIndex + 1} / {wordList.length}
          </span>
        </div>
      </div>

      {/* Main Scramble Card */}
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-indigo-900/40 shadow-xl space-y-6 text-center">
        {/* Category & Clue */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              {currentWord?.partOfSpeech}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-300">{currentWord?.category}</span>
          </div>

          {/* Definition Hint */}
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 max-w-lg mx-auto">
            <p className="text-sm sm:text-base text-slate-200 font-medium italic">
              "{currentWord?.childFriendlyDefinition}"
            </p>
          </div>
        </div>

        {/* Answer Slot Container */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Tap letters below to spell the word
          </span>

          <div className="min-h-[64px] flex flex-wrap items-center justify-center gap-2 p-3 rounded-2xl bg-slate-950/70 border-2 border-indigo-900/60">
            {placedTiles.length === 0 ? (
              <span className="text-xs text-slate-600 font-medium italic">
                (Letter slots empty)
              </span>
            ) : (
              placedTiles.map((tile) => (
                <button
                  key={tile.id}
                  onClick={() => handleRemoveTile(tile)}
                  disabled={isSuccess}
                  className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl flex items-center justify-center text-lg sm:text-2xl font-black font-['Fredoka'] uppercase transition-all shadow-md ${
                    isSuccess
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400'
                      : isWrong
                      ? 'bg-rose-600 text-white shadow-rose-600/30 animate-shake'
                      : 'bg-indigo-600 hover:bg-rose-600 text-white shadow-indigo-600/20 hover:scale-105'
                  }`}
                >
                  {tile.char === ' ' ? '␣' : tile.char}
                </button>
              ))
            )}
          </div>

          {/* Error Message */}
          {isWrong && (
            <p className="text-xs font-bold text-rose-400 animate-pulse">
              Not quite! Check the spelling and try again.
            </p>
          )}

          {/* Success Box */}
          {isSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 space-y-3 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-center gap-2 text-emerald-300 font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Spell Mastered! +{hintLevel === 0 ? 35 : 20} XP</span>
                <button
                  onClick={() => soundManager.speak(currentWord.word)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-200 italic">
                "{currentWord.exampleSentence}"
              </p>

              <button
                onClick={handleNextWord}
                className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition hover:scale-105"
              >
                Next Word <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Bank of Available Scrambled Tiles */}
        {!isSuccess && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-md mx-auto">
              {scrambledTiles.map((tile) => (
                <button
                  key={tile.id}
                  onClick={() => handleSelectTile(tile)}
                  className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-100 hover:text-white border border-slate-700 hover:border-indigo-500 font-black text-lg sm:text-2xl font-['Fredoka'] uppercase transition-all shadow-sm hover:scale-110 active:scale-95"
                >
                  {tile.char === ' ' ? '␣' : tile.char}
                </button>
              ))}
            </div>

            {/* Utility Controls */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={handleClear}
                disabled={placedTiles.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 text-xs font-semibold"
              >
                <Delete className="w-3.5 h-3.5" /> Clear All
              </button>

              <button
                onClick={useHint}
                disabled={hintLevel >= 2}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900 border border-amber-800 text-amber-200 disabled:opacity-40 text-xs font-semibold"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                {hintLevel === 0 ? 'Hint: Memory Hook' : hintLevel === 1 ? 'Hint: First Letter' : 'Max Hints Used'}
              </button>

              <button
                onClick={() => soundManager.speak(currentWord.word)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800 text-indigo-200 text-xs font-semibold"
              >
                <Volume2 className="w-3.5 h-3.5 text-indigo-300" /> Listen
              </button>
            </div>

            {/* Active Hints */}
            {hintLevel >= 1 && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 max-w-md mx-auto text-left">
                <span className="font-bold">Memory Hook: </span> {currentWord.mnemonic}
                {hintLevel >= 2 && (
                  <div className="mt-1 pt-1 border-t border-amber-800/40">
                    <span className="font-bold">Starts with: </span> <span className="uppercase text-amber-300 font-black">{currentWord.word.charAt(0)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
