/**
 * Error-related translations for Chinese (Traditional) language
 * This file contains translations for error messages and validators
 */
export default {
  errors: {
    wrongPassword: '密碼錯誤',
    emailNotExist: '找不到使用此電子郵件的用戶',
    emailAlreadyExist: '此電子郵件已被註冊',
    loginNotExist: '找不到使用此账号的用户',
    loginAlreadyExist: '此账号已被注册',
    avatarNotExist: '頭像不存在',
    avatarNotAvailable: '此頭像對您不可用',
  },
  validators: {
    requiredField: '必填欄位',
    minCharacters: '最少{count}個字元',
    spacesForbidden: '禁止使用空格',
    loginSymbols: '允許符號：a-z、0-9、_ . -',
  },
};
