/**
 * Available roles for game
 */
export type TRoles = TOptionalRoles | TRequiredRoles;

/**
 * Roles what can be added in game
 */
export type TOptionalRoles = 'merlin' | 'morgana' | 'oberon' | 'mordred';

/**
 * Roles what cant be deleted from game
 */
export type TRequiredRoles = 'minion' | 'servant';

/**
 * Available loyalty
 */
export type TLoyalty = 'evil' | 'good';

/**
 * Visible roles for other players,
 * They may differ from real roles
 */
export type TVisibleRole = TRoles | 'unknown' | 'evil';