/**
 * Error-related translations for Spanish language
 * This file contains translations for error messages and validators
 */
export default {
  errors: {
    wrongPassword: 'Contraseña incorrecta',
    emailNotExist: 'Usuario con este email no encontrado',
    loginNotExist: 'Usuario con este login no encontrado',
    emailAlreadyExist: 'Un usuario con este email ya está registrado',
    loginAlreadyExist: 'Un usuario con este login ya está registrado',
    avatarNotExist: 'El avatar no existe',
    avatarNotAvailable: 'Este avatar no está disponible para ti',
  },
  validators: {
    requiredField: 'Campo obligatorio',
    minCharacters: 'Mínimo {count} caracteres',
    spacesForbidden: 'No se permiten espacios',
    loginSymbols: 'Caracteres permitidos: a-z, 0-9, _ . -',
  },
};
