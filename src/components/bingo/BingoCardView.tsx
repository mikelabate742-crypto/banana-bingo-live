import React from 'react';
import { BingoCard } from '../../types/bingo';
import { soundEffects } from '../../utils/bingoAudio';
import { Zap, Flame } from 'lucide-react';

interface BingoCardViewProps {
  card: BingoCard;
  drawnBalls: number[];
  autoDaub?: boolean;
  onCellClick?: (r: number, c: number) => void;
  compact?: boolean;
}

export const BingoCardView: React.FC<BingoCardViewProps> = ({
  card,
  drawnBalls,
  autoDaub = true,
  onCellClick,
  compact = false,
}) => {
  const drawnSet = new Set(drawnBalls);

  const handleCellClick = (r: number, c: number) => {
    soundEffects.playPop();
    if (onCellClick) {
      onCellClick(r, c);
    }
  };

  const headers = [
    { letter: 'B', color: 'text-blue-400 bg-blue-500/10 border-blue-500/40' },
    { letter: 'I', color: 'text-rose-400 bg-rose-500/10 border-rose-500/40' },
    { letter: 'N', color: 'text-amber-400 bg-amber-500/10 border-amber-500/40' },
    { letter: 'G', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40' },
    { letter: 'O', color: 'text-purple-400 bg-purple-500/10 border-purple-500/40' },
  ];

  return (
    <div
      className={`relative bg-slate-900/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-4 shadow-2xl mx-auto transition-all duration-300 ${
        card.hasBingo
          ? 'border-2 border-emerald-400 ring-4 ring-emerald-400/20 shadow-emerald-500/20'
          : card.oneAway
          ? 'border-2 border-amber-400 shadow-amber-500/30'
          : 'border border-slate-800 hover:border-slate-700'
      } ${compact ? 'max-w-xs' : 'max-w-sm sm:max-w-md'}`}
    >
      {/* Top Banner Status */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍌</span>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
              <span>ካርቴላ</span>
              <span className="text-amber-400">#{card.cartelaNumber}</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              የተመቱት፦ <strong className="text-white">{card.markedCount}</strong>/25
            </span>
          </div>
        </div>

        {/* State Badges */}
        <div className="flex items-center gap-1.5">
          {card.hasBingo ? (
            <span className="px-2.5 py-1 bg-gradient-to-r from-emerald-400 to-green-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/30 animate-bounce flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>ቢንጎ! (BINGO)</span>
            </span>
          ) : card.oneAway ? (
            <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[11px] rounded-lg shadow-md animate-pulse flex items-center gap-1">
              <Flame className="w-3 h-3 text-red-600 fill-red-600" />
              <span>1 የቀረው! (1 AWAY)</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Progress Bar for Marked Numbers */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full mb-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            card.hasBingo
              ? 'bg-emerald-400'
              : card.oneAway
              ? 'bg-amber-400'
              : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(100, (card.markedCount / 5) * 100)}%` }}
        />
      </div>

      {/* 5x5 Table Layout */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {/* Letter Headers */}
        {headers.map((h, i) => (
          <div
            key={i}
            className={`h-8 sm:h-10 rounded-xl flex items-center justify-center font-black text-sm sm:text-base border ${h.color} shadow-sm select-none`}
          >
            {h.letter}
          </div>
        ))}

        {/* 25 Grid Cells */}
        {card.grid.map((row, r) =>
          row.map((val, c) => {
            const isCenterFree = r === 2 && c === 2;
            const isDrawn = val > 0 && drawnSet.has(val);
            const isMarked = card.marked[r][c] || isCenterFree || (autoDaub && isDrawn);

            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => handleCellClick(r, c)}
                disabled={isCenterFree}
                className={`h-11 sm:h-13 rounded-xl flex flex-col items-center justify-center font-black transition-all duration-150 relative select-none cursor-pointer ${
                  compact ? 'h-9 sm:h-10 text-xs' : 'text-sm sm:text-base'
                } ${
                  isMarked
                    ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/30 scale-[0.96] border-2 border-white'
                    : isDrawn
                    ? 'bg-amber-400/20 text-amber-300 border-2 border-dashed border-amber-400 animate-pulse'
                    : 'bg-slate-800/90 text-white hover:bg-slate-750 border border-slate-700/80 active:scale-95'
                }`}
              >
                {isCenterFree ? (
                  <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-base leading-none">⭐</span>
                    <span className="text-[8px] sm:text-[9px] font-black tracking-tighter uppercase leading-none text-slate-950 mt-0.5">
                      FREE
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="leading-none drop-shadow-sm">{val}</span>
                    {isMarked && (
                      <span className="absolute -top-1 -right-1 text-[9px] sm:text-[10px] leading-none">
                        🍌
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
