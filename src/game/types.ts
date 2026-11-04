export type Round = 1 | 2;

export type ClerkState = 'at_till' | 'walking_to_shaker' | 'mixing' | 'walking_to_till';

export type CustomerCategory = 'TRADE_LARGE' | 'MIX_SMALL' | 'ADVICE';

export interface Customer {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly paletteIndex: number;
  readonly category: CustomerCategory;
  readonly tins: number;
  readonly val: number;
  readonly name: string;
  readonly bubble: string;
  readonly maxPatience: number;
  readonly patience: number;
  readonly isLeaving: boolean;
}

export interface Clerk {
  readonly x: number;
  readonly y: number;
  readonly state: ClerkState;
  readonly tinsRemaining: number;
  readonly busyTimer: number;
  readonly busyMax: number;
}

export type FloaterKind = 'gain' | 'loss' | 'hub';

export interface Floater {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly kind: FloaterKind;
  readonly alpha: number;
}

export interface Stats {
  readonly captured: number;
  readonly lost: number;
  readonly walkouts: number;
  readonly unmannedSeconds: number;
  readonly hubOrders: number;
}

export interface SimState {
  readonly round: Round;
  readonly shiftActive: boolean;
  readonly framesLeft: number;
  readonly spawnTimer: number;
  readonly nextCustomerId: number;
  readonly queue: readonly Customer[];
  readonly floaters: readonly Floater[];
  readonly clerk: Clerk;
  readonly stats: Stats;
  readonly round1Stats: Stats | null;
  readonly dialogue: string;
}

export type SimEvent =
  | { readonly type: 'chime' }
  | { readonly type: 'whoosh' }
  | { readonly type: 'coins' }
  | { readonly type: 'humStart' }
  | { readonly type: 'humStop' }
  | { readonly type: 'dialogue'; readonly text: string }
  | {
      readonly type: 'roundEnded';
      readonly round: Round;
      readonly stats: Stats;
      /** Present when Round 2 ends: the Round 1 stats it is compared against. */
      readonly round1Stats: Stats | null;
    };

export interface SimResult {
  readonly state: SimState;
  readonly events: readonly SimEvent[];
}
