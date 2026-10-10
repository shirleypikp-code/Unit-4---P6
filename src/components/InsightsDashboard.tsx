import React from 'react';
import { WordProgress, UserStats, VocabularyWord, TabType } from '../types';
import { VOCABULARY_WORDS } from '../data/vocabulary';
import { soundManager } from '../utils/sound';
import {
  BarChart3,
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Flame,
  Zap,
  ArrowRight,
  HardDrive
} from 'lucide-react';

interface InsightsDashboardProps {
  wordProgress: Record<string, WordProgress>;
  stats: UserStats;
  onNavigateTab: (tab: TabType) => void;
  onSelectWordDetail: (word: VocabularyWord) => void;
}

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({
  wordProgress,
  stats,
  onNavigateTab,
  onSelectWordDetail
}) => {
  // Aggregate box counts
  const boxCounts = [0, 0, 0, 0, 0]; // index 0..4 = box 1..5
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalMasteryScore = 0;

  VOCABULARY_WORDS.forEach(w => {
    const p = wordProgress[w.id];
    if (p) {
      const bIdx = Math.max(0, Math.min(4, p.box - 1));
      boxCounts[bIdx] += 1;
      totalCorrect += p.timesCorrect;
      totalIncorrect += p.timesIncorrect;
      totalMasteryScore += p.masteryScore;
    } else {
      boxCounts[0] += 1;
    }
  });

  const overallMasteryPct = Math.round(totalMasteryScore / VOCABULARY_WORDS.length);
  const totalAttempts = totalCorrect + totalIncorrect;
  const accuracyPct = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 100;

  // Find tricky words (Box 1 or highest error count)
  const trickyWords = [...VOCABULARY_WORDS]
    .map(w => {
      const prog = wordProgress[w.id] || { box: 1, timesIncorrect: 0, timesCorrect: 0, masteryScore: 0 };
      return { word: w, prog };
    })
    .sort((a, b) => {
      // Prioritize low box and high incorrect
      if (a.prog.box !== b.prog.box) return a.prog.box - b.prog.box;
      return b.prog.timesIncorrect - a.prog.timesIncorrect;
    })
    .slice(0, 4);

  // Box color styling
  const boxColors = [
    { label: 'Box 1: Learning', color: 'bg-rose-500', text: 'text-rose-400', desc: '1 Day Review' },
    { label: 'Box 2: Emerging', color: 'bg-amber-500', text: 'text-amber-400', desc: '3 Days Review' },
    { label: 'Box 3: Familiar', color: 'bg-yellow-500', text: 'text-yellow-400', desc: '7 Days Review' },
    { label: 'Box 4: Retained', color: 'bg-blue-500', text: 'text-blue-400', desc: '14 Days Review' },
    { label: 'Box 5: Mastered', color: 'bg-emerald-500', text: 'text-emerald-400', desc: 'Permanent Recall' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-6 rounded-3xl border border-indigo-800/40 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
              Personalized Progress & Memory Curve
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Neuroscience-backed spaced repetition diagnostics for your 20 target vocabulary words
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/70 border border-indigo-800/60 px-4 py-2 rounded-2xl">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-300">
            Local & Offline Synced
          </span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Overall Mastery
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-300 font-['Outfit']">
              {overallMasteryPct}%
            </span>
            <span className="text-xs text-slate-500">of 20 words</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
              style={{ width: `${overallMasteryPct}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Quiz Accuracy
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-['Outfit']">
              {accuracyPct}%
            </span>
            <span className="text-xs text-slate-500">{totalCorrect}/{totalAttempts}</span>
          </div>
          <span className="text-[10px] text-slate-400 block pt-1">
            {totalAttempts === 0 ? 'No quizzes taken yet' : 'Total recall trials'}
          </span>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" /> Active Streak
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-orange-300 font-['Outfit']">
              {stats.currentStreak}
            </span>
            <span className="text-xs text-slate-500">days</span>
          </div>
          <span className="text-[10px] text-orange-400/80 block pt-1">
            Best: {stats.bestStreak} days
          </span>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-purple-400" /> Total XP
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-300 font-['Outfit']">
              {stats.xp}
            </span>
            <span className="text-xs text-slate-500">XP</span>
          </div>
          <span className="text-[10px] text-purple-300/80 block pt-1">
            Level {stats.level} Scholar
          </span>
        </div>
      </div>

      {/* Spaced Repetition Leitner Box Distribution */}
      <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" /> Leitner Memory Distribution
            </h3>
            <p className="text-xs text-slate-400">
              Words advance to higher boxes as your long-term memory strengthens
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-indigo-300">
            20 Words Total
          </span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="w-full h-4 bg-slate-950 rounded-xl overflow-hidden flex p-0.5 gap-0.5 border border-slate-800">
          {boxCounts.map((count, idx) => {
            if (count === 0) return null;
            const pct = (count / 20) * 100;
            return (
              <div
                key={idx}
                title={`${boxColors[idx].label}: ${count} words (${Math.round(pct)}%)`}
                className={`h-full ${boxColors[idx].color} rounded-sm transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>

        {/* Breakdown Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
          {boxColors.map((box, idx) => (
            <div
              key={idx}
              className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-center space-y-1"
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${box.color}`} />
                <span className="text-xs font-bold text-white">Box {idx + 1}</span>
              </div>
              <span className={`text-xl font-extrabold ${box.text}`}>
                {boxCounts[idx]}
              </span>
              <span className="text-[10px] text-slate-400 block">{box.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Personalized Daily Prescription */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 rounded-3xl p-6 border border-amber-800/40 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">Today's Personalized Recommendation</h3>
        </div>

        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
          {boxCounts[0] > 0 ? (
            <>
              You have <strong className="text-amber-300">{boxCounts[0]} words in Box 1</strong> that need review to consolidate memory pathways. Spend 5 minutes on the <strong>Flashcards</strong> or try <strong>Spell Scramble</strong> to cement spelling!
            </>
          ) : (
            <>
              Spectacular work! All 20 words have graduated past initial learning! Jump into a <strong>Word Battle</strong> to test your lightning-fast recall under pressure!
            </>
          )}
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => onNavigateTab('practice')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
          >
            Review Flashcards <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigateTab('quiz')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
          >
            Take 10-Q Quiz
          </button>
        </div>
      </div>

      {/* Tricky Words Radar */}
      <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" /> Words Needing Focus
          </h3>
          <span className="text-xs text-slate-400">Click any word for deep dive</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {trickyWords.map(({ word, prog }) => (
            <div
              key={word.id}
              onClick={() => {
                soundManager.playClick();
                onSelectWordDetail(word);
              }}
              className="cursor-pointer bg-slate-950/70 hover:bg-slate-800/80 p-4 rounded-2xl border border-slate-800 hover:border-indigo-600 transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-white text-base group-hover:text-amber-300 transition-colors font-['Outfit']">
                    {word.word}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">{word.pronunciation}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-rose-300 font-bold">
                    Box {prog.box}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {prog.timesIncorrect} errors
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2">
                {word.definition}
              </p>

              <div className="text-[11px] text-amber-300/90 italic pt-1 border-t border-slate-800">
                Tip: {word.mnemonic}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
