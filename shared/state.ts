export type DisasterKind = 'meteor' | 'acidrain' | 'tornado';
export interface Villager {
  id: string; username: string; plot: number; color: string; damage: number;
  survived: number; streak: number; bestStreak: number; rebuilt: number;
  lastHitAt: number; lastRepairAt: number; milestoneAt: number; upgradedAt: number;
}
export interface Impact { houseId: string; blocked: boolean; amount: number; at: number; }
export interface Round {
  id: number; kind: DisasterKind; phase: 'active' | 'saved' | 'hit';
  startedAt: number; endsAt: number; outcomeEndsAt: number;
  defenderIds: string[]; atRiskIds: string[]; protectedIds: string[];
  row: number | null; hitCount: number; destroyedCount: number; impacts: Impact[];
}
export interface VillageState {
  villagers: Villager[]; capacity: number; twitchConnected: boolean;
  round: Round | null; serverTime: number; crownId: string | null;
}
