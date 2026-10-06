export interface BingoCard {
  id: string;
  cartelaNumber: number; // 1 to 100
  grid: number[][]; // 5x5 grid (0 for FREE space in center)
  marked: boolean[][]; // 5x5 marked status
  hasBingo: boolean;
  oneAway: boolean; // True if player has 4/5 marked in any winning line!
  markedCount: number; // total marked numbers
  patterns: {
    row: boolean[];
    col: boolean[];
    diag1: boolean;
    diag2: boolean;
    fourCorners: boolean;
  };
}

export type RoomStake = 10 | 20 | 50 | 100 | 200;

export interface RoomPlayerInfo {
  id: string;
  name: string;
  cartelas: number[];
  markedCount: number;
  oneAway: boolean;
  avatarSeed: string;
}

export interface BetesebRoom {
  id: string;
  name: string;
  stake: number;
  minPlayers: number;
  maxPlayers: number;
  status: 'WAITING' | 'STARTING' | 'LIVE' | 'FINISHED';
  currentPlayers: number;
  countdown: number;
  prizePool: number;
  drawnBalls: number[];
  currentBall: number | null;
  winner: {
    userId: string;
    userName: string;
    prize: number;
    cartelaNumber: number;
    winningPattern?: string;
  } | null;
  occupiedCartelas: { [cartelaNumber: number]: string }; // cartelaNumber -> userId
  players?: RoomPlayerInfo[];
}

export interface PlayerProfile {
  id: string;
  name: string;
  username?: string;
  balance: number;
  bonusClaimed: boolean;
  isDemo?: boolean;
}

export interface TransactionItem {
  id: string;
  type: 'deposit' | 'withdrawal' | 'win' | 'bet' | 'bonus';
  amount: number;
  title: string;
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
  method?: 'telebirr' | 'cbe';
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: 'telebirr' | 'cbe';
  transactionId: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: 'telebirr' | 'cbe';
  accountOrPhone: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface LiveReaction {
  id: string;
  emoji: string;
  userName: string;
  x: number;
  y: number;
}
