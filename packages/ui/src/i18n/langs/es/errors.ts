/**
 * Error-related translations for Spanish language
 * This file contains translations for error messages and validators
 */
export default {
  errors: {
    rateLimited: 'Demasiadas solicitudes. Espera e inténtalo de nuevo.',
    invalidRequest: 'Revisa los datos introducidos.',
    requestFailed: 'La solicitud falló. Inténtalo de nuevo.',
    roomLimit: 'Se ha alcanzado el límite de salas. Inténtalo más tarde.',
    forbidden: 'No tienes permiso para realizar esta acción.',

    wrongPassword: 'Usuario, correo o contraseña incorrectos.',
    emailNotExist: 'Usuario con este email no encontrado',
    loginNotExist: 'Usuario con este login no encontrado',
    emailAlreadyExist: 'Un usuario con este email ya está registrado',
    loginAlreadyExist: 'Un usuario con este login ya está registrado',
    avatarNotExist: 'El avatar no existe',
    avatarNotAvailable: 'Este avatar no está disponible para ti',
  },
  validators: {
    maxCharacters: 'Máximo {count} caracteres',
    invalidName: 'Introduce un nombre sin caracteres de control.',
    requiredField: 'Campo obligatorio',
    minCharacters: 'Mínimo {count} caracteres',
    spacesForbidden: 'No se permiten espacios',
    loginSymbols: 'Caracteres permitidos: a-z, 0-9, _ . -',
  },
};
