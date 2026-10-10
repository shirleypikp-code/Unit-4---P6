import React, { useState } from 'react';
import { LeaderboardUser, UserStats, TabType } from '../types';
import { soundManager } from '../utils/sound';
import {
  Trophy,
  Flame,
  Crown,
  Medal,
  Swords,
  Sparkles,
  Users,
  Shield,
  Zap,
  ArrowUp
} from 'lucide-react';

interface LeaderboardViewProps {
  leaderboard: LeaderboardUser[];
  stats: UserStats;
  onNavigateTab: (tab: TabType) => void;
  onChallengeRival: (rivalName: string) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  leaderboard,
  stats,
  onNavigateTab,
  onChallengeRival
}) => {
  const [activeLeague, setActiveLeague] = useState<'all' | 'weekly'>('all');

  // Insert current user with real dynamic stats and sort
  const allUsers: LeaderboardUser[] = [
    ...leaderboard.filter(u => !u.isCurrentUser),
    {
      id: 'current_user',
      name: 'You (Champion)',
      avatar: '🚀',
      xp: stats.xp,
      streak: stats.currentStreak,
      wordsMastered: stats.totalWordsLearned,
      badge: stats.xp > 2000 ? 'Diamond Master' : stats.xp > 1000 ? 'Gold Scholar' : 'Silver Ace',
      isCurrentUser: true,
    }
  ].sort((a, b) => b.xp - a.xp);

  const top3 = allUsers.slice(0, 3);
  const remaining = allUsers.slice(3);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-amber-700/40 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
              Competitive League Arena
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Climb the ranks by reviewing spaced repetition flashcards, scoring in quizzes, and winning word battles!
          </p>
        </div>

        {/* League Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveLeague('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeLeague === 'all' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            All-Time Masters
          </button>
          <button
            onClick={() => setActiveLeague('weekly')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeLeague === 'weekly' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Weekly Sprint
          </button>
        </div>
      </div>

      {/* Top 3 Podium Display */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 max-w-2xl mx-auto items-end">
        {/* 2nd Place */}
        {top3[1] && (
          <div className="bg-slate-900/90 rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-slate-700 text-center space-y-2 order-1 shadow-lg relative">
            <div className="w-8 h-8 mx-auto -mt-6 rounded-full bg-slate-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md border-2 border-white">
              2
            </div>
            <span className="text-3xl sm:text-4xl block">{top3[1].avatar}</span>
            <div className="space-y-0.5">
              <h4 className="font-bold text-white text-xs sm:text-sm truncate">
                {top3[1].name}
              </h4>
              <span className="text-[10px] text-slate-400 block">{top3[1].badge}</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-amber-300 font-mono">
              {top3[1].xp} XP
            </div>
          </div>
        )}

        {/* 1st Place */}
        {top3[0] && (
          <div className="bg-gradient-to-b from-amber-950/90 via-slate-900 to-indigo-950 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-amber-500 text-center space-y-2.5 order-2 shadow-2xl relative -translate-y-2">
            <Crown className="w-7 h-7 text-amber-400 mx-auto -mt-8 animate-bounce fill-amber-400" />
            <div className="w-8 h-8 mx-auto rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md border-2 border-amber-200">
              1
            </div>
            <span className="text-4xl sm:text-5xl block">{top3[0].avatar}</span>
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-white text-sm sm:text-base truncate font-['Outfit']">
                {top3[0].name}
              </h4>
              <span className="text-xs text-amber-300 font-semibold block">{top3[0].badge}</span>
            </div>
            <div className="text-sm sm:text-base font-black text-amber-300 font-mono">
              {top3[0].xp} XP
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {top3[2] && (
          <div className="bg-slate-900/90 rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-slate-700 text-center space-y-2 order-3 shadow-lg relative">
            <div className="w-8 h-8 mx-auto -mt-6 rounded-full bg-amber-700 text-white font-black flex items-center justify-center text-xs shadow-md border-2 border-amber-400">
              3
            </div>
            <span className="text-3xl sm:text-4xl block">{top3[2].avatar}</span>
            <div className="space-y-0.5">
              <h4 className="font-bold text-white text-xs sm:text-sm truncate">
                {top3[2].name}
              </h4>
              <span className="text-[10px] text-slate-400 block">{top3[2].badge}</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-amber-300 font-mono">
              {top3[2].xp} XP
            </div>
          </div>
        )}
      </div>

      {/* Full Leaderboard Table */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Leaderboard Rankings
          </span>
          <span className="text-xs text-slate-400">Updated in real-time</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {allUsers.map((user, index) => {
            const rank = index + 1;
            const isMe = user.isCurrentUser;

            return (
              <div
                key={user.id}
                className={`px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 transition-colors ${
                  isMe
                    ? 'bg-indigo-950/70 border-l-4 border-l-rose-500'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                {/* Rank & User Info */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <span className={`w-7 text-center font-black text-sm ${
                    rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-slate-300' : rank === 3 ? 'text-amber-600' : 'text-slate-500'
                  }`}>
                    #{rank}
                  </span>

                  <span className="text-2xl sm:text-3xl shrink-0">{user.avatar}</span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm sm:text-base truncate ${isMe ? 'text-rose-300 font-extrabold' : 'text-white'}`}>
                        {user.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-900 text-rose-200 font-bold uppercase">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 truncate block">
                      {user.badge}
                    </span>
                  </div>
                </div>

                {/* Stats & Actions */}
                <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                  {/* Streak */}
                  <div className="flex items-center gap-1 text-xs font-bold text-orange-400">
                    <Flame className="w-3.5 h-3.5 fill-orange-400" />
                    <span>{user.streak}d</span>
                  </div>

                  {/* XP */}
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm sm:text-base text-amber-300">
                      {user.xp}
                    </span>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">XP</span>
                  </div>

                  {/* Challenge Button (only for rivals) */}
                  {!isMe ? (
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        onChallengeRival(user.name);
                        onNavigateTab('battle');
                      }}
                      title={`Challenge ${user.name} to a Word Battle!`}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition shadow-sm"
                    >
                      <Swords className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="w-8" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
