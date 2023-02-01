import { IGameItem, Stat } from './game';

export interface IGameEnemyThreat {
  name: string;
  icon: string;
  description: string;
  maxSkillGainLevel: number;

  level: { min: number; max: number };

  enemies: string[];
}

export interface IGameEncounterDrop {
  resource?: string;
  item?: string;

  amount: number;
}

export enum StatusEffectType {
  StatModification = 'StatModification',
  DamageOverTime = 'DamageOverTime',
}

export interface IGameStatusEffectBase {
  name: string;
  description: string;
  icon: string;
  color: string;
  turnsLeft: number;
  statusEffectType: StatusEffectType;
}

export type IGameStatusEffect = IGameStatusEffectBase
& {
  statModifications: Partial<Record<Stat, number>>;
}
& {
  damageOverTime: number;
};

export interface IGameEncounterCharacter {
  name: string;
  icon: string;
  stats: Record<Stat, number>;
  abilities: string[];
  currentHealth: number;
  maxHealth: number;
  currentEnergy: number;
  maxEnergy: number;
  currentSpeed: number;

  idleChance: number;
  drops: IGameEncounterDrop[];

  statusEffects: IGameStatusEffect[];

  // slot:cooldown turns
  cooldowns: Record<number, number>;
}

export interface IGameEncounter {
  enemies: IGameEncounterCharacter[];
  shouldResetPlayer: boolean;
  shouldGiveSkillPoint: boolean;
  isLocked: boolean;
  isLockedForEnemies: boolean;
  log: string[];
}

export interface IGameDungeon {
  layout: any;
}

export enum CombatAbilityTarget {
  Single = 'Single',
  Self = 'Self',
  AllEnemies = 'AllEnemies',
  Ally = 'Ally',
  All = 'All'
}

export enum CombatSkillType {
  Physical = 'Physical',
  Magical = 'Magical',
}

export interface IGameCombatAbilityEffect {
  effect: string;
  effectName?: string;
}

export interface IGameCombatAbility {
  name: string;
  description: string;
  icon: string;
  target: CombatAbilityTarget;
  type: CombatSkillType;
  stats: Array<{ stat: Stat; multiplier: number; variance: number }>;
  effects: IGameCombatAbilityEffect[];
  multiplier: number;
  cooldown: number;
  energyCost: number;
  requires: Record<string, number>;
  replaces?: string;
}

export interface IGameCombat {
  version: number;
  level: number;

  currentPlayer?: IGameEncounterCharacter;
  currentEncounter?: IGameEncounter;
  currentDungeon?: IGameDungeon;
  activeSkills: string[];
  activeItems: Array<IGameItem | undefined>;

  threatChangeTicks: number;
  threats: string[];
}

export interface IAttackParams {
  ability: IGameCombatAbility;
  statusEffect: IGameStatusEffect;
  useStats: Record<Stat, number>;
  source: IGameEncounterCharacter;
  target: IGameEncounterCharacter;
  allowBonusStats: boolean;
}

export interface ICombatDelta {
  target: 'target' | 'source';
  attribute: string;
  applyStatusEffect?: IGameStatusEffect;
  unapplyStatusEffect?: IGameStatusEffect;
  delta: number;
}