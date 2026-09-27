/**
 * Error-related translations for Russian language
 * This file contains translations for error messages and validators
 */
export default {
  errors: {
    rateLimited: 'Слишком много запросов. Подождите и попробуйте снова.',
    invalidRequest: 'Проверьте введённые данные.',
    requestFailed: 'Не удалось выполнить запрос. Попробуйте снова.',
    roomLimit: 'Достигнут лимит комнат. Попробуйте позже.',
    forbidden: 'У вас нет прав на это действие.',

    loginNotExist: 'Пользователь с таким логином не найден',
    loginAlreadyExist: 'Пользователь с таким логином уже зарегистрирован',
    emailNotExist: 'Пользователь с таким email не найден',
    emailAlreadyExist: 'Пользователь с таким email уже зарегистрирован',
    wrongPassword: 'Неверный логин, email или пароль.',
    avatarNotExist: 'Аватар не существует',
    avatarNotAvailable: 'Этот аватар недоступен для вас',
  },
  validators: {
    maxCharacters: 'Максимум {count} символов',
    invalidName: 'Введите имя без управляющих символов.',
    requiredField: 'Обязательное поле',
    minCharacters: 'Минимум {count} символов',
    spacesForbidden: 'Пробелы запрещены',
    loginSymbols: 'Допустимые символы: a-z, 0-9, _ . -',
  },
};
