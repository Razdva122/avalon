/**
 * Available roles for game
 */
export type TRoles = TOptionalRoles | TRequiredRoles;

export type TGoodRoles = TGoodOptionalRoles | TGoodRequiredRoles;

export type TEvilRoles = TEvilOptionalRoles | TEvilRequiredRoles;

export type TUnknownRoles = 'unknown' | 'mysteryWizard' | 'unknownLancelot';

/**
 * Good optional roles
 */
export type TGoodOptionalRoles =
  | 'merlin'
  | 'percival'
  | 'merlinPure'
  | 'tristan'
  | 'isolde'
  | 'goodLancelot'
  | 'guinevere'
  | 'troublemaker';

/**
 * Good required roles
 */
export type TGoodRequiredRoles = 'servant';

/**
 * Evil optional roles
 */
export type TEvilOptionalRoles =
  | 'morgana'
  | 'oberon'
  | 'mordred'
  | 'evilLancelot'
  | 'trickster'
  | 'lunatic'
  | 'brute'
  | 'witch';

/**
 * Evil required roles
 */
export type TEvilRequiredRoles = 'minion';

/**
 * Roles what can be added in game
 */
export type TOptionalRoles = TGoodOptionalRoles | TEvilOptionalRoles;

/**
 * Roles what cant be deleted from game
 */
export type TRequiredRoles = TEvilRequiredRoles | TGoodRequiredRoles;

/**
 * Available loyalty
 */
export type TLoyalty = 'evil' | 'good';

/**
 * Visible roles for other players,
 * They may differ from real roles
 */
export type TVisibleRole = TRoles | TUnknownRoles | 'evil' | 'good';
