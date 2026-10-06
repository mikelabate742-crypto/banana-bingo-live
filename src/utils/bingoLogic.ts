import { BingoCard } from '../types/bingo';

// Generate deterministic cartela (1 - 100) using seeded pseudo-random formula
export function generateCartela(cartelaNumber: number): BingoCard {
  // Seed random with cartelaNumber so cartela #X is ALWAYS identical across all devices and server
  let seed = cartelaNumber * 9301 + 49297;
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const getRandomSubarray = (arr: number[], size: number) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(pseudoRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, size).sort((a, b) => a - b);
  };

  // Standard 75-ball columns:
  // B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
  const bCol = getRandomSubarray(Array.from({ length: 15 }, (_, i) => i + 1), 5);
  const iCol = getRandomSubarray(Array.from({ length: 15 }, (_, i) => i + 16), 5);
  const nCol = getRandomSubarray(Array.from({ length: 15 }, (_, i) => i + 31), 4); // 4 because center is FREE (0)
  const gCol = getRandomSubarray(Array.from({ length: 15 }, (_, i) => i + 46), 5);
  const oCol = getRandomSubarray(Array.from({ length: 15 }, (_, i) => i + 61), 5);

  const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
  const marked: boolean[][] = Array.from({ length: 5 }, () => Array(5).fill(false));

  for (let r = 0; r < 5; r++) {
    grid[r][0] = bCol[r];
    grid[r][1] = iCol[r];
    if (r < 2) {
      grid[r][2] = nCol[r];
    } else if (r === 2) {
      grid[r][2] = 0; // FREE space
      marked[r][2] = true;
    } else {
      grid[r][2] = nCol[r - 1];
    }
    grid[r][3] = gCol[r];
    grid[r][4] = oCol[r];
  }

  return {
    id: `cartela-${cartelaNumber}`,
    cartelaNumber,
    grid,
    marked,
    hasBingo: false,
    oneAway: false,
    markedCount: 1, // center free is marked
    patterns: {
      row: [false, false, false, false, false],
      col: [false, false, false, false, false],
      diag1: false,
      diag2: false,
      fourCorners: false,
    },
  };
}

export function evaluateBingo(card: BingoCard): {
  hasBingo: boolean;
  winningPattern: string;
  oneAway: boolean;
  markedCount: number;
} {
  const m = card.marked;
  let hasBingo = false;
  let winningPattern = '';
  let oneAway = false;
  let markedCount = 0;

  // Count total marked
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (m[r][c]) markedCount++;
    }
  }

  // Check 5 horizontal rows
  for (let r = 0; r < 5; r++) {
    const rowMarked = [m[r][0], m[r][1], m[r][2], m[r][3], m[r][4]].filter(Boolean).length;
    if (rowMarked === 5) {
      hasBingo = true;
      winningPattern = `ረድፍ ${r + 1} (Row ${r + 1})`;
    } else if (rowMarked === 4) {
      oneAway = true;
    }
  }

  // Check 5 vertical columns
  for (let c = 0; c < 5; c++) {
    const colMarked = [m[0][c], m[1][c], m[2][c], m[3][c], m[4][c]].filter(Boolean).length;
    if (colMarked === 5) {
      hasBingo = true;
      winningPattern = `አምድ ${['B', 'I', 'N', 'G', 'O'][c]} (Col ${['B', 'I', 'N', 'G', 'O'][c]})`;
    } else if (colMarked === 4) {
      oneAway = true;
    }
  }

  // Check diagonal 1 (\)
  const d1Marked = [m[0][0], m[1][1], m[2][2], m[3][3], m[4][4]].filter(Boolean).length;
  if (d1Marked === 5) {
    hasBingo = true;
    winningPattern = 'ሰያፍ ↘ (Diagonal ↘)';
  } else if (d1Marked === 4) {
    oneAway = true;
  }

  // Check diagonal 2 (/)
  const d2Marked = [m[0][4], m[1][3], m[2][2], m[3][1], m[4][0]].filter(Boolean).length;
  if (d2Marked === 5) {
    hasBingo = true;
    winningPattern = 'ሰያፍ ↗ (Diagonal ↗)';
  } else if (d2Marked === 4) {
    oneAway = true;
  }

  // Check 4 corners
  const cornersMarked = [m[0][0], m[0][4], m[4][0], m[4][4]].filter(Boolean).length;
  if (cornersMarked === 4) {
    hasBingo = true;
    winningPattern = '4 ማዕዘናት (4 Corners)';
  } else if (cornersMarked === 3) {
    oneAway = true;
  }

  return { hasBingo, winningPattern, oneAway, markedCount };
}

export function getLetterForNumber(num: number): string {
  if (num <= 15) return 'B';
  if (num <= 30) return 'I';
  if (num <= 45) return 'N';
  if (num <= 60) return 'G';
  return 'O';
}

export function getAmharicLetterAndNumber(num: number): { letter: string; amharicName: string } {
  const letter = getLetterForNumber(num);
  const amharicLetter = letter === 'B' ? 'ቢ' : letter === 'I' ? 'አይ' : letter === 'N' ? 'ኤን' : letter === 'G' ? 'ጂ' : 'ኦ';
  return { letter, amharicName: `${amharicLetter} - ${num}` };
}
