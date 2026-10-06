import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Bot, InlineKeyboard } from 'grammy';
import {
  startPublicTunnel,
  getPublicWebAppUrl,
  onTunnelUrlChange,
} from './src/server/tunnelManager';
import { BetesebRoom, DepositRequest, WithdrawalRequest } from './src/types/bingo';

const app = express();
const PORT = 3000;

process.on('uncaughtException', (err: any) => {
  const msg = String(err?.message || err);
  if (msg.includes('409') || msg.includes('Conflict')) {
    console.log('[Notice] Telegram polling handled by Render server.');
    return;
  }
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason: any) => {
  const msg = String(reason?.message || reason);
  if (msg.includes('409') || msg.includes('Conflict')) {
    return;
  }
  console.error('Unhandled Rejection:', reason);
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-Memory Data Store
const users = new Map<string, { id: string; name: string; username?: string; balance: number; bonusClaimed: boolean }>();
const deposits: DepositRequest[] = [];
const withdrawals: WithdrawalRequest[] = [];
let houseCommission = 0;

export const systemConfig = {
  telebirrNumber: '0989047970',
  telebirrName: 'ባናና ቢንጎ (Banana Bingo)',
  cbeAccount: '1000123456789',
  cbeName: 'ባናና ቢንጎ (Banana Bingo)',
  autoPilotEnabled: true,
};

// 24/7 Keep-Alive Pinger to keep Render instance awake permanently
setInterval(async () => {
  try {
    const pingTarget = 'https://banana-bingo-live.onrender.com/api/rooms';
    const res = await fetch(pingTarget);
    if (res.ok) {
      console.log('[KeepAlive] Pinged Render instance successfully at', new Date().toISOString());
    }
  } catch (err: any) {
    // Silent fail if offline
  }
}, 3 * 60 * 1000); // Ping every 3 minutes

// Initialize 5 Live Bingo Rooms
const rooms: BetesebRoom[] = [
  {
    id: 'room-10',
    name: 'አቤል (10 ብር)',
    stake: 10,
    minPlayers: 2,
    maxPlayers: 100,
    status: 'WAITING',
    currentPlayers: 3,
    countdown: 15,
    prizePool: 40,
    drawnBalls: [],
    currentBall: null,
    winner: null,
    occupiedCartelas: { 12: 'bot-1', 45: 'bot-2', 78: 'bot-3' },
  },
  {
    id: 'room-20',
    name: 'ሳባ (20 ብር)',
    stake: 20,
    minPlayers: 2,
    maxPlayers: 100,
    status: 'WAITING',
    currentPlayers: 4,
    countdown: 25,
    prizePool: 80,
    drawnBalls: [],
    currentBall: null,
    winner: null,
    occupiedCartelas: { 5: 'bot-1', 22: 'bot-2', 63: 'bot-3', 88: 'bot-4' },
  },
  {
    id: 'room-50',
    name: 'ቴዎድሮስ (50 ብር)',
    stake: 50,
    minPlayers: 2,
    maxPlayers: 100,
    status: 'WAITING',
    currentPlayers: 2,
    countdown: 30,
    prizePool: 100,
    drawnBalls: [],
    currentBall: null,
    winner: null,
    occupiedCartelas: { 17: 'bot-1', 54: 'bot-2' },
  },
  {
    id: 'room-100',
    name: 'ዘውዲቱ (100 ብር)',
    stake: 100,
    minPlayers: 2,
    maxPlayers: 100,
    status: 'WAITING',
    currentPlayers: 3,
    countdown: 40,
    prizePool: 300,
    drawnBalls: [],
    currentBall: null,
    winner: null,
    occupiedCartelas: { 9: 'bot-1', 33: 'bot-2', 77: 'bot-3' },
  },
  {
    id: 'room-200',
    name: 'ምኒልክ (200 ብር)',
    stake: 200,
    minPlayers: 2,
    maxPlayers: 100,
    status: 'WAITING',
    currentPlayers: 2,
    countdown: 45,
    prizePool: 400,
    drawnBalls: [],
    currentBall: null,
    winner: null,
    occupiedCartelas: { 4: 'bot-1', 89: 'bot-2' },
  },
];

// Continuous Game Loop (calls balls, starts games, resets)
setInterval(() => {
  rooms.forEach((room) => {
    if (room.status === 'WAITING' || room.status === 'STARTING') {
      if (room.countdown > 1) {
        room.status = 'STARTING';
        room.countdown -= 1;
      } else {
        // Start game!
        room.status = 'LIVE';
        room.countdown = 0;
        room.drawnBalls = [];
        room.currentBall = null;
        room.winner = null;
        // Commission
        houseCommission += Math.floor(room.prizePool * 0.15);
      }
    } else if (room.status === 'LIVE') {
      if (room.winner) {
        // Finished
        room.status = 'FINISHED';
        setTimeout(() => {
          room.status = 'WAITING';
          room.countdown = 20;
          room.drawnBalls = [];
          room.currentBall = null;
          room.winner = null;
        }, 5000);
      } else if (room.drawnBalls.length < 75) {
        // Draw a new unique random ball (1-75)
        let newBall: number;
        do {
          newBall = Math.floor(Math.random() * 75) + 1;
        } while (room.drawnBalls.includes(newBall));

        room.drawnBalls.push(newBall);
        room.currentBall = newBall;

        // Auto-win trigger after 28 balls for bots if no one claimed
        if (room.drawnBalls.length >= 35 && !room.winner) {
          room.winner = {
            userId: 'bot-1',
            userName: 'አበበ (Abebe)',
            prize: Math.floor(room.prizePool * 0.85),
            cartelaNumber: 12,
          };
        }
      } else {
        // End if 75 balls reached
        room.status = 'FINISHED';
        setTimeout(() => {
          room.status = 'WAITING';
          room.countdown = 20;
          room.drawnBalls = [];
          room.currentBall = null;
          room.winner = null;
        }, 4000);
      }
    }
  });
}, 2500);

// Helper to get or create player
function getOrCreateUser(id: string, name: string) {
  let user = users.get(id);
  if (!user) {
    user = {
      id,
      name: name || 'Player',
      balance: 100, // 100 ETB free starter
      bonusClaimed: false,
    };
    users.set(id, user);
  }
  return user;
}

// REST API Endpoints
app.get('/api/rooms', (req, res) => {
  res.json({ ok: true, rooms });
});

app.get('/api/user/profile', (req, res) => {
  const userId = String(req.query.userId || 'anon');
  const name = String(req.query.name || 'Player');
  const user = getOrCreateUser(userId, name);
  res.json({ ok: true, profile: user });
});

app.post('/api/user/claim-bonus', (req, res) => {
  const { userId, name } = req.body;
  const user = getOrCreateUser(String(userId), String(name));
  if (!user.bonusClaimed) {
    user.balance += 100;
    user.bonusClaimed = true;
  }
  res.json({ ok: true, balance: user.balance });
});

app.post('/api/rooms/join', (req, res) => {
  const { roomId, userId, userName, cartelaNumber } = req.body;
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return res.status(404).json({ ok: false, error: 'Room not found' });

  const user = getOrCreateUser(String(userId), String(userName));
  if (user.balance < room.stake) {
    return res.status(400).json({ ok: false, error: 'Insufficient balance' });
  }

  // Deduct stake
  user.balance -= room.stake;
  room.prizePool += room.stake;
  room.currentPlayers += 1;
  room.occupiedCartelas[cartelaNumber] = user.id;

  res.json({ ok: true, room, newBalance: user.balance });
});

app.post('/api/rooms/claim-bingo', (req, res) => {
  const { roomId, userId, userName, cartelaNumber } = req.body;
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return res.status(404).json({ ok: false, error: 'Room not found' });

  if (!room.winner) {
    const prize = Math.floor(room.prizePool * 0.85);
    room.winner = {
      userId: String(userId),
      userName: String(userName),
      prize,
      cartelaNumber,
    };
    const user = getOrCreateUser(String(userId), String(userName));
    user.balance += prize;
  }

  res.json({ ok: true, room });
});

app.post('/api/deposit/submit', (req, res) => {
  const { userId, userName, amount, method, transactionId } = req.body;
  const user = getOrCreateUser(String(userId), String(userName));

  const dep: DepositRequest = {
    id: 'dep-' + Date.now(),
    userId: String(userId),
    userName: String(userName),
    amount: Number(amount),
    method,
    transactionId: String(transactionId),
    timestamp: Date.now(),
    status: systemConfig.autoPilotEnabled ? 'approved' : 'pending',
  };

  deposits.unshift(dep);

  if (systemConfig.autoPilotEnabled) {
    user.balance += Number(amount);
  }

  res.json({ ok: true, request: dep, balance: user.balance });
});

app.post('/api/withdraw/submit', (req, res) => {
  const { userId, userName, amount, method, accountOrPhone } = req.body;
  const user = getOrCreateUser(String(userId), String(userName));
  const amt = Number(amount);

  if (user.balance < amt) {
    return res.status(400).json({ ok: false, error: 'Insufficient balance' });
  }

  user.balance -= amt;

  const w: WithdrawalRequest = {
    id: 'wth-' + Date.now(),
    userId: String(userId),
    userName: String(userName),
    amount: amt,
    method,
    accountOrPhone: String(accountOrPhone),
    timestamp: Date.now(),
    status: 'pending',
  };

  withdrawals.unshift(w);
  res.json({ ok: true, request: w, balance: user.balance });
});

app.get('/api/user/transactions', (req, res) => {
  const userId = String(req.query.userId || '');
  const userDeps = deposits.filter((d) => d.userId === userId);
  const userWths = withdrawals.filter((w) => w.userId === userId);

  const list = [
    ...userDeps.map((d) => ({
      id: d.id,
      type: 'deposit' as const,
      amount: d.amount,
      title: `ገንዘብ ገቢ (${d.method === 'telebirr' ? 'ቴሌብር' : 'ንግድ ባንክ'})`,
      timestamp: d.timestamp,
      status: d.status === 'approved' ? ('completed' as const) : ('pending' as const),
      method: d.method,
    })),
    ...userWths.map((w) => ({
      id: w.id,
      type: 'withdrawal' as const,
      amount: w.amount,
      title: `ገንዘብ ወጪ (${w.method === 'telebirr' ? 'ቴሌብር' : 'ንግድ ባንክ'})`,
      timestamp: w.timestamp,
      status: w.status === 'approved' ? ('completed' as const) : ('pending' as const),
      method: w.method,
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  res.json({ ok: true, transactions: list });
});

app.get('/api/admin/overview', (req, res) => {
  res.json({
    ok: true,
    totalHouseCommission: houseCommission,
    systemConfig,
    deposits,
    withdrawals,
    registeredUsersCount: users.size,
    rooms,
  });
});

app.post('/api/admin/system-config', (req, res) => {
  const { telebirrNumber, cbeAccount, telebirrName, autoPilotEnabled } = req.body;
  if (telebirrNumber) systemConfig.telebirrNumber = String(telebirrNumber).trim();
  if (cbeAccount) systemConfig.cbeAccount = String(cbeAccount).trim();
  if (telebirrName) systemConfig.telebirrName = String(telebirrName).trim();
  if (autoPilotEnabled !== undefined) systemConfig.autoPilotEnabled = Boolean(autoPilotEnabled);

  res.json({ ok: true, systemConfig });
});

app.post('/api/admin/deposit/action', (req, res) => {
  const { id, action } = req.body;
  const dep = deposits.find((d) => d.id === id);
  if (!dep) return res.status(404).json({ ok: false });
  if (action === 'approve') {
    dep.status = 'approved';
    const u = users.get(dep.userId);
    if (u) u.balance += dep.amount;
  } else {
    dep.status = 'rejected';
  }
  res.json({ ok: true, dep });
});

app.post('/api/admin/withdraw/action', (req, res) => {
  const { id, action } = req.body;
  const w = withdrawals.find((item) => item.id === id);
  if (!w) return res.status(404).json({ ok: false });
  if (action === 'approve') {
    w.status = 'approved';
  } else {
    w.status = 'rejected';
    const u = users.get(w.userId);
    if (u) u.balance += w.amount; // Refund
  }
  res.json({ ok: true, w });
});

app.post('/api/admin/adjust-balance', (req, res) => {
  const { userId, amount } = req.body;
  const u = users.get(String(userId)) || getOrCreateUser(String(userId), 'User ' + userId);
  u.balance += Number(amount);
  res.json({ ok: true, balance: u.balance });
});

// Telegram Bot Integration
let activeBot: Bot | null = null;

async function launchBot(token: string) {
  if (activeBot) return;
  const bot = new Bot(token);
  activeBot = bot;

  const getPlayerWebAppUrl = (ctx: any): string => {
    let baseUrl = process.env.RENDER_EXTERNAL_URL || 'https://banana-bingo-live.onrender.com';
    if (!process.env.RENDER_EXTERNAL_URL && !process.env.IS_RENDER) {
      const tunnelUrl = getPublicWebAppUrl();
      if (tunnelUrl) baseUrl = tunnelUrl;
    }

    const userId = String(ctx?.from?.id || 'anon');
    const name = ctx?.from?.first_name || 'Player';
    const username = ctx?.from?.username || '';
    const sep = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${sep}userId=${encodeURIComponent(userId)}&name=${encodeURIComponent(name)}&username=${encodeURIComponent(username)}`;
  };

  bot.command(['start', 'play'], async (ctx) => {
    const url = getPlayerWebAppUrl(ctx);
    const kb = new InlineKeyboard()
      .webApp('🎮 ባናና ቢንጎን ክፈት (Play Now)', url)
      .row()
      .webApp('🎁 100 ብር ቦነስ ውሰድ (Claim 100 ETB)', url);

    await ctx.reply(
      `🎉 **እንኳን ወደ ባናና ቢንጎ (Banana Bingo) በደህና መጡ!** 🍌\n\n` +
      `🔥 **የቀጥታ የኢትዮጵያ ባለብዙ ተጫዋች ቢንጎ ጨዋታ!**\n` +
      `🎁 ለአዲስ ተጠቃሚ **100 ብር ቦነስ** በነፃ ተዘጋጅቷል!\n\n` +
      `ከታች ያለውን **«Play Now»** በመጫን ጨዋታውን ይጀምሩ! 👇`,
      { parse_mode: 'Markdown', reply_markup: kb }
    );
  });

  bot.command('balance', async (ctx) => {
    const u = getOrCreateUser(String(ctx.from.id), ctx.from.first_name);
    await ctx.reply(`💵 የአሁን ቀሪ ሂሳብዎ፦ *${u.balance} ETB*`, { parse_mode: 'Markdown' });
  });

  bot.command('admin', async (ctx) => {
    const url = getPlayerWebAppUrl(ctx);
    const kb = new InlineKeyboard().webApp('🖥️ የአድሚን ዴስክ ክፈት (PIN: 7788)', url);
    await ctx.reply(
      `🛡️ **ባናና ቢንጎ አድሚን ዴስክ**\n` +
      `📱 የቴሌብር ቁጥር፦ \`${systemConfig.telebirrNumber}\`\n` +
      `🏦 የንግድ ባንክ፦ \`${systemConfig.cbeAccount}\`\n\n` +
      `• \`/setphone 09XXXXXXXX\` - የቴሌብር ቁጥር ለመቀየር\n` +
      `• \`/setcbe 1000XXXXXXXX\` - የባንክ ሂሳብ ለመቀየር\n` +
      `• \`/stats\` - ሪፖርት ለማየት`,
      { parse_mode: 'Markdown', reply_markup: kb }
    );
  });

  bot.command('setphone', async (ctx) => {
    const parts = (ctx.message?.text || '').split(' ');
    if (parts.length < 2 || !parts[1].trim()) {
      return ctx.reply('⚠️ እባክዎ አዲሱን ስልክ ቁጥር ያስገቡ!\nምሳሌ፦ `/setphone 0989047970`', { parse_mode: 'Markdown' });
    }
    systemConfig.telebirrNumber = parts[1].trim();
    await ctx.reply(`✅ **የቴሌብር ቁጥርዎ ወደ \`${systemConfig.telebirrNumber}\` ተቀይሯል!**`, { parse_mode: 'Markdown' });
  });

  bot.command('setcbe', async (ctx) => {
    const parts = (ctx.message?.text || '').split(' ');
    if (parts.length < 2 || !parts[1].trim()) {
      return ctx.reply('⚠️ እባክዎ አዲሱን የባንክ ቁጥር ያስገቡ!\nምሳሌ፦ `/setcbe 1000123456789`', { parse_mode: 'Markdown' });
    }
    systemConfig.cbeAccount = parts[1].trim();
    await ctx.reply(`✅ **የንግድ ባንክ ቁጥርዎ ወደ \`${systemConfig.cbeAccount}\` ተቀይሯል!**`, { parse_mode: 'Markdown' });
  });

  bot.command('stats', async (ctx) => {
    await ctx.reply(
      `📊 **የፋይናንስ ሪፖርት:**\n` +
      `💰 የቤት ትርፍ (15%): *${houseCommission} ETB*\n` +
      `👥 ተጫዋቾች: *${users.size}*\n` +
      `📥 ዲፖዚቶች: *${deposits.length}*\n` +
      `📤 ወጪዎች: *${withdrawals.length}*`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.catch((err) => {
    const msg = String(err.message || err.error?.description || err);
    if (msg.includes('409') || msg.includes('Conflict')) {
      console.log('[Bot Notice] 24/7 Render server is active on Telegram. Dev server standby.');
      return;
    }
    console.error('[Bot Error]:', msg);
  });

  bot.start({
    onStart: () => console.log('Banana Bingo Bot is live and listening on Telegram!'),
  }).catch((err) => {
    const msg = String(err.message || err);
    if (msg.includes('409') || msg.includes('Conflict')) {
      console.log('[Bot Notice] 24/7 Render instance is polling. Local server safely idling.');
      return;
    }
    console.warn('[Bot Start Notice]:', msg);
  });
}

app.get('/api/telegram/status', (req, res) => {
  res.json({
    isRunning: Boolean(activeBot),
    activeGamesCount: rooms.filter((r) => r.status === 'LIVE').length,
  });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('./dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('./dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);

    const updateMenuButton = async (targetUrl: string) => {
      const botToken = process.env.TELEGRAM_BOT_TOKEN || '8926400387:AAE4JGcckrmVhIfT_ffd1hnyzbeIC4GfRs4';
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menu_button: {
              type: 'web_app',
              text: 'Play 🎮',
              web_app: { url: targetUrl },
            },
          }),
        });
        console.log('[Bot] Telegram Menu Button configured with URL:', targetUrl);
      } catch (err: any) {}
    };

    const permanentLiveUrl = process.env.RENDER_EXTERNAL_URL || 'https://banana-bingo-live.onrender.com';
    await updateMenuButton(permanentLiveUrl);
    console.log(`[Bot] Permanent 24/7 WebApp URL set to: ${permanentLiveUrl}`);

    if (!process.env.RENDER_EXTERNAL_URL) {
      try {
        await startPublicTunnel(PORT);
      } catch (e: any) {}
    }

    const token = process.env.TELEGRAM_BOT_TOKEN || '8926400387:AAE4JGcckrmVhIfT_ffd1hnyzbeIC4GfRs4';
    if (token) {
      try {
        await launchBot(token);
        console.log('Banana Bingo Bot is live and listening on Telegram!');
      } catch (err: any) {
        console.error('Failed to auto-launch bot:', err.message);
      }
    }
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
