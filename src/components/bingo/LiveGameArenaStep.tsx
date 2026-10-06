import React, { useState, useEffect } from 'react';
import { BetesebRoom, BingoCard, LiveReaction } from '../../types/bingo';
import { generateCartela, evaluateBingo, getAmharicLetterAndNumber } from '../../utils/bingoLogic';
import { soundEffects } from '../../utils/bingoAudio';
import { BallCaller } from './BallCaller';
import { BingoCardView } from './BingoCardView';
import confetti from 'canvas-confetti';
import {
  Trophy,
  ArrowLeft,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Flame,
  Zap,
  Users,
  HelpCircle,
  X,
  Sparkles,
} from 'lucide-react';

interface LiveGameArenaStepProps {
  room: BetesebRoom;
  userId: string;
  userName: string;
  cartelaNumbers: number[];
  onLeaveRoom: () => void;
  onClaimBingo: (cartelaNumber: number) => void;
}

export const LiveGameArenaStep: React.FC<LiveGameArenaStepProps> = ({
  room,
  userId,
  userName,
  cartelaNumbers,
  onLeaveRoom,
  onClaimBingo,
}) => {
  // Support multiple cards
  const [cards, setCards] = useState<BingoCard[]>(() =>
    cartelaNumbers.map((num) => generateCartela(num))
  );

  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [autoDaub, setAutoDaub] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [confettiFired, setConfettiFired] = useState(false);
  const [showPatternGuide, setShowPatternGuide] = useState(false);
  const [reactions, setReactions] = useState<LiveReaction[]>([]);
  const [oneAwayNotified, setOneAwayNotified] = useState(false);

  // Sync sound settings with audio engine
  useEffect(() => {
    soundEffects.soundEnabled = soundEnabled;
    soundEffects.voiceEnabled = voiceEnabled;
  }, [soundEnabled, voiceEnabled]);

  // Handle new balls drawn
  useEffect(() => {
    if (!room.drawnBalls || room.drawnBalls.length === 0) return;

    if (room.currentBall) {
      const info = getAmharicLetterAndNumber(room.currentBall);
      soundEffects.playBallCall(info.letter, room.currentBall);
    }

    setCards((prevCards) => {
      const drawnSet = new Set(room.drawnBalls);
      let anyOneAway = false;

      const updated = prevCards.map((c) => {
        const newMarked = c.grid.map((row, r) =>
          row.map((val, col) => {
            if (r === 2 && col === 2) return true; // FREE
            if (autoDaub && val > 0 && drawnSet.has(val)) return true;
            return c.marked[r][col];
          })
        );

        const updatedCard = { ...c, marked: newMarked };
        const evalRes = evaluateBingo(updatedCard);
        updatedCard.hasBingo = evalRes.hasBingo;
        updatedCard.oneAway = evalRes.oneAway;
        updatedCard.markedCount = evalRes.markedCount;

        if (updatedCard.oneAway) anyOneAway = true;

        return updatedCard;
      });

      if (anyOneAway && !oneAwayNotified) {
        soundEffects.playOneAway();
        setOneAwayNotified(true);
      }

      return updated;
    });
  }, [room.drawnBalls, room.currentBall, autoDaub]);

  // Confetti on win
  useEffect(() => {
    if (room.winner && !confettiFired) {
      setConfettiFired(true);
      soundEffects.playBingoWin();
      try {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#10b981', '#3b82f6', '#ec4899'],
        });
      } catch (e) {}
    }
  }, [room.winner, confettiFired]);

  const handleCellClick = (r: number, c: number) => {
    if (r === 2 && c === 2) return;
    setCards((prev) => {
      const current = prev[activeCardIndex];
      const newMarked = current.marked.map((row, ri) =>
        row.map((val, ci) => (ri === r && ci === c ? !val : val))
      );
      const updatedCard = { ...current, marked: newMarked };
      const res = evaluateBingo(updatedCard);
      updatedCard.hasBingo = res.hasBingo;
      updatedCard.oneAway = res.oneAway;
      updatedCard.markedCount = res.markedCount;

      const copy = [...prev];
      copy[activeCardIndex] = updatedCard;
      return copy;
    });
  };

  const handleSendReaction = (emoji: string) => {
    soundEffects.playPop();
    const newReaction: LiveReaction = {
      id: String(Date.now() + Math.random()),
      emoji,
      userName,
      x: 30 + Math.random() * 40,
      y: 80,
    };
    setReactions((prev) => [...prev, newReaction]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2500);
  };

  const activeCard = cards[activeCardIndex] || cards[0];
  const anyCardHasBingo = cards.some((c) => c.hasBingo);
  const anyCardOneAway = cards.some((c) => c.oneAway);

  return (
    <div className="space-y-4 relative">
      {/* Floating Reactions Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute text-3xl sm:text-4xl animate-float-up transition-all"
            style={{ left: `${r.x}%`, bottom: '15%' }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-xl">
        <button
          type="button"
          onClick={onLeaveRoom}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ክፍሎች</span>
        </button>

        {/* Room & Jackpot Info */}
        <div className="text-center">
          <div className="text-[11px] font-bold text-slate-400">
            {room.name} <span className="text-amber-400">({room.stake} ETB)</span>
          </div>
          <div className="text-sm sm:text-base font-black text-amber-400 flex items-center justify-center gap-1">
            <Trophy className="w-4 h-4" />
            <span>ጃክፖት፦ {room.prizePool > 0 ? room.prizePool : room.stake * 4} ETB</span>
          </div>
        </div>

        {/* Audio Toggles & Guide */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              voiceEnabled
                ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title={voiceEnabled ? 'ድምፅ አንባቢ አጥፋ' : 'ድምፅ አንባቢ አብራ'}
          >
            {voiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title={soundEnabled ? 'ድምፅ አጥፋ' : 'ድምፅ አብራ'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setShowPatternGuide(true)}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
            title="የማሸነፊያ መንገዶች"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ONE AWAY ADRENALINE PULSE BANNER */}
      {anyCardOneAway && !anyCardHasBingo && !room.winner && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 font-black py-2 px-4 rounded-xl shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 animate-pulse text-xs sm:text-sm">
          <Flame className="w-4 h-4 fill-slate-950" />
          <span>🔥 አንድ ቁጥር ብቻ ቀርቶዎታል! ቢንጎ ለማለት ተዘጋጁ! (1 Number Away!)</span>
        </div>
      )}

      {/* Ball Caller Sphere Spotlight */}
      <BallCaller currentBall={room.currentBall} drawnBalls={room.drawnBalls || []} />

      {/* Multi-Cartela Switcher Tabs */}
      {cards.length > 1 && (
        <div className="flex items-center justify-center gap-2">
          {cards.map((c, idx) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCardIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeCardIndex === idx
                  ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30 scale-105'
                  : 'bg-slate-900 border border-slate-850 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>ካርቴላ #{c.cartelaNumber}</span>
              {c.hasBingo ? (
                <span className="text-[10px] bg-emerald-600 text-white px-1.5 rounded-full">BINGO</span>
              ) : c.oneAway ? (
                <span className="text-[10px] bg-red-600 text-white px-1 rounded-full animate-ping">1</span>
              ) : null}
            </button>
          ))}
        </div>
      )}

      {/* Primary Card View */}
      <div className="relative">
        <BingoCardView
          card={activeCard}
          drawnBalls={room.drawnBalls || []}
          autoDaub={autoDaub}
          onCellClick={handleCellClick}
        />
      </div>

      {/* BINGO CLAIM BUTTON ACTION */}
      <div className="max-w-sm sm:max-w-md mx-auto space-y-2">
        {anyCardHasBingo ? (
          <button
            type="button"
            onClick={() => onClaimBingo(activeCard.cartelaNumber)}
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400 hover:from-emerald-300 hover:to-green-400 text-slate-950 font-black text-xl rounded-2xl shadow-xl shadow-emerald-500/40 animate-bounce flex items-center justify-center gap-3 cursor-pointer uppercase tracking-wider"
          >
            <Zap className="w-6 h-6 stroke-[3]" />
            <span>ቢንጎ በል! (CLAIM BINGO 🎉)</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={true}
            className="w-full py-3.5 px-4 bg-slate-900 border border-slate-800 text-slate-500 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed select-none"
          >
            <span>ቢንጎ ሲሆን ይህ ቁልፍ ይበራል (Waiting for Bingo...)</span>
          </button>
        )}

        {/* Live Emoji Reactions & Auto-Daub Toggle */}
        <div className="flex items-center justify-between px-1">
          {/* Reaction Bar */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-500 mr-1">ስሜት፦</span>
            {['🍌', '🔥', '👏', '💰', '😂'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSendReaction(emoji)}
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-base cursor-pointer active:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Auto-Daub Toggle */}
          <button
            type="button"
            onClick={() => setAutoDaub(!autoDaub)}
            className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              autoDaub
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-850 border-slate-800 text-slate-400'
            }`}
          >
            {autoDaub ? 'ራስ-ሰር ምልክት (Auto)' : 'በእጅ (Manual)'}
          </button>
        </div>
      </div>

      {/* WINNER POPUP MODAL */}
      {room.winner && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-400 text-slate-950 text-3xl font-black mx-auto flex items-center justify-center shadow-lg shadow-amber-400/40">
              🏆
            </div>
            <div>
              <h3 className="text-2xl font-black text-amber-400 uppercase tracking-tight">ቢንጎ ተገኝቷል!</h3>
              <p className="text-white text-lg font-extrabold mt-1">{room.winner.userName}</p>
              <p className="text-xs text-slate-400">ካርቴላ #{room.winner.cartelaNumber}</p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <span className="text-xs text-slate-400 block font-bold">የተሸለመው ጃክፖት</span>
              <strong className="text-2xl font-black text-amber-400">{room.winner.prize} ETB</strong>
            </div>
            <button
              type="button"
              onClick={onLeaveRoom}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black rounded-xl cursor-pointer"
            >
              ወደ ክፍሎች ተመለስ
            </button>
          </div>
        </div>
      )}

      {/* HOW TO WIN PATTERNS MODAL */}
      {showPatternGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>🏆</span>
                <span>የማሸነፊያ መንገዶች (Winning Patterns)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPatternGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-750">
                <strong className="text-amber-400 block">1. አግድም ረድፍ (Row)</strong>
                <p className="text-slate-300 text-[11px] mt-1">በየትኛውም ረድፍ 5 ሙሉ ቁጥሮች ሲሞሉ</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-750">
                <strong className="text-amber-400 block">2. ቁልቁል አምድ (Col)</strong>
                <p className="text-slate-300 text-[11px] mt-1">B, I, N, G, O አምድ ሙሉ ለሙሉ ሲሞላ</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-750">
                <strong className="text-amber-400 block">3. ሰያፍ (Diagonal)</strong>
                <p className="text-slate-300 text-[11px] mt-1">ከግራ ወደ ቀኝ ወይም ከቀኝ ወደ ግራ መስቀለኛ</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-750">
                <strong className="text-amber-400 block">4. 4ቱ ማዕዘናት</strong>
                <p className="text-slate-300 text-[11px] mt-1">የካርቴላው አራቱ ጫፍ ማዕዘናት ሲመቱ</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPatternGuide(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-xl cursor-pointer"
            >
              ተረድቻለሁ (ገባኝ)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
