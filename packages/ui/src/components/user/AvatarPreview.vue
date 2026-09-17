<template>
  <button
    type="button"
    class="avatar-item"
    :class="{ 'is-selected': isSelected, 'is-locked': !avatar.available, 'has-error': hasError }"
    :aria-label="`${name}: ${isSelected ? $t('avatars.selected') : avatar.available ? $t('avatars.choose') : $t('avatars.howToUnlock')}`"
    :aria-pressed="avatar.available ? isSelected : undefined"
    :aria-describedby="describedBy"
    :aria-disabled="busy || undefined"
    @click="!busy && $emit('select', avatar)"
  >
    <span class="avatar-image">
      <Avatar :avatarID="avatar.id" alt="" />
      <span v-if="isSelected || !avatar.available || pending" class="avatar-badge" aria-hidden="true">
        <v-progress-circular v-if="pending" indeterminate :size="20" :width="2" />
        <span v-else class="material-icons">{{ isSelected ? 'check' : 'lock_outline' }}</span>
      </span>
    </span>
    <span class="avatar-name">{{ name }}</span>
    <span v-if="avatar.premium" class="premium-label">Premium</span>
    <span v-if="isSelected" class="avatar-state">{{ $t('avatars.selected') }}</span>
  </button>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { IAvatarInfo } from '@avalon/types';
import Avatar from '@/components/user/Avatar.vue';

export default defineComponent({
  components: { Avatar },
  props: {
    avatar: { type: Object as PropType<IAvatarInfo>, required: true },
    name: { type: String, required: true },
    isSelected: Boolean,
    hasError: Boolean,
    pending: Boolean,
    busy: Boolean,
    describedBy: String,
  },
  emits: ['select'],
});
</script>

<style scoped lang="scss">
.avatar-item {
  min-width: 0;
  padding: 4px;
  border: 2px solid transparent;
  border-radius: 10px;
  text-align: center;
  align-self: start;
  color: rgb(var(--v-theme-text-primary));
  cursor: pointer;

  &:hover {
    background: rgba(var(--v-theme-primary), 0.1);
  }
  &:focus-visible {
    outline: 3px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
  }
  &[aria-disabled='true'] {
    cursor: progress;
  }
  &.is-selected {
    border-color: rgb(var(--v-theme-primary));
  }
  &.has-error {
    border-color: rgb(var(--v-theme-error));
  }
}
.avatar-image {
  position: relative;
  display: block;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 5px;
  background: rgb(var(--v-theme-surface));

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
.is-locked img {
  filter: grayscale(1);
}
.avatar-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-text-primary));
  .material-icons {
    font-size: 20px;
  }
}
.is-selected .avatar-badge {
  color: rgb(var(--v-theme-primary));
}
.avatar-name {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.avatar-state {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  font-weight: 600;
}
.premium-label {
  display: inline-block;
  margin-top: 4px;
  padding: 1px 6px;
  border-radius: 4px;
  background: #e7c675;
  color: #382a0c;
  font-size: 11px;
  font-weight: 700;
}
</style>
