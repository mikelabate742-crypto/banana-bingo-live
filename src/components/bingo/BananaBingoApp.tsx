import React, { useState, useEffect } from 'react';
import { BetesebRoom, PlayerProfile } from '../../types/bingo';
import { RoomSelectorStep } from './RoomSelectorStep';
import { CartelaPickerStep } from './CartelaPickerStep';
import { LiveGameArenaStep } from './LiveGameArenaStep';
import { CashierModal } from './CashierModal';
import { AdminControlPanel } from '../admin/AdminControlPanel';
import { ShieldCheck, Wallet, Sparkles, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { soundEffects } from '../../utils/bingoAudio';
import confetti from 'canvas-confetti';

export const BananaBingoApp: React.FC = () => {
  // Extract user info from Telegram WebApp or URL params
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    let id = 'user-' + Math.floor(Math.random() * 10000);
    let name = 'ተጫዋች (Player)';
    let username = '';

    if (typeof window !== 'undefined') {
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      if (tgUser) {
        id = String(tgUser.id);
        name = tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : '');
        username = tgUser.username || '';
      } else {
        const params = new URLSearchParams(window.location.search);
        if (params.get('userId')) id = params.get('userId')!;
        if (params.get('name')) name = params.get('name')!;
        if (params.get('username')) username = params.get('username')!;
      }
    }

    return {
      id,
      name,
      username,
      balance: 100, // Initial balance
      bonusClaimed: false,
    };
  });

  const [rooms, setRooms] = useState<BetesebRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<BetesebRoom | null>(null);
  const [activeCartelaNums, setActiveCartelaNums] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState<'rooms' | 'picker' | 'arena'>('rooms');

  // Modals
  const [showCashier, setShowCashier] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sync profile and rooms with server
  const fetchState = async () => {
    try {
      const roomsRes = await fetch('/api/rooms');
      const roomsJson = await roomsRes.json();
      if (roomsJson.ok && roomsJson.rooms) {
        setRooms(roomsJson.rooms);
        if (activeRoom) {
          const updatedActive = roomsJson.rooms.find((r: BetesebRoom) => r.id === activeRoom.id);
          if (updatedActive) {
            setActiveRoom(updatedActive);
          }
        }
      }

      // Fetch user profile balance
      const profRes = await fetch(
        `/api/user/profile?userId=${encodeURIComponent(profile.id)}&name=${encodeURIComponent(profile.name)}`
      );
      const profJson = await profRes.json();
      if (profJson.ok && profJson.profile) {
        setProfile((prev) => ({
          ...prev,
          balance: profJson.profile.balance,
          bonusClaimed: profJson.profile.bonusClaimed,
        }));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1500); // 1.5s live polling
    return () => clearInterval(interval);
  }, [profile.id, activeRoom?.id]);

  // Initial welcome Telegram setup & Native BackButton handler
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      if (currentStep !== 'rooms') {
        tg.BackButton?.show();
        const handleBack = () => {
          if (currentStep === 'arena') setCurrentStep('rooms');
          else if (currentStep === 'picker') setCurrentStep('rooms');
        };
        tg.BackButton?.onClick(handleBack);
        return () => {
          tg.BackButton?.offClick(handleBack);
        };
      } else {
        tg.BackButton?.hide();
      }
    }
  }, [currentStep]);

  const handleClaimBonus = async () => {
    soundEffects.triggerHaptic('success');
    try {
      const res = await fetch('/api/user/claim-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id, name: profile.name }),
      });
      const json = await res.json();
      if (json.ok) {
        setProfile((prev) => ({
          ...prev,
          balance: json.balance,
          bonusClaimed: true,
        }));
        try {
          confetti({ particleCount: 80, spread: 70 });
        } catch (e) {}
      }
    } catch (e) {}
  };

  const handleSelectRoom = (room: BetesebRoom) => {
    soundEffects.triggerHaptic('light');
    if (profile.balance < room.stake) {
      setShowCashier(true);
      return;
    }
    setActiveRoom(room);
    setCurrentStep('picker');
  };

  const handleConfirmCartelas = async (cartelaNumbers: number[]) => {
    if (!activeRoom) return;
    soundEffects.triggerHaptic('medium');

    try {
      // Join room with all chosen cartelas
      for (const cartelaNumber of cartelaNumbers) {
        const res = await fetch('/api/rooms/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: activeRoom.id,
            userId: profile.id,
            userName: profile.name,
            cartelaNumber,
          }),
        });
        const json = await res.json();
        if (json.ok) {
          if (json.room) setActiveRoom(json.room);
          if (json.newBalance !== undefined) {
            setProfile((p) => ({ ...p, balance: json.newBalance }));
          }
        }
      }

      setActiveCartelaNums(cartelaNumbers);
      setCurrentStep('arena');
    } catch (e) {}
  };

  const handleClaimBingo = async (cartelaNumber: number) => {
    if (!activeRoom) return;
    soundEffects.playBingoWin();

    try {
      const res = await fetch('/api/rooms/claim-bingo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoom.id,
          userId: profile.id,
          userName: profile.name,
          cartelaNumber,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        try {
          confetti({ particleCount: 120, spread: 80 });
        } catch (e) {}
        fetchState();
      }
    } catch (e) {}
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEffects.soundEnabled = next;
    soundEffects.voiceEnabled = next;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 pb-8">
      {/* Universal Top Brand Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div
            onClick={() => setCurrentStep('rooms')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shadow-amber-400/20">
              🍌
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white leading-none">
                ባናና ቢንጎ
              </h1>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                Banana Bingo Live
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            {/* Free Bonus Claim Button */}
            {!profile.bonusClaimed && (
              <button
                type="button"
                onClick={handleClaimBonus}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-amber-400/20 cursor-pointer animate-pulse active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>100 ብር ቦነስ</span>
              </button>
            )}

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className={`p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-900 border-slate-750 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title={soundEnabled ? 'ድምፅ አጥፋ' : 'ድምፅ አብራ'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Balance & Cashier Button */}
            <button
              type="button"
              onClick={() => setShowCashier(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-transform active:scale-95 shadow-sm"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                <strong className="text-emerald-400 font-black">{profile.balance}</strong> ETB
              </span>
            </button>

            {/* Admin Desk PIN Launcher */}
            <button
              type="button"
              onClick={() => setShowAdmin(true)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-400 hover:text-amber-400 cursor-pointer transition-colors"
              title="የአድሚን ዴስክ (PIN: 7788)"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-4">
        {currentStep === 'rooms' && (
          <RoomSelectorStep
            rooms={rooms}
            userBalance={profile.balance}
            onSelectRoom={handleSelectRoom}
            onOpenCashier={() => setShowCashier(true)}
          />
        )}

        {currentStep === 'picker' && activeRoom && (
          <CartelaPickerStep
            room={activeRoom}
            userId={profile.id}
            userBalance={profile.balance}
            onBack={() => setCurrentStep('rooms')}
            onConfirmCartelas={handleConfirmCartelas}
            onOpenCashier={() => setShowCashier(true)}
          />
        )}

        {currentStep === 'arena' && activeRoom && (
          <LiveGameArenaStep
            room={activeRoom}
            userId={profile.id}
            userName={profile.name}
            cartelaNumbers={activeCartelaNums.length > 0 ? activeCartelaNums : [1]}
            onLeaveRoom={() => setCurrentStep('rooms')}
            onClaimBingo={handleClaimBingo}
          />
        )}
      </main>

      {/* Cashier Modal (Deposit, Withdraw, Telebirr & CBE) */}
      {showCashier && (
        <CashierModal
          onClose={() => setShowCashier(false)}
          userBalance={profile.balance}
          userId={profile.id}
          userName={profile.name}
          bonusClaimed={profile.bonusClaimed}
          onClaimBonus={handleClaimBonus}
          onRefreshBalance={fetchState}
        />
      )}

      {/* Admin Panel Modal */}
      {showAdmin && <AdminControlPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
};
