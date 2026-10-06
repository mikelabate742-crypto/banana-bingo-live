import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Users,
  RefreshCw,
  Wallet,
  Settings,
  Lock,
  Unlock,
  Smartphone,
  Landmark,
  X,
  Zap,
} from 'lucide-react';

interface AdminControlPanelProps {
  onClose?: () => void;
}

export const AdminControlPanel: React.FC<AdminControlPanelProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'deposits' | 'withdrawals'>('overview');

  // Settings form
  const [phone, setPhone] = useState('');
  const [cbe, setCbe] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [autopilot, setAutopilot] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState('');

  // Manual Adjust
  const [adjustUserId, setAdjustUserId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustStatus, setAdjustStatus] = useState('');

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview');
      const json = await res.json();
      if (json.ok) {
        setData(json);
        if (json.systemConfig) {
          setPhone(json.systemConfig.telebirrNumber || '0989047970');
          setCbe(json.systemConfig.cbeAccount || '1000123456789');
          setReceiverName(json.systemConfig.telebirrName || 'ባናና ቢንጎ');
          setAutopilot(Boolean(json.systemConfig.autoPilotEnabled));
        }
      }
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOverview();
    }
  }, [isAuthenticated]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '7788') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsStatus('');
    try {
      const res = await fetch('/api/admin/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telebirrNumber: phone,
          cbeAccount: cbe,
          telebirrName: receiverName,
          autoPilotEnabled: autopilot,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setSettingsStatus('✅ ቅንብሮቹ በተሳካ ሁኔታ ተመዝግበዋል!');
        fetchOverview();
      } else {
        setSettingsStatus('❌ ስህተት ተፈጥሯል');
      }
    } catch (err: any) {
      setSettingsStatus('❌ ' + err.message);
    }
    setSavingSettings(false);
  };

  const handleDepositAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await fetch('/api/admin/deposit/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      fetchOverview();
    } catch (e) {}
  };

  const handleWithdrawalAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await fetch('/api/admin/withdraw/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      fetchOverview();
    } catch (e) {}
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustUserId || !adjustAmount) return;
    setAdjustStatus('');
    try {
      const res = await fetch('/api/admin/adjust-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: adjustUserId, amount: Number(adjustAmount) }),
      });
      const json = await res.json();
      if (json.ok) {
        setAdjustStatus(`✅ የ ${adjustUserId} ሂሳብ ወደ ${json.balance} ETB ተስተካክሏል!`);
        setAdjustAmount('');
        fetchOverview();
      }
    } catch (e: any) {
      setAdjustStatus('❌ ስህተት');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-400/30">
            <Lock className="w-7 h-7" />
          </div>

          <h3 className="text-lg font-black text-white mb-1">የአድሚን ዴስክ (Admin HQ)</h3>
          <p className="text-xs text-slate-400 mb-4">የይለፍ ቃል (PIN) ያስገቡ (Default: 7788)</p>

          <form onSubmit={handleUnlock} className="space-y-3">
            <input
              type="password"
              maxLength={6}
              placeholder="••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full text-center tracking-widest text-2xl font-black bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-2 text-white outline-none"
            />
            {pinError && <p className="text-xs text-red-400 font-bold">የተሳሳተ PIN ነው!</p>}

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black rounded-xl cursor-pointer"
            >
              ይክፈቱ (Unlock)
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative my-auto">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              🛡️
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">ባናና ቢንጎ መቆጣጠሪያ (Admin HQ)</h2>
              <p className="text-xs text-slate-400">የክፍያ፣ የቴሌብር እና የጨዋታ ማስተካከያ</p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchOverview}
            className="p-2 rounded-xl bg-slate-800 text-amber-400 hover:bg-slate-700 cursor-pointer"
            title="አድስ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { id: 'overview', label: '📊 አጠቃላይ ሪፖርት' },
            { id: 'settings', label: '⚙️ የቴሌብር እና ባንክ ቅንብር' },
            { id: 'deposits', label: '📥 ዲፖዚቶች' },
            { id: 'withdrawals', label: '📤 ወጪዎች' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold">የቤት ትርፍ (15%)</div>
                <div className="text-xl font-black text-amber-400">{data.totalHouseCommission} ETB</div>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold">ጠቅላላ ተጫዋቾች</div>
                <div className="text-xl font-black text-blue-400">{data.registeredUsersCount} ሰዎች</div>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold">ክፍት ክፍሎች</div>
                <div className="text-xl font-black text-emerald-400">{data.rooms?.length || 5} ክፍሎች</div>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold">አውቶ-ፓይለት</div>
                <div className="text-xl font-black text-white">
                  {data.systemConfig?.autoPilotEnabled ? '✅ በርቷል' : '⚪ ጠፍቷል'}
                </div>
              </div>
            </div>

            {/* Quick Adjust Balance */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold text-white mb-2">💵 የተጫዋች ሂሳብ በእጅ ለመጨመር/ለመቀነስ</h4>
              <form onSubmit={handleAdjustBalance} className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="የተጫዋች ID / ስም"
                  value={adjustUserId}
                  onChange={(e) => setAdjustUserId(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none flex-1 min-w-[130px]"
                />
                <input
                  type="number"
                  placeholder="መጠን (ETB)"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none w-28"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
                >
                  አስተካክል
                </button>
              </form>
              {adjustStatus && <p className="text-xs text-amber-300 font-bold mt-2">{adjustStatus}</p>}
            </div>
          </div>
        )}

        {/* Tab 2: Settings (Phone & Bank Change) */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-md">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                📱 የቴሌብር መቀበያ ስልክ ቁጥር
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0989047970"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                🏦 የንግድ ባንክ (CBE) ሂሳብ ቁጥር
              </label>
              <input
                type="text"
                value={cbe}
                onChange={(e) => setCbe(e.target.value)}
                placeholder="1000123456789"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                👤 የተቀባይ ስም (Account Holder Name)
              </label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="ባናና ቢንጎ"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <div className="text-xs font-bold text-white">⚡ ራስ-ገዝ አውቶ-ፓይለት (Auto-Pilot)</div>
                <div className="text-[11px] text-slate-400">የተጫዋቾች ክፍያ በራሱ እንዲጸድቅ ያደርጋል</div>
              </div>
              <button
                type="button"
                onClick={() => setAutopilot(!autopilot)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  autopilot ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    autopilot ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {settingsStatus && <p className="text-xs font-bold text-amber-300">{settingsStatus}</p>}

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm rounded-xl cursor-pointer shadow-lg shadow-amber-500/20"
            >
              {savingSettings ? 'በመመዝገብ ላይ...' : 'ቅንብሮችን መዝግብ (Save Config)'}
            </button>
          </form>
        )}

        {/* Tab 3: Deposits */}
        {activeTab === 'deposits' && (
          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            {(!data?.deposits || data.deposits.length === 0) && (
              <p className="text-xs text-slate-400 text-center py-6">ምንም የገንዘብ ማስገቢያ ጥያቄ የለም።</p>
            )}
            {data?.deposits?.map((dep: any) => (
              <div
                key={dep.id}
                className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">
                    {dep.userName} ({dep.amount} ETB via {dep.method})
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">TX: {dep.transactionId}</div>
                </div>

                <div className="flex items-center gap-2">
                  {dep.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleDepositAction(dep.id, 'approve')}
                        className="px-2.5 py-1 bg-emerald-500 text-white font-bold text-xs rounded-lg cursor-pointer"
                      >
                        አጽድቅ
                      </button>
                      <button
                        onClick={() => handleDepositAction(dep.id, 'reject')}
                        className="px-2.5 py-1 bg-red-500/20 text-red-400 font-bold text-xs rounded-lg cursor-pointer"
                      >
                        ከልክል
                      </button>
                    </>
                  ) : (
                    <span
                      className={`text-xs font-bold ${
                        dep.status === 'approved' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {dep.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Withdrawals */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            {(!data?.withdrawals || data.withdrawals.length === 0) && (
              <p className="text-xs text-slate-400 text-center py-6">ምንም የወጪ ጥያቄ የለም።</p>
            )}
            {data?.withdrawals?.map((w: any) => (
              <div
                key={w.id}
                className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">
                    {w.userName} ({w.amount} ETB to {w.accountOrPhone})
                  </div>
                  <div className="text-[10px] text-slate-400">{w.method}</div>
                </div>

                <div className="flex items-center gap-2">
                  {w.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleWithdrawalAction(w.id, 'approve')}
                        className="px-2.5 py-1 bg-emerald-500 text-white font-bold text-xs rounded-lg cursor-pointer"
                      >
                        ተከፍሏል
                      </button>
                      <button
                        onClick={() => handleWithdrawalAction(w.id, 'reject')}
                        className="px-2.5 py-1 bg-red-500/20 text-red-400 font-bold text-xs rounded-lg cursor-pointer"
                      >
                        መልስ
                      </button>
                    </>
                  ) : (
                    <span
                      className={`text-xs font-bold ${
                        w.status === 'approved' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {w.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
