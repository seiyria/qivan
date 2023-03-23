import { Component, OnDestroy, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import {
  CombatAbilityTarget, IGameCombatAbility,
  IGameEncounter, IGameEncounterCharacter, IGameItem
} from '../../../../../../interfaces';
import { CombatState } from '../../../../../../stores';
import {
  EndCombat, EndCombatAndResetPlayer,
  LowerPlayerCooldown,
  ResetCombatSoft,
  TargetEnemyWithAbility, TargetSelfWithAbility, UseItemInSlot
} from '../../../../../../stores/combat/combat.actions';
import { ContentService } from '../../../../../services/content.service';
import { VisualsService } from '../../../../../services/visuals.service';

@Component({
  selector: 'app-combat-display',
  templateUrl: './combat-display.component.html',
  styleUrls: ['./combat-display.component.scss'],
})
export class CombatDisplayComponent implements OnInit, OnDestroy {

  public readonly debugActions = [
    { icon: 'bandage', text: 'Soft Reset Combat',         action: ResetCombatSoft },
    { icon: 'refresh', text: 'End Combat & Reset Player', action: EndCombatAndResetPlayer },
    { icon: 'trash',   text: 'End Combat (No Reset)',     action: EndCombat },
  ];

  public readonly selfTargets = [CombatAbilityTarget.All, CombatAbilityTarget.Self];
  public readonly enemyTargets = [CombatAbilityTarget.All, CombatAbilityTarget.AllEnemies, CombatAbilityTarget.Single];

  // TODO: activeAbilityInfo needs to be an array so all effects can happen - items that have multiple effects don't trigger correctly
  public activeItemIndex = -1;
  public activeAbilityIndex = -1;
  public activeAbilityInfo: IGameCombatAbility[] | undefined;

  public get firstAbilityForTargetting(): IGameCombatAbility | undefined {
    return this.activeAbilityInfo?.[0];
  }

  private hpSub!: Subscription;
  public hpDeltas: Record<string, Array<{ value: number }>> = {};

  @Select(CombatState.activeItems) activeItems$!: Observable<IGameItem[]>;
  @Select(CombatState.activeFoods) activeFoods$!: Observable<IGameItem[]>;
  @Select(CombatState.currentEncounter) currentEncounter$!: Observable<{ encounter: IGameEncounter; player: IGameEncounterCharacter }>;

  constructor(
    private store: Store,
    private contentService: ContentService,
    private visuals: VisualsService,
  ) { }

  ngOnInit() {
    this.hpSub = this.visuals.damage$.subscribe(({ slot, value }) => this.displayDamageNumber(slot, value));
  }

  ngOnDestroy() {
    this.hpSub?.unsubscribe();
  }

  displayItems(items: IGameItem[] = []) {
    return items.filter(Boolean);
  }

  getAbility(ability: string): IGameCombatAbility {
    return this.contentService.getAbilityByName(ability);
  }

  canDoAbility(player: IGameEncounterCharacter, ability: string, abilityIndex: number): boolean {
    const abilityRef = this.getAbility(ability);
    return !(player.cooldowns[abilityIndex] > 0) && player.currentEnergy >= abilityRef.energyCost;
  }

  canTargetSelf() {
    if(!this.firstAbilityForTargetting) {
      return false;
    }

    return this.selfTargets.includes(this.firstAbilityForTargetting.target);
  }

  canTargetEnemy(enemy: IGameEncounterCharacter) {
    if(!this.firstAbilityForTargetting) {
      return false;
    }

    if(enemy.currentHealth <= 0) {
      return false;
    }

    return this.enemyTargets.includes(this.firstAbilityForTargetting.target);
  }

  unselectAbility() {
    this.activeAbilityIndex = -1;
    this.activeAbilityInfo = undefined;
  }

  selectAbility(ability: string, abilityIndex: number) {
    this.unselectItem();

    if(this.activeAbilityIndex === abilityIndex) {
      this.unselectAbility();
      return;
    }

    this.activeAbilityIndex = abilityIndex;
    this.activeAbilityInfo = [this.getAbility(ability)];
  }

  unselectItem() {
    this.activeItemIndex = -1;
    this.activeAbilityInfo = undefined;
  }

  selectItem(item: IGameItem, itemIndex: number) {
    this.unselectAbility();

    if(this.activeItemIndex === itemIndex) {
      this.unselectItem();
      return;
    }

    this.activeItemIndex = itemIndex;
    if(item.effects) {
      this.activeAbilityInfo = item.effects.map(effect => this.getAbility(effect.effect));
    }
  }

  displayDamageNumber(slot: string, damage: number) {
    setTimeout(() => {
      this.hpDeltas[slot] = this.hpDeltas[slot] || [];
      this.hpDeltas[slot].push({ value: damage });
    }, 0);

    setTimeout(() => {
      this.hpDeltas[slot].shift();
    }, 1000);
  }

  targetEnemy(index: number, enemy: IGameEncounterCharacter, source: IGameEncounterCharacter, encounter: IGameEncounter) {
    if(!this.activeAbilityInfo || !this.canTargetEnemy(enemy)) {
      return;
    }

    const oldState = this.store.snapshot().combat;
    const useItem = oldState.activeItems[this.activeItemIndex];

    if(this.activeItemIndex >= 0) {
      this.store.dispatch(new UseItemInSlot(this.activeItemIndex));
    }

    const finish = () => {
      this.unselectAbility();
      this.unselectItem();
    };

    this.activeAbilityInfo.forEach(ability => {
      const targetting = ability.target;

      // hit all enemies only
      if(targetting === CombatAbilityTarget.AllEnemies) {
        this.store.dispatch([
          new LowerPlayerCooldown(),
          ...encounter.enemies.map((x, i) => new TargetEnemyWithAbility(i, source, ability, this.activeAbilityIndex, useItem))
        ]);

        finish();
        return;
      }

      // hit self and all enemies
      if(targetting === CombatAbilityTarget.All) {
        this.store.dispatch([
          new LowerPlayerCooldown(),
          ...encounter.enemies.map((x, i) => new TargetEnemyWithAbility(i, source, ability, this.activeAbilityIndex, useItem)),
          new TargetSelfWithAbility(ability, this.activeAbilityIndex, useItem)
        ]);

        finish();
        return;
      }

      // default: hit this enemy only
      this.store.dispatch([
        new LowerPlayerCooldown(),
        new TargetEnemyWithAbility(index, source, ability, this.activeAbilityIndex, useItem)
      ]);

      finish();
    });
  }

  targetSelf(self: IGameEncounterCharacter, encounter: IGameEncounter) {
    if(!this.activeAbilityInfo || !this.canTargetSelf()) {
      return;
    }

    const useItem = this.store.snapshot().combat.activeItems[this.activeItemIndex];

    if(this.activeItemIndex >= 0) {
      this.store.dispatch(new UseItemInSlot(this.activeItemIndex));
    }

    const finish = () => {
      this.unselectAbility();
      this.unselectItem();
    };

    this.activeAbilityInfo.forEach(ability => {
      const targetting = ability.target;

      // hit self and all enemies
      if(targetting === CombatAbilityTarget.All) {
        this.store.dispatch([
          new LowerPlayerCooldown(),
          ...encounter.enemies.map((x, i) => new TargetEnemyWithAbility(i, self, ability, this.activeAbilityIndex, useItem)),
          new TargetSelfWithAbility(ability, this.activeAbilityIndex, useItem)
        ]);

        finish();
        return;
      }

      // default: hit self only
      this.store.dispatch([
        new LowerPlayerCooldown(),
        new TargetSelfWithAbility(ability, this.activeAbilityIndex, useItem)
      ]);

      finish();
    });
  }

}
