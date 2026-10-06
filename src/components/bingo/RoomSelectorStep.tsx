import React, { useState } from 'react';
import { BetesebRoom } from '../../types/bingo';
import {
  Users,
  Clock,
  Trophy,
  ChevronRight,
  Sparkles,
  HelpCircle,
  X,
  Volume2,
  VolumeX,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface RoomSelectorStepProps {
  rooms: BetesebRoom[];
  userBalance: number;
  onSelectRoom: (room: BetesebRoom) => void;
  onOpenCashier: () => void;
}

export const RoomSelectorStep: React.FC<RoomSelectorStepProps> = ({
  rooms,
  userBalance,
  onSelectRoom,
  onOpenCashier,
}) => {
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Live recent winners feed ticker
  const recentWinners = [
    { name: 'ዳዊት ከበደ', amount: 540, room: 'አቤል (10 ETB)' },
    { name: 'ሳራ ተስፋዬ', amount: 720, room: 'ሳባ (20 ETB)' },
    { name: 'ዮናስ ታደሰ', amount: 1600, room: 'ቴዎድሮስ (50 ETB)' },
    { name: 'ትዕግስት በቀለ', amount: 3200, room: 'ዘውዲቱ (100 ETB)' },
  ];

  return (
    <div className="space-y-4">
      {/* Live Recent Winners Rolling Ticker */}
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl px-3 py-2 flex items-center gap-2 overflow-hidden shadow-lg">
        <span className="text-xs font-black text-amber-400 flex items-center gap-1 shrink-0">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>የቅርብ አሸናፊዎች፦</span>
        </span>
        <div className="overflow-x-auto scrollbar-none flex items-center gap-4 text-xs whitespace-nowrap">
          {recentWinners.map((w, idx) => (
            <span key={idx} className="text-slate-300 font-medium inline-flex items-center gap-1.5">
              <span className="text-white font-bold">{w.name}</span>
              <span className="text-amber-400 font-black">+{w.amount} ETB</span>
              <span className="text-slate-500 text-[10px]">({w.room})</span>
              {idx < recentWinners.length - 1 && <span className="text-slate-700">·</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-600/15 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center text-3xl font-black shadow-lg shadow-amber-400/30">
            🍌
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white">ባናና ቢንጎ (Banana Bingo)</h2>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                ቀጥታ 24/7
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5">
              የኢትዮጵያ የቀጥታ ባለብዙ ተጫዋች ቢንጎ — ክፍል መርጠው ካርቴላ ይቁረጡ!
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>መመሪያ</span>
          </button>

          <button
            type="button"
            onClick={onOpenCashier}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
          >
            <span>💰 {userBalance} ETB</span>
            <span className="text-[11px] bg-white/20 px-1.5 py-0.5 rounded-md">+ አስገባ</span>
          </button>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {rooms.map((room) => {
          const hasEnough = userBalance >= room.stake;
          const isLive = room.status === 'LIVE';
          const isStarting = room.status === 'STARTING';

          return (
            <div
              key={room.id}
              className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-xl relative overflow-hidden group"
            >
              {/* Header: Room Name & Stake */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">🍌</span>
                    <h3 className="font-extrabold text-white text-base sm:text-lg">{room.name}</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    መነሻ ውርርድ፦ <strong className="text-amber-400 font-extrabold">{room.stake} ETB</strong>
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    የአሸናፊ ጃክፖት
                  </div>
                  <div className="text-lg sm:text-xl font-black text-amber-400 flex items-center justify-end gap-1">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>{room.prizePool > 0 ? room.prizePool : room.stake * 4} ETB</span>
                  </div>
                </div>
              </div>

              {/* Status and info */}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-4 py-2 border-y border-slate-800/80">
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    ተጫዋቾች፦ <strong className="text-white font-bold">{room.currentPlayers}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {isLive ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>ጨዋታው ላይ ነው</span>
                    </span>
                  ) : isStarting ? (
                    <span className="text-amber-300 font-black animate-pulse">
                      ይጀምራል፦ {room.countdown}s
                    </span>
                  ) : (
                    <span className="text-slate-400">ተጫዋች በመጠበቅ ላይ</span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => onSelectRoom(room)}
                className={`w-full py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 active:scale-95 ${
                  hasEnough
                    ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-400 border border-slate-700'
                }`}
              >
                <span>{hasEnough ? 'ካርቴላ ምረጥና ግባ' : 'ቀሪ ሂሳብዎን ይሙሉ'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* HOW TO PLAY MODAL */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>🍌</span>
                <span>የባናና ቢንጎ አጨዋወት መመሪያ</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 space-y-1">
                <strong className="text-amber-400 block text-sm">1. ክፍል እና ካርቴላ መምረጥ፦</strong>
                <p>
                  አቅምዎ በሚፈቅደው መጠን (ከ 10 ብር እስከ 200 ብር) ክፍል ይመርጣሉ። በእያንዳንዱ ዙር እስከ 4 ካርቴላ በአንድ ጊዜ መቁረጥ ይችላሉ።
                </p>
              </div>

              <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 space-y-1">
                <strong className="text-amber-400 block text-sm">2. ኳሶች እና ምልክት ማድረጊያ፦</strong>
                <p>
                  ጨዋታው ሲጀመር ኳሶች በድምፅ እና በቁጥር እየወጡ ይመጣሉ። አውቶ-ዳውብ (Auto-Daub) በርቶ ስለሚሆን ካርቴላዎ ላይ ያሉ ቁጥሮች በራሳቸው ምልክት ይደረግባቸዋል!
                </p>
              </div>

              <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 space-y-1">
                <strong className="text-amber-400 block text-sm">3. ማሸነፍ እና ክፍያ፦</strong>
                <p>
                  በየትኛውም አግድም፣ ቁልቁል፣ ሰያፍ ወይም 4 ማዕዘን 5 ቁጥሮች ሲሞሉ <strong>«ቢንጎ»</strong> የሚለው ቁልፍ ይበራልዎታል! ፈጥነው ሲጫኑት አሸናፊ ይሆናሉ፤ ሽልማቱም ወዲያውኑ ወደ ቦርሳዎ ይገባል!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRulesModal(false)}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl cursor-pointer"
            >
              ተረድቻለሁ (አሁን ልጫወት)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
