import type { TRoles, TVisibleRole } from '@avalon/types';

export type TVisibility = {
  [key in TRoles]: TVisibleRole;
};
