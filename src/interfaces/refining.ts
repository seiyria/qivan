
export interface IGameRecipe {
  result: string;
  ingredients: Record<string, number>;
  level: { min: number; max: number };
  perCraft: { min: number; max: number };
  craftTime: number;
  preserve?: string[];
  require?: string[];
  maxWorkers: number;
}

export interface IGameRefiningRecipe {
  recipe: IGameRecipe;
  totalDurationInitial: number;
  totalLeft: number;
  durationPer: number;
  currentDuration: number;
}

export interface IGameRefiningOptions {
  hideDiscovered: boolean;
  hideNew: boolean;
  hideHasIngredients: boolean;
  hideHasNoIngredients: boolean;
}

export type IGameRefining = {
  version: number;
  unlocked: boolean;
  level: number;
  queueSize: number;
  recipeQueue: IGameRefiningRecipe[];
} & IGameRefiningOptions;
