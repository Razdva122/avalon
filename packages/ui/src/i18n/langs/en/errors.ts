/**
 * Error-related translations for English language
 * This file contains translations for error messages and validators
 */
export default {
  errors: {
    rateLimited: 'Too many requests. Please wait and try again.',
    invalidRequest: 'Please check the information you entered.',
    requestFailed: 'The request failed. Please try again.',
    roomLimit: 'The room limit has been reached. Please try again later.',
    forbidden: 'You do not have permission to perform this action.',

    wrongPassword: 'Incorrect login, email or password.',
    emailNotExist: 'User with this email not found',
    loginNotExist: 'User with this login not found',
    emailAlreadyExist: 'A user with this email is already registered',
    loginAlreadyExist: 'A user with this login is already registered',
    avatarNotExist: 'Avatar not exist',
    avatarNotAvailable: 'This avatar is not available for you',
  },
  validators: {
    maxCharacters: 'Maximum {count} characters',
    invalidName: 'Enter a name without control characters.',
    requiredField: 'Required field',
    minCharacters: 'Min {count} characters',
    spacesForbidden: 'Spaces are not allowed',
    loginSymbols: 'Allowed: a-z, 0-9, _ . -',
  },
};
