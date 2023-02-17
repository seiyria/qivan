import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { sortBy } from 'lodash';
import { Observable } from 'rxjs';
import { IGameRecipe, IGameRefiningRecipe, IGameWorkersRefining } from '../../../interfaces';
import { AssignRefiningWorker, UnassignRefiningWorker } from '../../../stores/workers/workers.actions';
import { canCraftRecipe } from '../../helpers';
import { ItemCreatorService } from '../../services/item-creator.service';

@Component({
  selector: 'app-refining-page-display',
  templateUrl: './refining-page-display.component.html',
  styleUrls: ['./refining-page-display.component.scss'],
})
export class RefiningPageDisplayComponent implements OnInit {

  @Input() tradeskill = '';
  @Input() level$!: Observable<number>;
  @Input() currentQueue$!: Observable<{ queue: IGameRefiningRecipe[]; size: number }>;
  @Input() resources$!: Observable<Record<string, number>>;
  @Input() refiningWorkers$!: Observable<{
    workerAllocations: IGameWorkersRefining[];
    canAssignWorker: boolean;
    hasWorkers: boolean;
  }>;

  @Input() locationData: { recipes: IGameRecipe[] } = { recipes: [] };
  @Input() startAction: any;
  @Input() cancelAction: any;

  public amounts: Record<string, number> = {};

  constructor(private store: Store, private itemCreatorService: ItemCreatorService) {}

  ngOnInit() {}

  isQueueFull(queueInfo: { queue: IGameRefiningRecipe[]; size: number } | null): boolean {
    if(!queueInfo) {
      return false;
    }

    const { queue, size } = queueInfo;
    return queue.length >= size;
  }

  trackBy(index: number) {
    return index;
  }

  iconForRecipe(recipe: IGameRecipe) {
    return this.itemCreatorService.iconFor(recipe.result);
  }

  modifyAmount(recipe: IGameRecipe, amount: number) {
    this.amounts[recipe.result] = (this.amounts[recipe.result] || 1) + amount;
  }

  visibleRecipes(resources: Record<string, number>, recipes: IGameRecipe[]): IGameRecipe[] {
    const validRecipes = recipes.filter((recipe: IGameRecipe) => {
      const required = recipe.require || [];
      return required.every((req) => resources[req] > 0);
    });

    return sortBy(validRecipes, 'result');
  }

  canCraftRecipe(resources: Record<string, number>, recipe: IGameRecipe, amount = 1): boolean {
    return canCraftRecipe(resources, recipe, amount);
  }

  craft(recipe: IGameRecipe, amount = 1) {
    this.amounts[recipe.result] = 1;

    this.store.dispatch(new this.startAction(recipe, amount));
  }

  cancel(jobIndex: number) {
    this.store.dispatch(new this.cancelAction(jobIndex));
  }

  workersAllocatedToRecipe(allWorkers: IGameWorkersRefining[], recipe: IGameRecipe): number {
    return allWorkers.filter(w => w.recipe.result === recipe.result && w.tradeskill === this.tradeskill).length;
  }

  assignWorker(recipe: IGameRecipe) {
    this.store.dispatch(new AssignRefiningWorker(this.tradeskill, recipe));
  }

  unassignWorker(recipe: IGameRecipe) {
    this.store.dispatch(new UnassignRefiningWorker(this.tradeskill, recipe));
  }

}
