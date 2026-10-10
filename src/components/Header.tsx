import React from 'react';
import { TabType, UserStats } from '../types';
import { calculateLevel } from '../utils/storage';
import { soundManager } from '../utils/sound';
import {
  Flame,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Sparkles,
  BookOpen,
  Award,
  Zap,
  Target,
  Swords,
  BarChart3,
  Trophy,
  BrainCircuit,
  Puzzle
} from 'lucide-react';

interface HeaderProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  stats: UserStats;
  onStatsChange: (stats: UserStats) => void;
  isOnline: boolean;
  onOpenBadges: () => void;
  dueCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  stats,
  onStatsChange,
  isOnline,
  onOpenBadges,
  dueCount
}) => {
  const { level, progress, nextLevelXp } = calculateLevel(stats.xp);

  const toggleSound = () => {
    const next = !stats.soundEnabled;
    soundManager.enabled = next;
    if (next) soundManager.playClick();
    onStatsChange({ ...stats, soundEnabled: next });
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'practice', label: 'SRS Flashcards', icon: <BrainCircuit className="w-4 h-4" />, badge: dueCount },
    { id: 'quiz', label: 'Quiz Arena', icon: <Target className="w-4 h-4" /> },
    { id: 'scramble', label: 'Spell Scramble', icon: <Puzzle className="w-4 h-4" /> },
    { id: 'context', label: 'Story Fill', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'battle', label: 'Word Battle', icon: <Swords className="w-4 h-4" /> },
    { id: 'insights', label: 'Progress Insights', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" /> },
    { id: 'dictionary', label: 'Word Vault', icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-indigo-900/40 shadow-lg transition-all">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Brand */}
        <div 
          onClick={() => { soundManager.playClick(); onTabChange('practice'); }}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 animate-pulse text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-200 bg-clip-text text-transparent font-['Outfit']">
                LexiQuest
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                SRS Arena
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Spaced Repetition & Word Battles
            </p>
          </div>
        </div>

        {/* Center/Right Stats Indicators */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Offline/Online Indicator */}
          <div 
            title={isOnline ? "Online: Battle sync and sharing active" : "Offline Mode: Everything saved safely to device"}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isOnline 
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' 
                : 'bg-amber-950/70 text-amber-300 border-amber-800/70 animate-pulse'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Offline Mode</span>
              </>
            )}
          </div>

          {/* Daily Streak */}
          <div 
            title={`${stats.currentStreak} day learning streak! Best: ${stats.bestStreak} days`}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-950/60 border border-orange-800/60 text-orange-300 text-xs font-bold shadow-sm"
          >
            <Flame className="w-4 h-4 text-orange-400 fill-orange-500 animate-bounce" />
            <span className="text-orange-200 font-black">{stats.currentStreak}</span>
            <span className="hidden sm:inline text-orange-400/80 font-normal">days</span>
          </div>

          {/* Level & XP */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-800/60 text-xs font-semibold text-indigo-200">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Lvl {level}</span>
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-rose-400 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }} 
              />
            </div>
            <span className="text-slate-400 text-[11px] font-mono">{stats.xp}/{nextLevelXp} XP</span>
          </div>

          {/* Badges Button */}
          <button
            onClick={() => { soundManager.playClick(); onOpenBadges(); }}
            title="View unlocked badges"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-800/60 text-purple-200 hover:bg-purple-900/60 transition-colors text-xs font-semibold"
          >
            <Award className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden sm:inline">Badges</span>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-700/60 text-[10px] text-purple-100 font-bold">
              {stats.unlockedBadgeIds.length}
            </span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={toggleSound}
            aria-label={stats.soundEnabled ? "Mute sound" : "Enable sound"}
            title={stats.soundEnabled ? "Mute Sound Effects" : "Enable Sound Effects"}
            className="p-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            {stats.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Scrollable Bar */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 overflow-x-auto no-scrollbar pb-1">
        <nav className="flex items-center gap-1 sm:gap-2 min-w-max py-1">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.playClick();
                  onTabChange(tab.id);
                }}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-amber-300 text-indigo-950' : 'bg-rose-500 text-white animate-pulse'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
