import { Component, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { Observable, first } from 'rxjs';
import { IGameRefiningOptions, IGameRefiningRecipe, IGameWorkersRefining } from '../../../../../interfaces';
import { CharSelectState, WeavingState, WorkersState } from '../../../../../stores';

import { CancelWeavingJob, ChangeWeavingFilterOption, StartWeavingJob } from '../../../../../stores/weaving/weaving.actions';
import { setDiscordStatus } from '../../../../helpers/electron';
import { ContentService } from '../../../../services/content.service';

@Component({
  selector: 'app-weaving',
  templateUrl: './weaving.page.html',
  styleUrls: ['./weaving.page.scss'],
})
export class WeavingPage implements OnInit {

  public get locationData() {
    return this.contentService.getWeavingRecipes();
  }

  public get startAction() {
    return StartWeavingJob;
  }

  public get cancelAction() {
    return CancelWeavingJob;
  }

  public get optionAction() {
    return ChangeWeavingFilterOption;
  }

  @Select(WeavingState.level) level$!: Observable<number>;
  @Select(WeavingState.currentQueue) currentQueue$!: Observable<{ queue: IGameRefiningRecipe[]; size: number }>;
  @Select(WeavingState.options) options$!: Observable<IGameRefiningOptions>;

  @Select(CharSelectState.activeCharacterDiscoveries) discoveries$!: Observable<Record<string, boolean>>;
  @Select(CharSelectState.activeCharacterResources) resources$!: Observable<Record<string, number>>;
  @Select(WorkersState.refiningWorkers) refiningWorkers$!: Observable<{
    workerAllocations: IGameWorkersRefining[];
    canAssignWorker: boolean;
    hasWorkers: boolean;
  }>;

  constructor(private contentService: ContentService) { }

  ngOnInit() {
    this.level$.pipe(first()).subscribe(level => {
      this.currentQueue$.pipe(first()).subscribe(currentQueue => {
        const state = currentQueue.queue.length > 0
          ? `Weaving Lv.${level} @ ${currentQueue.queue[0].recipe.result}...`
          : `Weaving Lv.${level}, browsing...`;

        setDiscordStatus({
          state
        });
      });
    });
  }
}
