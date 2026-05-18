export type DiffToken = { word: string; type: 'same' | 'added' | 'removed' };

export function diffTokens(a: string, b: string): DiffToken[] {
  const wordsA = a.split(/\s+/).filter(w => w.length > 0);
  const wordsB = b.split(/\s+/).filter(w => w.length > 0);
  const m = wordsA.length;
  const n = wordsB.length;

  // Build LCS table
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (wordsA[i - 1] === wordsB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  const result: DiffToken[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && wordsA[i - 1] === wordsB[j - 1]) {
      result.unshift({ word: wordsA[i - 1], type: 'same' });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ word: wordsB[j - 1], type: 'added' });
      j--;
    } else {
      result.unshift({ word: wordsA[i - 1], type: 'removed' });
      i--;
    }
  }
  return result;
}

export function diffTexts(
  text1: string,
  text2: string
): { diff1: DiffToken[]; diff2: DiffToken[] } {
  const result = diffTokens(text1, text2);
  const diff1 = result.filter(t => t.type !== 'added');
  const diff2 = result.filter(t => t.type !== 'removed');
  return { diff1, diff2 };
}
