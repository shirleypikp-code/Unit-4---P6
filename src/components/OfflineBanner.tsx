import React from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-800/80 px-4 py-2 text-xs text-amber-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Offline Mode Active:</strong> You can practice all 20 vocabulary words, take interactive quizzes, and review flashcards on the go without Wi-Fi! All data saves locally.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Local Storage Active</span>
        </div>
      </div>
    </div>
  );
};
