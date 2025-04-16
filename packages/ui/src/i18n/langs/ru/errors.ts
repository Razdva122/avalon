/**
 * Error-related translations for Russian language
 * This file contains translations for error messages and validators
 */
export default {
  errors: {
    loginNotExist: 'Пользователь с таким логином не найден',
    loginAlreadyExist: 'Пользователь с таким логином уже зарегистрирован',
    emailNotExist: 'Пользователь с таким email не найден',
    emailAlreadyExist: 'Пользователь с таким email уже зарегистрирован',
    wrongPassword: 'Неверный пароль',
    avatarNotExist: 'Аватар не существует',
    avatarNotAvailable: 'Этот аватар недоступен для вас',
  },
  validators: {
    requiredField: 'Обязательное поле',
    minCharacters: 'Минимум {count} символов',
    spacesForbidden: 'Пробелы запрещены',
    loginSymbols: 'Допустимые символы: a-z, 0-9, _ . -',
  },
};
