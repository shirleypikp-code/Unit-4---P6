import React, { useState, useEffect, useRef } from 'react';
import { VocabularyWord, WordProgress, UserStats, BattleChallenge } from '../types';
import { VOCABULARY_WORDS } from '../data/vocabulary';
import { soundManager } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Swords,
  Share2,
  Copy,
  Check,
  Shield,
  Zap,
  Flame,
  Trophy,
  Users,
  Timer,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface WordBattleProps {
  wordProgress: Record<string, WordProgress>;
  onUpdateProgress: (newProgress: Record<string, WordProgress>) => void;
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  initialScoreToChallenge?: number | null;
}

interface RivalProfile {
  name: string;
  avatar: string;
  title: string;
  reactionSpeedMs: number;
  accuracy: number;
}

const RIVALS: RivalProfile[] = [
  { name: 'Aria the Lexicon Knight', avatar: '🦊', title: 'Top League Champion', reactionSpeedMs: 3500, accuracy: 0.85 },
  { name: 'Leo Vocabulary Ace', avatar: '🦁', title: 'Speed Demon', reactionSpeedMs: 2800, accuracy: 0.75 },
  { name: 'Professor Hoot', avatar: '🦉', title: 'Etymology Master', reactionSpeedMs: 4000, accuracy: 0.95 },
];

export const WordBattle: React.FC<WordBattleProps> = ({
  wordProgress,
  onUpdateProgress,
  stats,
  onUpdateStats,
  initialScoreToChallenge
}) => {
  const [battleState, setBattleState] = useState<'lobby' | 'dueling' | 'results'>('lobby');
  const [selectedRival, setSelectedRival] = useState<RivalProfile>(RIVALS[0]);
  const [roundNumber, setRoundNumber] = useState(1);
  const totalRounds = 5;

  // Battle state
  const [playerHp, setPlayerHp] = useState(100);
  const [rivalHp, setRivalHp] = useState(100);
  const [playerScore, setPlayerScore] = useState(0);
  const [rivalScore, setRivalScore] = useState(0);

  // Active question in duel
  const [currentRoundWord, setCurrentRoundWord] = useState<VocabularyWord>(VOCABULARY_WORDS[0]);
  const [roundOptions, setRoundOptions] = useState<string[]>([]);
  const [answeredByPlayer, setAnsweredByPlayer] = useState(false);
  const [selectedPlayerOption, setSelectedPlayerOption] = useState<string | null>(null);
  const [rivalStatusText, setRivalStatusText] = useState<string>('Thinking...');
  const [roundTimeLeft, setRoundTimeLeft] = useState(10);

  // Social sharing state
  const [copiedLink, setCopiedLink] = useState(false);
  const [customChallengeCode, setCustomChallengeCode] = useState('LQ-BATTLE-8492');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [challengeScore, setChallengeScore] = useState<number>(initialScoreToChallenge || 720);

  const duelTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rivalTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Start new duel round
  const startRound = (roundIdx: number) => {
    // Pick word
    const shuffled = [...VOCABULARY_WORDS].sort(() => 0.5 - Math.random());
    const word = shuffled[roundIdx % shuffled.length];
    setCurrentRoundWord(word);

    // Pick 3 distractors
    const distractors = VOCABULARY_WORDS
      .filter(w => w.id !== word.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => w.word);

    setRoundOptions([word.word, ...distractors].sort(() => 0.5 - Math.random()));
    setAnsweredByPlayer(false);
    setSelectedPlayerOption(null);
    setRoundTimeLeft(10);
    setRivalStatusText(`${selectedRival.name} is reading...`);

    // Schedule rival action
    const rivalDelay = selectedRival.reactionSpeedMs + Math.random() * 1500;
    rivalTimerRef.current = setTimeout(() => {
      handleRivalMove(word);
    }, rivalDelay);
  };

  const handleRivalMove = (word: VocabularyWord) => {
    const isRivalCorrect = Math.random() <= selectedRival.accuracy;
    if (isRivalCorrect) {
      setRivalStatusText(`${selectedRival.name} answered correctly!`);
      setRivalScore(prev => prev + 150);
      setPlayerHp(prev => Math.max(0, prev - 20));
    } else {
      setRivalStatusText(`${selectedRival.name} hesitated and missed!`);
    }
  };

  // Start duel
  const handleStartDuel = () => {
    soundManager.playClick();
    setBattleState('dueling');
    setRoundNumber(1);
    setPlayerHp(100);
    setRivalHp(100);
    setPlayerScore(0);
    setRivalScore(0);
    startRound(0);
  };

  // Player picks an option
  const handlePlayerAnswer = (option: string) => {
    if (answeredByPlayer) return;
    setAnsweredByPlayer(true);
    setSelectedPlayerOption(option);

    const isCorrect = option.toLowerCase() === currentRoundWord.word.toLowerCase();
    if (isCorrect) {
      soundManager.playCorrect();
      const points = 150 + roundTimeLeft * 10;
      setPlayerScore(prev => prev + points);
      setRivalHp(prev => Math.max(0, prev - 25));
    } else {
      soundManager.playIncorrect();
      setPlayerHp(prev => Math.max(0, prev - 15));
    }

    // Auto advance after short pause
    setTimeout(() => {
      if (roundNumber < totalRounds && playerHp > 0 && rivalHp > 0) {
        setRoundNumber(prev => prev + 1);
        startRound(roundNumber);
      } else {
        finishBattle();
      }
    }, 1800);
  };

  // Round countdown
  useEffect(() => {
    if (battleState !== 'dueling' || answeredByPlayer) return;

    duelTimerRef.current = setInterval(() => {
      setRoundTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(duelTimerRef.current!);
          handlePlayerAnswer(''); // Timed out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (duelTimerRef.current) clearInterval(duelTimerRef.current);
      if (rivalTimerRef.current) clearTimeout(rivalTimerRef.current);
    };
  }, [battleState, roundNumber, answeredByPlayer]);

  const finishBattle = () => {
    if (duelTimerRef.current) clearInterval(duelTimerRef.current);
    if (rivalTimerRef.current) clearTimeout(rivalTimerRef.current);

    setBattleState('results');
    const isWin = playerScore >= rivalScore || rivalHp <= 0;

    const earnedXp = isWin ? 120 : 40;
    const newStats: UserStats = {
      ...stats,
      xp: stats.xp + earnedXp,
      battlesWon: stats.battlesWon + (isWin ? 1 : 0),
    };

    if (isWin && !newStats.unlockedBadgeIds.includes('duel_warrior')) {
      newStats.unlockedBadgeIds.push('duel_warrior');
    }
    if (newStats.battlesWon >= 3 && !newStats.unlockedBadgeIds.includes('duel_champion')) {
      newStats.unlockedBadgeIds.push('duel_champion');
      confetti({ particleCount: 100, spread: 70 });
    }

    onUpdateStats(newStats);

    if (isWin) {
      soundManager.playVictory();
      confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
    } else {
      soundManager.playIncorrect();
    }
  };

  // Social Share Action
  const handleShareChallenge = async () => {
    soundManager.playClick();
    const shareText = `⚔️ I scored ${challengeScore} pts in a LexiQuest Vocabulary Battle! Can you beat me on the 20 target words? Challenge Code: ${customChallengeCode}`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LexiQuest Word Battle Challenge',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Lobby View */}
      {battleState === 'lobby' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-indigo-950/80 p-6 rounded-3xl border border-rose-800/40 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Swords className="w-6 h-6 text-rose-400" />
                <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                  Vocabulary Word Battle Arena
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                Duel live against AI champions or share challenge codes with your classmates & friends!
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/70 border border-rose-900/60 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-rose-300">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Victories: {stats.battlesWon}</span>
            </div>
          </div>

          {/* Social Share & Challenge Friends Card */}
          <div className="bg-slate-900/90 rounded-3xl p-6 border-2 border-indigo-700/50 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base sm:text-lg font-bold text-white">Challenge Friends</h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                Social Multi-Player
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300">
              Send your battle code to friends. When they enter your code or click your link, they duel against your high score in real time!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Challenge link creator */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-400 block">Your Challenge Code:</span>
                <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-indigo-900/60 font-mono text-base font-bold text-amber-300">
                  <span>{customChallengeCode}</span>
                  <span className="text-xs text-indigo-400 font-sans font-normal">Score: {challengeScore}</span>
                </div>

                <button
                  onClick={handleShareChallenge}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" /> Challenge Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" /> Share Challenge Link / Card
                    </>
                  )}
                </button>
              </div>

              {/* Enter friend's code */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-400 block">Have a friend’s code?</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. LQ-BATTLE-1234"
                    className="flex-1 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => {
                      if (!joinCodeInput.trim()) return;
                      soundManager.playClick();
                      // Start duel customized with friend's banner
                      setSelectedRival({
                        name: `Friend (${joinCodeInput})`,
                        avatar: '🎮',
                        title: 'Peer Challenger',
                        reactionSpeedMs: 3200,
                        accuracy: 0.8
                      });
                      handleStartDuel();
                    }}
                    disabled={!joinCodeInput.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs"
                  >
                    Duel!
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Compete directly to beat their recorded round times and accuracy!
                </p>
              </div>
            </div>
          </div>

          {/* Instant Duel against Arena Champions */}
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> Choose Your Arena Challenger
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {RIVALS.map((rival) => {
                const isSelected = selectedRival.name === rival.name;
                return (
                  <div
                    key={rival.name}
                    onClick={() => { soundManager.playClick(); setSelectedRival(rival); }}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all space-y-2 ${
                      isSelected
                        ? 'bg-rose-950/60 border-rose-500 shadow-md shadow-rose-950/50'
                        : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{rival.avatar}</span>
                      <div>
                        <h4 className="font-bold text-white text-sm">{rival.name}</h4>
                        <span className="text-[11px] text-slate-400">{rival.title}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-700/60">
                      <span>Speed: {rival.reactionSpeedMs / 1000}s</span>
                      <span>Skill: {Math.round(rival.accuracy * 100)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center pt-2">
              <button
                onClick={handleStartDuel}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-amber-600 to-indigo-600 hover:scale-105 text-white font-extrabold text-base shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 mx-auto"
              >
                <Play className="w-5 h-5" /> Enter Battle Arena Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dueling Active View */}
      {battleState === 'dueling' && (
        <div className="space-y-4">
          {/* Health & Score Header */}
          <div className="grid grid-cols-2 gap-4 bg-slate-900/90 p-4 rounded-3xl border border-indigo-900/50 shadow-xl">
            {/* Player Side */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  <span className="text-lg">🚀</span> You
                </span>
                <span className="font-mono text-xs font-bold text-amber-300">{playerScore} pts</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${playerHp}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400">HP: {playerHp}%</span>
            </div>

            {/* Rival Side */}
            <div className="space-y-1.5 text-right">
              <div className="flex items-center justify-between flex-row-reverse">
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  {selectedRival.name} <span className="text-lg">{selectedRival.avatar}</span>
                </span>
                <span className="font-mono text-xs font-bold text-rose-300">{rivalScore} pts</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-300 ml-auto"
                  style={{ width: `${rivalHp}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400">HP: {rivalHp}%</span>
            </div>
          </div>

          {/* Round Indicator & Timer */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span className="font-bold text-slate-300">
              Round {roundNumber} of {totalRounds}
            </span>
            <div className="flex items-center gap-1 font-mono font-bold text-amber-300">
              <Timer className="w-4 h-4" />
              <span>{roundTimeLeft}s</span>
            </div>
            <span className="italic text-indigo-300 text-[11px]">{rivalStatusText}</span>
          </div>

          {/* Duel Question Box */}
          <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-rose-900/40 shadow-2xl space-y-6">
            <div className="space-y-2 text-center">
              <span className="text-xs uppercase tracking-widest font-bold text-rose-400">
                Define the Target Word
              </span>
              <p className="text-lg sm:text-xl font-bold text-white font-['Outfit']">
                "{currentRoundWord.definition}"
              </p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {roundOptions.map((opt, idx) => {
                const isSelected = selectedPlayerOption === opt;
                const isCorrect = opt.toLowerCase() === currentRoundWord.word.toLowerCase();

                let style = 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700';

                if (answeredByPlayer) {
                  if (isCorrect) {
                    style = 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold';
                  } else if (isSelected) {
                    style = 'bg-rose-950 border-rose-500 text-rose-200 font-bold';
                  } else {
                    style = 'bg-slate-900 border-slate-800 text-slate-500 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handlePlayerAnswer(opt)}
                    disabled={answeredByPlayer}
                    className={`p-4 rounded-2xl border-2 font-bold text-sm sm:text-base font-['Outfit'] transition-all ${style}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Results View */}
      {battleState === 'results' && (
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/80 p-8 rounded-3xl border border-indigo-700/40 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-xl">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              {playerScore >= rivalScore ? 'Victory! You Won the Duel!' : 'Battle Concluded!'}
            </h3>
            <p className="text-slate-300 text-sm">
              {playerScore >= rivalScore
                ? `You defeated ${selectedRival.name} with brilliant vocabulary recall!`
                : `${selectedRival.name} put up a fierce fight. Review your words and challenge again!`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
              <span className="text-xs text-slate-400 block">Your Score</span>
              <span className="text-2xl font-black text-amber-300 font-['Outfit']">{playerScore}</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
              <span className="text-xs text-slate-400 block">Rival Score</span>
              <span className="text-2xl font-black text-rose-300 font-['Outfit']">{rivalScore}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleStartDuel}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" /> Rematch
            </button>

            <button
              onClick={handleShareChallenge}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition"
            >
              <Share2 className="w-4 h-4" /> Share Challenge
            </button>

            <button
              onClick={() => setBattleState('lobby')}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition"
            >
              Back to Battle Hub
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
