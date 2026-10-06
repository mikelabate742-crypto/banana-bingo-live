import React, { useState } from 'react';
import { getLetterForNumber, getAmharicLetterAndNumber } from '../../utils/bingoLogic';
import { LayoutGrid, Eye, EyeOff } from 'lucide-react';

interface BallCallerProps {
  currentBall: number | null;
  drawnBalls: number[];
}

export const BallCaller: React.FC<BallCallerProps> = ({ currentBall, drawnBalls }) => {
  const [showFullBoard, setShowFullBoard] = useState(false);

  const getBallColor = (letter: string) => {
    switch (letter) {
      case 'B': return 'from-blue-500 via-blue-600 to-indigo-700 text-white shadow-blue-500/40 border-blue-400';
      case 'I': return 'from-rose-500 via-red-600 to-red-800 text-white shadow-red-500/40 border-red-400';
      case 'N': return 'from-amber-400 via-amber-500 to-yellow-600 text-slate-950 shadow-amber-500/40 border-amber-300';
      case 'G': return 'from-emerald-400 via-emerald-600 to-teal-800 text-white shadow-emerald-500/40 border-emerald-400';
      case 'O': return 'from-purple-500 via-purple-600 to-violet-800 text-white shadow-purple-500/40 border-purple-400';
      default: return 'from-amber-400 to-yellow-600 text-slate-950 shadow-amber-500/40 border-amber-300';
    }
  };

  const currentInfo = currentBall ? getAmharicLetterAndNumber(currentBall) : null;
  const drawnSet = new Set(drawnBalls);

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-amber-500/30 rounded-2xl p-3 sm:p-4 shadow-2xl">
      <div className="flex items-center justify-between gap-3">
        {/* Main Current Ball Spotlight */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            {/* Ambient Glow */}
            <div className={`absolute -inset-1 rounded-full blur-md opacity-70 ${
              currentInfo ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'
            }`} />

            <div
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br ${
                currentInfo ? getBallColor(currentInfo.letter) : 'from-slate-800 to-slate-900 text-slate-500 border-slate-700'
              } flex flex-col items-center justify-center font-black shadow-xl border-2 transition-transform duration-300 scale-100 hover:scale-105`}
            >
              {currentInfo ? (
                <>
                  <span className="text-[10px] sm:text-xs uppercase tracking-widest font-black leading-none drop-shadow-sm">
                    {currentInfo.letter}
                  </span>
                  <span className="text-2xl sm:text-3xl leading-none tracking-tight font-black drop-shadow-md">
                    {currentBall}
                  </span>
                </>
              ) : (
                <div className="text-center">
                  <span className="text-[10px] block font-bold text-slate-400">ተጠባባቂ</span>
                  <span className="text-xs font-black text-amber-400">READY</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                የወጣው ኳስ (Drawn Ball)
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>{currentInfo ? currentInfo.amharicName : 'ኳስ በመጠበቅ ላይ...'}</span>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              የወጡ፦ <strong className="text-amber-300 font-black">{drawnBalls.length}</strong> / 75
            </div>
          </div>
        </div>

        {/* History Strip & Full Board Toggle */}
        <div className="flex items-center gap-2">
          {/* Recent Balls Horizontal Scroll */}
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto py-1 max-w-[200px]">
            {drawnBalls.slice(-5).reverse().map((num, i) => {
              const letter = getLetterForNumber(num);
              return (
                <div
                  key={`${num}-${i}`}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br ${getBallColor(
                    letter
                  )} flex flex-col items-center justify-center text-[10px] sm:text-xs font-black shrink-0 shadow-sm border`}
                >
                  <span className="leading-none text-[8px] opacity-80">{letter}</span>
                  <span className="leading-none">{num}</span>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowFullBoard(!showFullBoard)}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="ሙሉውን 75 ኳሶች ሰሌዳ ይመልከቱ"
          >
            <LayoutGrid className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">{showFullBoard ? 'ሰሌዳ ዝጋ' : '75 ሰሌዳ'}</span>
          </button>
        </div>
      </div>

      {/* Expandable 1-75 Full Board Matrix */}
      {showFullBoard && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-300">የ 1–75 የወጡ ኳሶች ዝርዝር ሰሌዳ፦</span>
            <span className="text-[11px] text-amber-300 font-semibold">{drawnBalls.length} የወጡ</span>
          </div>

          <div className="space-y-1 text-xs">
            {['B', 'I', 'N', 'G', 'O'].map((letter, rIdx) => {
              const start = rIdx * 15 + 1;
              const end = start + 14;
              const range = Array.from({ length: 15 }, (_, idx) => start + idx);

              return (
                <div key={letter} className="flex items-center gap-1">
                  <span className="w-5 font-black text-center text-amber-400">{letter}</span>
                  <div className="grid grid-cols-15 flex-1 gap-0.5">
                    {range.map((n) => {
                      const isDrawn = drawnSet.has(n);
                      const isCurrent = currentBall === n;
                      return (
                        <span
                          key={n}
                          className={`text-center py-0.5 rounded text-[10px] font-bold ${
                            isCurrent
                              ? 'bg-amber-400 text-slate-950 font-black ring-1 ring-white'
                              : isDrawn
                              ? 'bg-emerald-500/80 text-white font-extrabold'
                              : 'bg-slate-800/50 text-slate-600'
                          }`}
                        >
                          {n}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
