import { ref, watch } from 'vue';
import type { GameOptions } from '@avalon/types';
import { copyOptions } from './options-state';
import type { OptionsDraft } from './options-state';

export function useRoomOptions(source: () => GameOptions, publish: (options: GameOptions) => void) {
  const options = ref(copyOptions(source()));
  let confirmed = JSON.stringify(source());
  const pending: string[] = [];

  watch(
    source,
    (value) => {
      const key = JSON.stringify(value);
      if (key === confirmed) return;
      confirmed = key;
      const acknowledged = pending.indexOf(key);
      if (acknowledged !== -1) {
        pending.splice(0, acknowledged + 1);
        // Do not roll back newer local edits when an earlier broadcast arrives.
        if (pending.length) return;
      } else {
        pending.length = 0;
      }
      options.value = copyOptions(value);
    },
    { deep: true },
  );

  function applyOptions(next: OptionsDraft) {
    const value = copyOptions({
      roles: next.roles,
      addons: next.addons ?? options.value.addons,
      features: next.features ?? options.value.features,
    });
    options.value = value;
    pending.push(JSON.stringify(value));
    publish(copyOptions(value));
  }

  return { options, applyOptions };
}
