

import { Injectable } from '@angular/core';
import { Selector, State } from '@ngxs/store';
import { attachAction } from '@seiyria/ngxs-attach-action';
import { IGameGathering } from '../../interfaces';
import { attachments } from './foraging.attachments';
import { defaultForaging } from './foraging.functions';

@State<IGameGathering>({
  name: 'foraging',
  defaults: defaultForaging()
})
@Injectable()
export class ForagingState {

  constructor() {
    attachments.forEach(({ action, handler }) => {
      attachAction(ForagingState, action, handler);
    });
  }

  @Selector()
  static level(state: IGameGathering) {
    return state.level;
  }

  @Selector()
  static currentLocation(state: IGameGathering) {
    if(!state.currentLocation) {
      return undefined;
    }

    return { location: state.currentLocation, duration: state.currentLocationDuration };
  }

}