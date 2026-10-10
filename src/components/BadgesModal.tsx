import React from 'react';
import { Badge, UserStats, WordProgress } from '../types';
import { BADGES } from '../utils/storage';
import { soundManager } from '../utils/sound';
import {
  X,
  Award,
  Sparkles,
  CheckCircle2,
  Lock,
  Flame,
  Brain,
  Swords,
  Target
} from 'lucide-react';

interface BadgesModalProps {
  stats: UserStats;
  wordProgress: Record<string, WordProgress>;
  isOpen: boolean;
  onClose: () => void;
}

export const BadgesModal: React.FC<BadgesModalProps> = ({
  stats,
  wordProgress,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const unlockedCount = BADGES.filter(b => stats.unlockedBadgeIds.includes(b.id)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-indigo-700/60 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Award className="w-7 h-7 text-purple-400" />
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
              Vocabulary Badges & Medals
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Earn badges by maintaining daily streaks, advancing Leitner boxes, and winning word battles!
          </p>

          <div className="pt-2 flex items-center gap-3">
            <span className="text-xs font-bold text-amber-300">
              Unlocked: {unlockedCount} of {BADGES.length}
            </span>
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${(unlockedCount / BADGES.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {BADGES.map((badge) => {
            const isUnlocked = stats.unlockedBadgeIds.includes(badge.id);
            const curVal = badge.progress(stats, wordProgress);
            const pct = Math.min(100, Math.round((curVal / badge.target) * 100));

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border-2 transition-all space-y-2.5 ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-purple-950/60 to-slate-900 border-purple-600/80 shadow-md shadow-purple-950/40'
                    : 'bg-slate-950/60 border-slate-800 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 rounded-2xl bg-slate-800/80 border border-slate-700 block">
                      {badge.icon}
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base font-['Outfit']">
                        {badge.title}
                      </h4>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {badge.tier} Tier
                      </span>
                    </div>
                  </div>

                  {isUnlocked ? (
                    <span className="p-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="p-1 rounded-full bg-slate-800 text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300">
                  {badge.description}
                </p>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Progress</span>
                    <span>{curVal} / {badge.target}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isUnlocked ? 'bg-emerald-400' : 'bg-indigo-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
