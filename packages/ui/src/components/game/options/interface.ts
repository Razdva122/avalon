import type { TOptionalRoles } from '@avalon/types';

export type TRolesOptions = {
  [key in TOptionalRoles]: boolean;
};
