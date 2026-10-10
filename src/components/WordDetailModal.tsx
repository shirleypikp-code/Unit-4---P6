import React from 'react';
import { VocabularyWord, WordProgress } from '../types';
import { soundManager } from '../utils/sound';
import { formatTimeUntilDue } from '../utils/srs';
import {
  X,
  Volume2,
  Sparkles,
  Lightbulb,
  BookOpen,
  Info,
  Clock,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface WordDetailModalProps {
  word: VocabularyWord | null;
  progress?: WordProgress;
  onClose: () => void;
  onPracticeWord?: (word: VocabularyWord) => void;
}

export const WordDetailModal: React.FC<WordDetailModalProps> = ({
  word,
  progress,
  onClose,
  onPracticeWord
}) => {
  if (!word) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-indigo-700/60 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 pr-8">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-amber-200 font-['Outfit']">
              {word.word}
            </h2>
            <button
              onClick={() => soundManager.speak(word.word)}
              title="Pronounce Word"
              className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition hover:scale-110"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-indigo-300 font-bold">{word.pronunciation}</span>
            <span className="text-slate-600">•</span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase font-bold text-[10px]">
              {word.partOfSpeech}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-medium">{word.category}</span>
          </div>
        </div>

        {/* Spaced Repetition Level Badge */}
        {progress && (
          <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-300 font-semibold">Leitner Memory Box:</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-[11px]">
                Box {progress.box} of 5
              </span>
            </div>
            <span className="text-slate-400 font-mono">
              {formatTimeUntilDue(progress.nextReviewAt)}
            </span>
          </div>
        )}

        {/* Core Definitions */}
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Primary Meaning:
            </span>
            <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed">
              {word.definition}
            </p>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-indigo-900/40 space-y-1">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Plain English Explanation:
            </span>
            <p className="text-sm text-slate-300 italic">
              "{word.childFriendlyDefinition}"
            </p>
          </div>
        </div>

        {/* Example Sentences */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Examples in Context:
          </span>
          <div className="space-y-1.5">
            <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-900/40 text-xs sm:text-sm text-emerald-200">
              "{word.exampleSentence}"
            </div>
            {word.secondarySentence && (
              <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/30 text-xs sm:text-sm text-emerald-300/80">
                "{word.secondarySentence}"
              </div>
            )}
          </div>
        </div>

        {/* Mnemonic Hook */}
        <div className="bg-amber-950/30 p-3.5 rounded-2xl border border-amber-800/40 flex items-start gap-2.5 text-xs text-amber-200">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Memory Hook (Mnemonic): </span>
            {word.mnemonic}
          </div>
        </div>

        {/* Synonyms & Antonyms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {word.synonyms.length > 0 && (
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <span className="font-semibold text-slate-400 block">Synonyms:</span>
              <div className="flex flex-wrap gap-1">
                {word.synonyms.map(s => (
                  <span key={s} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {word.antonyms.length > 0 && (
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <span className="font-semibold text-slate-400 block">Antonyms:</span>
              <div className="flex flex-wrap gap-1">
                {word.antonyms.map(a => (
                  <span key={a} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fun Fact / Etymology */}
        {word.funFactOrContext && (
          <div className="bg-indigo-950/40 p-3 rounded-xl border border-indigo-900/40 text-xs text-indigo-200/90 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Etymology & Lore: </span>
              {word.funFactOrContext}
            </div>
          </div>
        )}

        {/* Close CTA */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
