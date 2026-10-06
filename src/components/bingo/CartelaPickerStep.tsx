import React, { useState } from 'react';
import { BetesebRoom, BingoCard } from '../../types/bingo';
import { generateCartela } from '../../utils/bingoLogic';
import { BingoCardView } from './BingoCardView';
import { ArrowLeft, Check, Sparkles, Shuffle, ShieldCheck } from 'lucide-react';
import { soundEffects } from '../../utils/bingoAudio';

interface CartelaPickerStepProps {
  room: BetesebRoom;
  userId: string;
  userBalance: number;
  onBack: () => void;
  onConfirmCartelas: (cartelaNumbers: number[]) => void;
  onOpenCashier: () => void;
}

export const CartelaPickerStep: React.FC<CartelaPickerStepProps> = ({
  room,
  userId,
  userBalance,
  onBack,
  onConfirmCartelas,
  onOpenCashier,
}) => {
  // Support multi-cartela selection (up to 4 cartelas)
  const [selectedNums, setSelectedNums] = useState<number[]>(() => {
    for (let i = 1; i <= 100; i++) {
      if (!room.occupiedCartelas?.[i]) return [i];
    }
    return [1];
  });

  const [previewActiveIndex, setPreviewActiveIndex] = useState(0);

  const toggleNumber = (num: number) => {
    soundEffects.triggerHaptic('light');
    setSelectedNums((prev) => {
      if (prev.includes(num)) {
        if (prev.length === 1) return prev; // must keep at least 1
        return prev.filter((n) => n !== num);
      } else {
        if (prev.length >= 4) {
          // Max 4 cartelas
          return [...prev.slice(1), num];
        }
        return [...prev, num];
      }
    });
  };

  const handleQuickPick = (count: number) => {
    soundEffects.triggerHaptic('medium');
    const free: number[] = [];
    for (let i = 1; i <= 100; i++) {
      if (!room.occupiedCartelas?.[i]) free.push(i);
    }
    const shuffled = [...free].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, Math.min(count, free.length));
    if (picked.length > 0) {
      setSelectedNums(picked);
      setPreviewActiveIndex(0);
    }
  };

  const totalCost = selectedNums.length * room.stake;
  const canAfford = userBalance >= totalCost;
  const activePreviewNum = selectedNums[previewActiveIndex] || selectedNums[0] || 1;
  const previewCard: BingoCard = generateCartela(activePreviewNum);

  return (
    <div className="space-y-4">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ክፍሎች</span>
        </button>

        <div className="text-right">
          <span className="text-[11px] text-slate-400">የተመረጠው ክፍል፦ </span>
          <strong className="text-amber-400 font-black text-sm sm:text-base">
            {room.name} ({room.stake} ETB)
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: 100 Cartelas Grid Selector */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
                <span>🍌</span>
                <span>ካርቴላ ይምረጡ (እስከ 4 ካርቴላ)</span>
              </h3>
              <p className="text-[11px] text-slate-400">ብዙ ካርቴላ በቆረጡ ቁጥር የማሸነፍ እድልዎ ይጨምራል!</p>
            </div>
            <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30">
              {selectedNums.length} ተመርጧል
            </span>
          </div>

          {/* Quick Pick Buttons */}
          <div className="flex items-center gap-1.5 mb-3 py-1.5 border-y border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-400">ፈጣን ምርጫ፦</span>
            <button
              type="button"
              onClick={() => handleQuickPick(1)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 cursor-pointer"
            >
              1 በዘፈቀደ
            </button>
            <button
              type="button"
              onClick={() => handleQuickPick(2)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 cursor-pointer"
            >
              2 በዘፈቀደ
            </button>
            <button
              type="button"
              onClick={() => handleQuickPick(4)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 cursor-pointer"
            >
              4 ካርቴላ (Max)
            </button>
          </div>

          {/* 100 Grid */}
          <div className="grid grid-cols-10 gap-1 sm:gap-1.5 max-h-[340px] overflow-y-auto p-1 scrollbar-thin">
            {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => {
              const occupiedBy = room.occupiedCartelas?.[num];
              const isOccupied = Boolean(occupiedBy);
              const isSelected = selectedNums.includes(num);

              return (
                <button
                  key={num}
                  type="button"
                  disabled={isOccupied}
                  onClick={() => toggleNumber(num)}
                  className={`h-8 sm:h-9 rounded-lg font-black text-xs transition-all duration-150 relative cursor-pointer select-none ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 scale-105 shadow-md shadow-amber-400/40 border-2 border-white font-black z-10'
                      : isOccupied
                      ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed border border-slate-850'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 hover:border-amber-400/50'
                  }`}
                >
                  <span>{num}</span>
                  {isOccupied && (
                    <span className="absolute -top-1 -right-1 text-[8px] bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center">
                      ✕
                    </span>
                  )}
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 text-[8px] bg-emerald-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" /> የተመረጠ
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700 inline-block" /> ነፃ ካርቴላ
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-slate-800/40 text-slate-600 inline-block" /> የተያዘ
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Preview & Checkout */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div>
            {/* Multi-Cartela Preview Tabs */}
            {selectedNums.length > 1 && (
              <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
                <span className="text-[11px] font-bold text-slate-400">ይመልከቱ፦</span>
                {selectedNums.map((n, idx) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPreviewActiveIndex(idx)}
                    className={`px-2.5 py-1 text-xs font-black rounded-lg transition-colors cursor-pointer ${
                      previewActiveIndex === idx
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    #{n}
                  </button>
                ))}
              </div>
            )}

            {/* Live Bingo Card Preview */}
            <BingoCardView card={previewCard} drawnBalls={[]} autoDaub={false} compact={true} />
          </div>

          {/* Order Checkout Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>የተመረጡ ካርቴላዎች ({selectedNums.length})፦</span>
                <span className="font-bold text-white">
                  {selectedNums.map((n) => `#${n}`).join(', ')}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>የአንዱ ካርቴላ ዋጋ፦</span>
                <span className="font-bold text-white">{room.stake} ETB</span>
              </div>
              <div className="flex items-center justify-between text-base font-black text-amber-400 pt-2 border-t border-slate-800">
                <span>ጠቅላላ ክፍያ (Total Stake)፦</span>
                <span>{totalCost} ETB</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>የእርስዎ ቀሪ ሂሳብ፦</span>
                <span className={canAfford ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {userBalance} ETB
                </span>
              </div>
            </div>

            {canAfford ? (
              <button
                type="button"
                onClick={() => onConfirmCartelas(selectedNums)}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-base rounded-xl shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>ካርቴላውን ቁረጥና ግባ ({totalCost} ETB)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenCashier}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-base rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <span>ገንዘብ አስገባ (ቀሪ ሂሳብ አነሰ)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
