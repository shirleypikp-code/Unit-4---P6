import React, { useState, useEffect, useMemo, useRef } from 'react';
import { VocabularyWord, WordProgress, UserStats, TabType } from '../types';
import { VOCABULARY_WORDS } from '../data/vocabulary';
import { calculateNextReview } from '../utils/srs';
import { soundManager } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Timer,
  Flame,
  Zap,
  Check,
  X,
  Volume2,
  Trophy,
  RotateCcw,
  Swords,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

interface QuizQuestion {
  id: string;
  word: VocabularyWord;
  prompt: string;
  type: 'definition' | 'fill-blank' | 'synonym' | 'riddle';
  options: string[];
  correctAnswer: string;
  hint: string;
}

interface QuizArenaProps {
  wordProgress: Record<string, WordProgress>;
  onUpdateProgress: (newProgress: Record<string, WordProgress>) => void;
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  onNavigateTab: (tab: TabType) => void;
  onInitiateBattleWithScore?: (score: number, accuracy: number) => void;
}

export const QuizArena: React.FC<QuizArenaProps> = ({
  wordProgress,
  onUpdateProgress,
  stats,
  onUpdateStats,
  onNavigateTab,
  onInitiateBattleWithScore
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [wrongWordIds, setWrongWordIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [showHint, setShowHint] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate dynamic quiz questions
  const generateQuestions = (count: number = 10) => {
    // Shuffle words
    const shuffled = [...VOCABULARY_WORDS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    const newQuestions: QuizQuestion[] = selected.map((word, idx) => {
      // Pick question type
      const types: ('definition' | 'fill-blank' | 'synonym' | 'riddle')[] = ['definition', 'fill-blank', 'synonym', 'riddle'];
      const qType = types[idx % types.length];

      let prompt = '';
      if (qType === 'definition') {
        prompt = `Which word matches this definition?\n"${word.definition}"`;
      } else if (qType === 'fill-blank') {
        const masked = word.exampleSentence.replace(new RegExp(word.word, 'gi'), '__________');
        prompt = `Fill in the blank in this sentence:\n"${masked}"`;
      } else if (qType === 'synonym') {
        prompt = `Which word is synonymous with: ${word.synonyms.slice(0, 3).join(', ')}?`;
      } else {
        prompt = `Riddle clue: ${word.childFriendlyDefinition}`;
      }

      // Pick 3 distractors from the remaining words
      const distractors = VOCABULARY_WORDS
        .filter(w => w.id !== word.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(w => w.word);

      const allOptions = [...distractors, word.word].sort(() => 0.5 - Math.random());

      return {
        id: `q-${word.id}-${idx}`,
        word,
        prompt,
        type: qType,
        options: allOptions,
        correctAnswer: word.word,
        hint: word.mnemonic
      };
    });

    setQuestions(newQuestions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setTimeLeft(15);
    setIsQuizFinished(false);
    setWrongWordIds([]);
    setShowHint(false);
  };

  useEffect(() => {
    generateQuestions(questionCount);
  }, [questionCount]);

  // Timer effect
  useEffect(() => {
    if (isQuizFinished || isAnswered || questions.length === 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time expired
          clearInterval(timerRef.current!);
          handleSelectOption('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isAnswered, isQuizFinished, questions.length]);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (option: string) => {
    if (isAnswered || !currentQ) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect = option.toLowerCase() === currentQ.correctAnswer.toLowerCase();

    // Spaced repetition update in background
    const prog = wordProgress[currentQ.word.id] || {
      wordId: currentQ.word.id,
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
    };

    if (isCorrect) {
      soundManager.playCorrect();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      // Streak multiplier: 1x, 1.5x (streak>=3), 2x (streak>=5)
      const multiplier = newStreak >= 5 ? 2.0 : newStreak >= 3 ? 1.5 : 1.0;
      const speedBonus = timeLeft > 10 ? 50 : timeLeft > 5 ? 25 : 0;
      const earnedPoints = Math.round((100 + speedBonus) * multiplier);

      setScore(prev => prev + earnedPoints);

      // Update word progress positively (good grade 3)
      const updated = calculateNextReview(prog, 3);
      onUpdateProgress({ ...wordProgress, [currentQ.word.id]: updated });
    } else {
      soundManager.playIncorrect();
      setStreak(0);
      setWrongWordIds(prev => [...prev, currentQ.word.id]);

      // Update word progress negatively (again grade 1)
      const updated = calculateNextReview(prog, 1);
      onUpdateProgress({ ...wordProgress, [currentQ.word.id]: updated });
    }
  };

  const handleNextQuestion = () => {
    soundManager.playClick();
    setShowHint(false);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(15);
    } else {
      // Quiz completed!
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setIsQuizFinished(true);
    const totalQ = questions.length;
    const correctCount = totalQ - wrongWordIds.length;
    const accuracy = Math.round((correctCount / totalQ) * 100);

    const earnedXp = Math.round(score * 0.25) + 30;
    const newStats: UserStats = {
      ...stats,
      xp: stats.xp + earnedXp,
      totalQuizzesTaken: stats.totalQuizzesTaken + 1,
      todayReviewedCount: stats.todayReviewedCount + totalQ,
    };

    // Check Badges: Bullseye Ace
    if (accuracy === 100 && !newStats.unlockedBadgeIds.includes('quiz_sharp_shooter')) {
      newStats.unlockedBadgeIds.push('quiz_sharp_shooter');
      confetti({ particleCount: 100, spread: 80 });
    }

    onUpdateStats(newStats);

    if (accuracy >= 80) {
      soundManager.playVictory();
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    } else {
      soundManager.playCorrect();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-slate-900/90 p-4 rounded-2xl border border-indigo-900/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">Interactive Quiz Arena</h2>
            <p className="text-[11px] text-slate-400">Timed challenges with dynamic multipliers</p>
          </div>
        </div>

        {/* Question length switcher */}
        {!isQuizFinished && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setQuestionCount(5)}
              className={`px-2.5 py-1 rounded-lg font-medium ${questionCount === 5 ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              5 Qs
            </button>
            <button
              onClick={() => setQuestionCount(10)}
              className={`px-2.5 py-1 rounded-lg font-medium ${questionCount === 10 ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              10 Qs
            </button>
            <button
              onClick={() => setQuestionCount(20)}
              className={`px-2.5 py-1 rounded-lg font-medium ${questionCount === 20 ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              All 20
            </button>
          </div>
        )}
      </div>

      {isQuizFinished ? (
        /* Results Screen */
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/80 p-6 sm:p-8 rounded-3xl border border-indigo-700/40 space-y-6 text-center shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-rose-500/20">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              Quiz Completed!
            </h3>
            <p className="text-slate-300 text-sm">
              Great workout! Your memory retention data has been synced to your Spaced Repetition deck.
            </p>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
              <span className="text-[11px] text-slate-400 block">Final Score</span>
              <span className="text-2xl font-black text-amber-300 font-['Outfit']">{score}</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
              <span className="text-[11px] text-slate-400 block">Accuracy</span>
              <span className="text-2xl font-black text-emerald-400 font-['Outfit']">
                {Math.round(((questions.length - wrongWordIds.length) / questions.length) * 100)}%
              </span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
              <span className="text-[11px] text-slate-400 block">Best Streak</span>
              <span className="text-2xl font-black text-rose-400 font-['Outfit'] flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 fill-rose-400" /> {maxStreak}x
              </span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
              <span className="text-[11px] text-slate-400 block">XP Gained</span>
              <span className="text-2xl font-black text-indigo-300 font-['Outfit']">
                +{Math.round(score * 0.25) + 30}
              </span>
            </div>
          </div>

          {/* Review Incorrect Words if any */}
          {wrongWordIds.length > 0 && (
            <div className="text-left bg-rose-950/30 p-4 rounded-2xl border border-rose-900/40 space-y-2">
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <X className="w-4 h-4" /> Words to Review ({wrongWordIds.length}):
              </span>
              <div className="flex flex-wrap gap-2">
                {wrongWordIds.map(wid => {
                  const w = VOCABULARY_WORDS.find(item => item.id === wid);
                  if (!w) return null;
                  return (
                    <span key={wid} className="px-3 py-1 rounded-xl bg-slate-900 border border-rose-800/60 text-xs font-semibold text-rose-200">
                      {w.word}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              onClick={() => generateQuestions(questionCount)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" /> Play Another Round
            </button>

            <button
              onClick={() => {
                if (onInitiateBattleWithScore) {
                  const accuracy = Math.round(((questions.length - wrongWordIds.length) / questions.length) * 100);
                  onInitiateBattleWithScore(score, accuracy);
                } else {
                  onNavigateTab('battle');
                }
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition hover:scale-105"
            >
              <Swords className="w-4 h-4" /> Challenge Friends With This Score
            </button>

            <button
              onClick={() => onNavigateTab('practice')}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition"
            >
              Review in Flashcards
            </button>
          </div>
        </div>
      ) : currentQ ? (
        /* Active Question Card */
        <div className="space-y-4">
          {/* Status Row */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2 font-medium">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span className="text-slate-600">•</span>
              <span className="capitalize text-indigo-400">{currentQ.type}</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Streak */}
              {streak > 1 && (
                <div className="flex items-center gap-1 font-bold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded-lg border border-orange-800">
                  <Flame className="w-3.5 h-3.5 fill-orange-400" />
                  <span>{streak}x Streak</span>
                  {streak >= 5 ? <span className="text-amber-300 text-[10px]">(2x Multiplier!)</span> : null}
                </div>
              )}

              {/* Timer Bar */}
              <div className="flex items-center gap-1.5 font-mono font-bold text-sm">
                <Timer className={`w-4 h-4 ${timeLeft <= 5 ? 'text-rose-400 animate-spin' : timeLeft <= 10 ? 'text-amber-400' : 'text-emerald-400'}`} />
                <span className={timeLeft <= 5 ? 'text-rose-400' : timeLeft <= 10 ? 'text-amber-300' : 'text-emerald-400'}>
                  {timeLeft}s
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Box */}
          <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-indigo-900/40 shadow-xl space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-400">
                  Select the best answer
                </span>
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 transition"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  {showHint ? 'Hide Hint' : 'Need a Hint?'}
                </button>
              </div>

              <p className="text-lg sm:text-xl font-bold text-white leading-relaxed whitespace-pre-line font-['Outfit']">
                {currentQ.prompt}
              </p>

              {showHint && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-bold">Mnemonic hint: </span>
                    {currentQ.hint}
                  </div>
                </div>
              )}
            </div>

            {/* Answer Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedOption === option;
                const isCorrect = option.toLowerCase() === currentQ.correctAnswer.toLowerCase();

                let btnStyle = 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-700 hover:border-slate-600';

                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-950/90 border-emerald-500 text-emerald-200 font-bold ring-2 ring-emerald-500/40';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-950/90 border-rose-500 text-rose-200 font-bold';
                  } else {
                    btnStyle = 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(option)}
                    disabled={isAnswered}
                    className={`p-4 rounded-2xl border-2 text-left font-semibold text-sm sm:text-base transition-all flex items-center justify-between group ${btnStyle}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-950/80 flex items-center justify-center text-xs font-mono text-slate-400 border border-slate-800">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                    </span>

                    {isAnswered && isCorrect && <Check className="w-5 h-5 text-emerald-400 shrink-0" />}
                    {isAnswered && isSelected && !isCorrect && <X className="w-5 h-5 text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Answer Feedback & Explanation Card */}
            {isAnswered && (
              <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-800/60 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-amber-300 text-lg font-['Outfit']">
                      {currentQ.word.word}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {currentQ.word.pronunciation}
                    </span>
                    <button
                      onClick={() => soundManager.speak(currentQ.word.word)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {currentQ.word.partOfSpeech}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-200">
                  {currentQ.word.definition}
                </p>

                <p className="text-xs text-emerald-300 italic bg-emerald-950/40 p-2 rounded-lg">
                  "{currentQ.word.exampleSentence}"
                </p>

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition hover:scale-102"
                  >
                    {currentIndex + 1 < questions.length ? (
                      <>Next Question <ChevronRight className="w-4 h-4" /></>
                    ) : (
                      <>View Results <Trophy className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
