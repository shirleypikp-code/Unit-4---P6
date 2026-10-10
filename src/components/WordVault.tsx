import React, { useState } from 'react';
import { VocabularyWord, WordProgress, UserStats, TabType } from '../types';
import { VOCABULARY_WORDS, CATEGORIES } from '../data/vocabulary';
import { soundManager } from '../utils/sound';
import { formatTimeUntilDue } from '../utils/srs';
import {
  Search,
  Volume2,
  Sparkles,
  Layers,
  ChevronRight,
  Filter,
  CheckCircle2,
  BrainCircuit,
  Lightbulb
} from 'lucide-react';

interface WordVaultProps {
  wordProgress: Record<string, WordProgress>;
  stats: UserStats;
  onSelectWord: (word: VocabularyWord) => void;
  onNavigateTab: (tab: TabType) => void;
}

export const WordVault: React.FC<WordVaultProps> = ({
  wordProgress,
  stats,
  onSelectWord,
  onNavigateTab
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredWords = VOCABULARY_WORDS.filter(w => {
    const matchesSearch =
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.childFriendlyDefinition.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || w.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/40 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> Complete 20-Word Vault
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Study pronunciation, etymology, mnemonics, and real context sentences for all target words.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('practice')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
        >
          <BrainCircuit className="w-4 h-4" /> Start SRS Review
        </button>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search words, definitions, or meanings..."
            className="w-full bg-slate-900/90 pl-10 pr-4 py-2.5 rounded-2xl border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Words Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredWords.map(word => {
          const prog = wordProgress[word.id] || {
            box: 1,
            repetitionCount: 0,
            masteryScore: 0,
            nextReviewAt: new Date().toISOString()
          };

          return (
            <div
              key={word.id}
              onClick={() => {
                soundManager.playClick();
                onSelectWord(word);
              }}
              className="cursor-pointer bg-slate-900/90 hover:bg-slate-850 p-5 rounded-2xl border border-slate-800 hover:border-indigo-600 transition-all duration-200 shadow-lg space-y-3 group"
            >
              {/* Word Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white group-hover:text-amber-300 transition-colors font-['Outfit']">
                      {word.word}
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundManager.speak(word.word);
                      }}
                      className="p-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-indigo-400 font-mono">{word.pronunciation}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 font-medium">{word.partOfSpeech}</span>
                  </div>
                </div>

                {/* Box Badge */}
                <div className="text-right">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    prog.box >= 4
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : prog.box >= 2
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    Leitner Box {prog.box}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {formatTimeUntilDue(prog.nextReviewAt)}
                  </span>
                </div>
              </div>

              {/* Definitions */}
              <p className="text-xs sm:text-sm text-slate-200 font-medium line-clamp-2">
                {word.definition}
              </p>

              {/* Sentence snippet */}
              <p className="text-xs text-emerald-300/90 italic bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-900/30 line-clamp-2">
                "{word.exampleSentence}"
              </p>

              {/* Mnemonic and Action */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                <span className="text-amber-300/90 text-[11px] flex items-center gap-1 truncate max-w-[280px]">
                  <Lightbulb className="w-3 h-3 shrink-0 text-amber-400" />
                  {word.mnemonic}
                </span>

                <span className="text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1 font-semibold text-xs shrink-0">
                  Inspect <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
