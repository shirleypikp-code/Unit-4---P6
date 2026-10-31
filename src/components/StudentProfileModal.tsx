import React, { useState, useEffect } from 'react';
import { UserStats } from '../types';
import { soundManager } from '../utils/sound';
import { X, GraduationCap, User, CheckCircle2 } from 'lucide-react';

interface StudentProfileModalProps {
  stats: UserStats;
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (name: string, className: string, avatar: string) => void;
}

const AVATAR_OPTIONS = ['🚀', '🦊', '🦉', '🐯', '🐼', '🦁', '🦄', '🐨', '🐬', '🦋', '🐉', '🌟'];

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  stats,
  isOpen,
  onClose,
  onSaveProfile
}) => {
  const [name, setName] = useState(stats.studentName || '');
  const [studentClass, setStudentClass] = useState(stats.studentClass || '');
  const [avatar, setAvatar] = useState(stats.studentAvatar || '🚀');

  useEffect(() => {
    if (isOpen) {
      setName(stats.studentName || '');
      setStudentClass(stats.studentClass || '');
      setAvatar(stats.studentAvatar || '🚀');
    }
  }, [isOpen, stats.studentName, stats.studentClass, stats.studentAvatar]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playCorrect();
    onSaveProfile(name.trim(), studentClass.trim(), avatar);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-indigo-700/60 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close student profile modal"
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1.5 pr-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-black text-white font-['Outfit']">
              Student Pass
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Enter your name and class so your progress reports, quiz results, and leaderboard rank show who you are!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Choose Your Emblem
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setAvatar(emoji);
                  }}
                  className={`h-11 rounded-xl text-xl flex items-center justify-center border transition-all ${
                    avatar === emoji
                      ? 'bg-indigo-600/40 border-indigo-400 scale-105 shadow-md'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Student Name Input */}
          <div className="space-y-1.5">
            <label htmlFor="student-name-input" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" /> Student Name
            </label>
            <input
              id="student-name-input"
              type="text"
              required
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chloe Tan"
              className="w-full bg-slate-950 px-4 py-3 rounded-xl border border-slate-700 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Student Class Input */}
          <div className="space-y-1.5">
            <label htmlFor="student-class-input" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" /> Class / Grade
            </label>
            <input
              id="student-class-input"
              type="text"
              required
              maxLength={24}
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              placeholder="e.g. Primary 5A / Grade 6B"
              className="w-full bg-slate-950 px-4 py-3 rounded-xl border border-slate-700 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Preview Banner */}
          {(name.trim() || studentClass.trim()) && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl shrink-0">{avatar}</span>
                <div className="truncate">
                  <span className="font-bold text-white block truncate">
                    {name.trim() || 'Student Name'}
                  </span>
                  <span className="text-slate-400">
                    Class: {studentClass.trim() || '—'} · {stats.xp} XP
                  </span>
                </div>
              </div>
              <span className="text-emerald-400 font-semibold shrink-0">Ready</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            {stats.studentName && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!name.trim() || !studentClass.trim()}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition"
            >
              <CheckCircle2 className="w-4 h-4" /> Save Student Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
