import { StateContext } from '@ngxs/store';

import { GameOption, IOptions } from '../../interfaces';
import { SetOption } from './options.actions';


export const defaultOptions: () => IOptions = () => ({
  version: 0,
  [GameOption.DebugMode]: false,
  [GameOption.ColorTheme]: 'worldseller',
  [GameOption.SidebarDisplay]: 'full',
  [GameOption.TickTimer]: 1,
  [GameOption.SoundMaster]: 0.5,
  [GameOption.SoundSFX]: 1,
  [GameOption.TelemetryErrors]: true,
  [GameOption.TelemetrySavefiles]: true,
});

export function setOption(ctx: StateContext<IOptions>, { option, value }: SetOption) {
  ctx.patchState({ [option]: value });
}
