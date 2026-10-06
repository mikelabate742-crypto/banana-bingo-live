import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  ArrowDownCircle,
  ArrowUpCircle,
  Sparkles,
  Smartphone,
  Landmark,
  History,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { soundEffects } from '../../utils/bingoAudio';

interface TransactionItem {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  title: string;
  timestamp: number;
  status: 'completed' | 'pending';
  method?: string;
}

interface CashierModalProps {
  onClose: () => void;
  userBalance: number;
  userId: string;
  userName: string;
  bonusClaimed: boolean;
  onClaimBonus: () => void;
  onRefreshBalance: () => void;
}

export const CashierModal: React.FC<CashierModalProps> = ({
  onClose,
  userBalance,
  userId,
  userName,
  bonusClaimed,
  onClaimBonus,
  onRefreshBalance,
}) => {
  const [tab, setTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [method, setMethod] = useState<'telebirr' | 'cbe'>('telebirr');

  // Deposit Form
  const [depositAmount, setDepositAmount] = useState('50');
  const [txId, setTxId] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositMsg, setDepositMsg] = useState('');

  // Withdraw Form
  const [withdrawAmount, setWithdrawAmount] = useState('100');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState('');

  // History
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Copied indicator
  const [copied, setCopied] = useState(false);

  // System config state from server
  const [adminPhone, setAdminPhone] = useState('0989047970');
  const [adminCbe, setAdminCbe] = useState('1000123456789');
  const [adminName, setAdminName] = useState('ባናና ቢንጎ (Banana Bingo)');

  useEffect(() => {
    fetch('/api/admin/overview')
      .then((r) => r.json())
      .then((data) => {
        if (data.systemConfig) {
          if (data.systemConfig.telebirrNumber) setAdminPhone(data.systemConfig.telebirrNumber);
          if (data.systemConfig.cbeAccount) setAdminCbe(data.systemConfig.cbeAccount);
          if (data.systemConfig.telebirrName) setAdminName(data.systemConfig.telebirrName);
        }
      })
      .catch(() => {});
  }, []);

  const fetchTransactions = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/user/transactions?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.ok && data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (e) {}
    setLoadingHistory(false);
  };

  useEffect(() => {
    if (tab === 'history') {
      fetchTransactions();
    }
  }, [tab]);

  const handleCopy = (text: string) => {
    soundEffects.triggerHaptic('light');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txId.trim()) {
      setDepositMsg('እባክዎ የግብይት ቁጥር (Transaction ID) ያስገቡ!');
      return;
    }
    setDepositLoading(true);
    setDepositMsg('');

    try {
      const res = await fetch('/api/deposit/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName,
          amount: Number(depositAmount),
          method,
          transactionId: txId.trim(),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        soundEffects.triggerHaptic('success');
        setDepositMsg('✅ ጥያቄዎ ደርሷል! አውቶ-ፓይለት ወዲያውኑ ሂሳብዎን ይሞላል።');
        setTxId('');
        setTimeout(() => {
          onRefreshBalance();
        }, 1500);
      } else {
        setDepositMsg(json.error || 'ስህተት ተፈጥሯል');
      }
    } catch (err: any) {
      setDepositMsg('የኔትወርክ ስህተት፦ ' + err.message);
    } finally {
      setDepositLoading(false);
    }
  };

  const submitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (amt > userBalance) {
      setWithdrawMsg('የጠየቁት ገንዘብ ከቀሪ ሂሳብዎ ይበልጣል!');
      return;
    }
    if (!withdrawAccount.trim()) {
      setWithdrawMsg('እባክዎ ገንዘብ የሚላክበትን ስልክ ወይም የባንክ ሂሳብ ያስገቡ!');
      return;
    }
    setWithdrawLoading(true);
    setWithdrawMsg('');

    try {
      const res = await fetch('/api/withdraw/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName,
          amount: amt,
          method,
          accountOrPhone: withdrawAccount.trim(),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        soundEffects.triggerHaptic('success');
        setWithdrawMsg('✅ የማውጣት ጥያቄዎ በተሳካ ሁኔታ ተልኳል!');
        setWithdrawAccount('');
        onRefreshBalance();
      } else {
        setWithdrawMsg(json.error || 'ስህተት ተፈጥሯል');
      }
    } catch (err: any) {
      setWithdrawMsg('የኔትወርክ ስህተት፦ ' + err.message);
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-400/30">
            💵
          </div>
          <div>
            <h3 className="font-black text-white text-lg">የካዝና መክፈያ (Cashier)</h3>
            <p className="text-xs text-slate-400">
              ቀሪ ሂሳብ፦ <strong className="text-amber-400 font-extrabold">{userBalance} ETB</strong>
            </p>
          </div>
        </div>

        {/* Welcome Bonus Strip */}
        {!bonusClaimed && (
          <div className="mb-4 p-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/40 rounded-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs font-black text-white">የመጀመሪያ 100 ብር ቦነስ!</div>
                <div className="text-[11px] text-amber-200/80">አሁኑኑ በነፃ ይውሰዱ</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClaimBonus}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-transform active:scale-95"
            >
              ክላይም (100 ETB)
            </button>
          </div>
        )}

        {/* 3 Tab Switchers: Deposit, Withdraw, History */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-2xl mb-4 border border-slate-800 text-xs font-black">
          <button
            type="button"
            onClick={() => setTab('deposit')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all ${
              tab === 'deposit'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span>ገንዘብ አስገባ</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('withdraw')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all ${
              tab === 'withdraw'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>ገንዘብ አውጣ</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('history')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all ${
              tab === 'history'
                ? 'bg-slate-800 text-amber-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>ታሪክ</span>
          </button>
        </div>

        {/* Deposit Tab */}
        {tab === 'deposit' && (
          <div className="space-y-4">
            {/* Method Picker */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('telebirr')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  method === 'telebirr'
                    ? 'border-amber-400 bg-amber-400/10 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <Smartphone className="w-5 h-5 text-amber-400" />
                <span className="font-extrabold text-xs">ቴሌብር (Telebirr)</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('cbe')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  method === 'cbe'
                    ? 'border-purple-400 bg-purple-400/10 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <Landmark className="w-5 h-5 text-purple-400" />
                <span className="font-extrabold text-xs">ንግድ ባንክ (CBE)</span>
              </button>
            </div>

            {/* Payment Details Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>የሚልኩበት ስም፦</span>
                <span className="text-amber-400 font-bold">{adminName}</span>
              </div>

              <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                <span className="font-mono font-black text-white text-sm sm:text-base tracking-wider">
                  {method === 'telebirr' ? adminPhone : adminCbe}
                </span>

                <button
                  type="button"
                  onClick={() => handleCopy(method === 'telebirr' ? adminPhone : adminCbe)}
                  className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'ተገልብጧል' : 'ኮፒ'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                👉 በዚህ ቁጥር ገንዘብ ከላኩ በኋላ የግብይት ቁጥሩን (Transaction ID) ከታች አስገብተው ይላኩ።
              </p>
            </div>

            {/* Form */}
            <form onSubmit={submitDeposit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">መጠን (ETB)</label>
                <div className="flex gap-2">
                  {['20', '50', '100', '200', '500'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-black border cursor-pointer ${
                        depositAmount === amt
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-slate-950 text-slate-300 border-slate-800'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  የግብይት ቁጥር (Transaction ID)
                </label>
                <input
                  type="text"
                  placeholder="ምሳሌ፦ 9GA87X21"
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
                />
              </div>

              {depositMsg && (
                <div className="text-xs font-bold p-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300">
                  {depositMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={depositLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/30 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
              >
                {depositLoading ? 'በመላክ ላይ...' : `ገንዘብ አስገባ (${depositAmount} ETB)`}
              </button>
            </form>
          </div>
        )}

        {/* Withdraw Tab */}
        {tab === 'withdraw' && (
          <form onSubmit={submitWithdrawal} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">የማውጣት ዘዴ</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('telebirr')}
                  className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                    method === 'telebirr'
                      ? 'border-emerald-400 bg-emerald-500/10 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>ቴሌብር</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('cbe')}
                  className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                    method === 'cbe'
                      ? 'border-purple-400 bg-purple-400/10 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <Landmark className="w-4 h-4 text-purple-400" />
                  <span>ንግድ ባንክ</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">የሚወጣው መጠን (ETB)</label>
              <input
                type="number"
                min="50"
                max={userBalance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-400 rounded-xl px-3 py-2 text-sm text-white font-black outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {method === 'telebirr' ? 'የቴሌብር ስልክ ቁጥር' : 'የንግድ ባንክ ሂሳብ ቁጥር'}
              </label>
              <input
                type="text"
                placeholder={method === 'telebirr' ? '09XXXXXXXX' : '1000XXXXXXXXX'}
                value={withdrawAccount}
                onChange={(e) => setWithdrawAccount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-400 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
              />
            </div>

            {withdrawMsg && (
              <div className="text-xs font-bold p-2.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-300">
                {withdrawMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={withdrawLoading || userBalance < Number(withdrawAmount)}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-500/30 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
            >
              {withdrawLoading ? 'በመላክ ላይ...' : `ገንዘብ አውጣ (${withdrawAmount} ETB)`}
            </button>
          </form>
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 flex items-center justify-between">
              <span>የቅርብ ጊዜ ግብይቶች፦</span>
              <button
                type="button"
                onClick={fetchTransactions}
                className="text-amber-400 text-[11px] hover:underline"
              >
                አድስ (Refresh)
              </button>
            </h4>

            {loadingHistory ? (
              <div className="py-8 text-center text-xs text-slate-500">በመጫን ላይ...</div>
            ) : transactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                <Clock className="w-6 h-6 mx-auto text-slate-600" />
                <p>ምንም የተመዘገበ ግብይት የለም</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        {tx.type === 'deposit' ? (
                          <span className="text-emerald-400 font-black">+ {tx.amount} ETB</span>
                        ) : (
                          <span className="text-red-400 font-black">- {tx.amount} ETB</span>
                        )}
                        <span className="text-[11px] text-slate-400">({tx.title})</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        tx.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {tx.status === 'completed' ? 'ተጠናቋል' : 'በመጠባበቅ ላይ'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
