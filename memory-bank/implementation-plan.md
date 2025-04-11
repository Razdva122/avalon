# Implementation Plan for User Profile Loading Refactoring

## 1. Create UserProfileHeader.vue Component

Create a new file at `packages/ui/src/components/stats/UserProfileHeader.vue` with the following content:

```vue
<template>
  <div v-if="userState.status === 'ready'" class="preview-profile">
    <Avatar class="avatar mr-2" :avatarID="userState.profile.avatar" />
    <div class="profile-info">
      <div class="profile-username">
        {{ userState.profile.name }}
      </div>
      <div class="info-hint">id: {{ uuid }}</div>
      <div class="profile-games">
        <div class="profile-games-counter">
          <span class="games-wins">
            {{ gameStats?.teams.total.wins }}
          </span>
          -
          <span class="games-loses">
            {{ gameStats?.teams.total.lose }}
          </span>
        </div>
        <div class="info-hint">games</div>
      </div>
      <div>
        <div class="profile-winrate">
          {{ `${gameStats?.teams.total.winrate} %` }}
        </div>
        <div class="info-hint">winrate</div>
      </div>
    </div>
  </div>
  <div v-else class="preview-profile-loading">
    <v-skeleton-loader type="image, text" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Avatar from '@/components/user/Avatar.vue';
import { useUserProfile } from '@/helpers/setup';

export default defineComponent({
  name: 'UserProfileHeader',
  components: {
    Avatar,
  },
  props: {
    uuid: {
      type: String,
      required: true,
    },
    gameStats: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const { userState } = useUserProfile(props.uuid);

    return {
      userState,
    };
  },
});
</script>

<style scoped lang="scss">
.avatar {
  width: 150px;
  height: 150px;
}

.preview-profile {
  display: flex;
}

.profile-info div {
  margin-bottom: 0px;
}

.profile-username {
  font-size: 24px;
}

.info-hint {
  font-size: 14px;
  opacity: 0.8;
  margin-top: -2px;
}

.games-wins {
  color: rgb(var(--v-theme-success));
}

.games-loses {
  color: rgb(var(--v-theme-error));
}

.profile-games-counter {
  background-color: rgb(var(--v-theme-inset));
  font-weight: 500;
  width: fit-content;
  padding: 0px 8px;
  border-radius: 8px;
}

.preview-profile-loading {
  width: 100%;
  max-width: 400px;
  padding: 20px 0;
}
</style>
```

## 2. Modify UserStats.vue

Update the UserStats.vue file with the following changes:

### Template Changes

Replace this section:

```vue
<div v-if="userState.status === 'ready'" class="preview-profile">
  <Avatar class="avatar mr-2" :avatarID="userState.profile.avatar" />
  <div class="profile-info">
    <div class="profile-username">
      {{ userState.profile.name }}
    </div>
    <div class="info-hint">id: {{ $props.uuid }}</div>
    <div class="profile-games">
      <div class="profile-games-counter">
        <span class="games-wins">
          {{ state?.teams.total.wins }}
        </span>
        -
        <span class="games-loses">
          {{ state?.teams.total.lose }}
        </span>
      </div>
      <div class="info-hint">games</div>
    </div>
    <div>
      <div class="profile-winrate">
        {{ `${state?.teams.total.winrate} %` }}
      </div>
      <div class="info-hint">winrate</div>
    </div>
  </div>
</div>
```

With:

```vue
<UserProfileHeader :uuid="$props.uuid" :gameStats="state" />
```

### Script Changes

1. Add import for the new component:

```js
import UserProfileHeader from '@/components/stats/UserProfileHeader.vue';
```

2. Add the component to the components list:

```js
components: {
  PreviewLink,
  Avatar,
  TeammateProfile,
  WinrateDisplay,
  UserRatings,
  UserProfileHeader,
},
```

3. Remove the userState computed property:

```js
const userState = computed(() => {
  return store.state.users[props.uuid] || { status: 'loading' };
});
```

4. Remove the store dispatch from the initState function:

```js
// Remove this line
store.dispatch('getUserPublicProfile', { uuid });
```

### CSS Changes

Remove the following CSS sections from UserStats.vue since they're now in UserProfileHeader.vue:

```css
.avatar {
  width: 150px;
  height: 150px;
}

.preview-profile {
  display: flex;
}

.profile-info div {
  margin-bottom: 0px;
}

.profile-username {
  font-size: 24px;
}

.info-hint {
  font-size: 14px;
  opacity: 0.8;
  margin-top: -2px;
}

.games-wins {
  color: rgb(var(--v-theme-success));
}

.games-loses {
  color: rgb(var(--v-theme-error));
}

.profile-games-counter {
  background-color: rgb(var(--v-theme-inset));
  font-weight: 500;
  width: fit-content;
  padding: 0px 8px;
  border-radius: 8px;
}
```

## 3. Testing Plan

After implementing these changes, test the following scenarios:

1. **Initial Load**: Verify that the user profile data loads correctly when first visiting the UserStats page
2. **Navigation**: Test navigating between different user stats pages by clicking on teammates/enemies
3. **Reactivity**: Ensure that the profile data updates correctly when the uuid changes
4. **Loading States**: Check that loading states are handled properly with appropriate UI feedback
5. **Styling**: Confirm that the styling remains consistent with the previous implementation

## 4. Expected Results

- The user profile data should load correctly using the useUserProfile composable
- The UI should look identical to the previous implementation
- The code should be more consistent with the rest of the application
- The profile data should update automatically when navigating between different user stats pages
