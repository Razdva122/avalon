/**
 * Error-related translations for Chinese (Simplified) language
 * This file contains translations for error messages and validators
 */
export default {
  errors: {
    wrongPassword: '密码错误',
    emailNotExist: '找不到使用此电子邮件的用户',
    emailAlreadyExist: '此电子邮件已被注册',
    loginNotExist: '找不到使用此帳號的用戶',
    loginAlreadyExist: '此帳號已被註冊',
    avatarNotExist: '头像不存在',
    avatarNotAvailable: '此头像对您不可用',
  },
  validators: {
    requiredField: '必填项',
    minCharacters: '最少{count}个字符',
    spacesForbidden: '禁止使用空格',
    loginSymbols: '允许符号：a-z、0-9、_ . -',
  },
};
