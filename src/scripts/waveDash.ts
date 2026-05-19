const LEADERBOARD_NAME = "fix-it-high-scores";
const SORT_DESCENDING = 1;
const DISPLAY_NUMERIC = 0;

interface LeaderboardResult {
  success: boolean;
  data?: { id: string };
  message?: string;
}

interface EntriesResult {
  success: boolean;
  data?: Array<{ score: number }>;
}

interface WavedashSdk {
  init(): void;
  getOrCreateLeaderboard(name: string, sort: number, display: number): Promise<LeaderboardResult>;
  uploadLeaderboardScore(leaderboardId: string, score: number, replace: boolean): Promise<unknown>;
  getMyLeaderboardEntries(leaderboardId: string): Promise<EntriesResult>;
}

declare global {
  interface Window {
    Wavedash?: WavedashSdk;
  }
}

let leaderboardId: string | null = null;

const isAvailable = (): boolean =>
  typeof window !== 'undefined' && typeof window.Wavedash !== 'undefined';

const boot = async (): Promise<void> => {
  const sdk = window.Wavedash;
  if (!sdk) return;

  try {
    sdk.init();

    const response = await sdk.getOrCreateLeaderboard(
      LEADERBOARD_NAME,
      SORT_DESCENDING,
      DISPLAY_NUMERIC
    );

    if (response.success && response.data) leaderboardId = response.data.id;
    else console.warn('[Wavedash] Failed to resolve leaderboard:', response.message);
  } catch (e) {
    console.warn('[Wavedash] boot failed:', e);
  }
};

const submitScore = async (score: number): Promise<void> => {
  const sdk = window.Wavedash;
  if (!sdk || !leaderboardId) return;

  try {
    await sdk.uploadLeaderboardScore(leaderboardId, score, true);
  } catch (e) {
    console.warn('[Wavedash] submitScore failed:', e);
  }
}

const loadHighScore = async (): Promise<number | null> => {
  const sdk = window.Wavedash;
  if (!sdk || !leaderboardId) return null;

  try {
    const res = await sdk.getMyLeaderboardEntries(leaderboardId);
    const first = res.data?.[0];
    if (res.success && first) return first.score;
  } catch (e) {
    console.warn('[Wavedash] loadHighScore failed:', e);
  }
  return null;
};

export const WaveDash = {
  isAvailable,
  boot,
  submitScore,
  loadHighScore,
}
