/**
 * Error-related translations for English language
 * This file contains translations for error messages and validators
 */
export default {
  errors: {
    wrongPassword: 'Wrong password',
    emailNotExist: 'User with this email not found',
    loginNotExist: 'User with this login not found',
    emailAlreadyExist: 'A user with this email is already registered',
    loginAlreadyExist: 'A user with this login is already registered',
    avatarNotExist: 'Avatar not exist',
    avatarNotAvailable: 'This avatar is not available for you',
  },
  validators: {
    requiredField: 'Required field',
    minCharacters: 'Min {count} characters',
    spacesForbidden: 'Spaces are not allowed',
    loginSymbols: 'Allowed: a-z, 0-9, _ . -',
  },
};
