/**
 * Error-related translations for Chinese (Traditional) language
 * This file contains translations for error messages and validators
 */
export default {
  errors: {
    rateLimited: '請求過於頻繁，請稍後重試。',
    invalidRequest: '請檢查輸入的資訊。',
    requestFailed: '請求失敗，請重試。',
    roomLimit: '房間數量已達上限，請稍後重試。',
    forbidden: '您無權執行此操作。',

    wrongPassword: '使用者名稱、電子郵件或密碼錯誤。',
    emailNotExist: '找不到使用此電子郵件的用戶',
    emailAlreadyExist: '此電子郵件已被註冊',
    loginNotExist: '找不到使用此账号的用户',
    loginAlreadyExist: '此账号已被注册',
    avatarNotExist: '頭像不存在',
    avatarNotAvailable: '此頭像對您不可用',
  },
  validators: {
    maxCharacters: '最多 {count} 個字元',
    invalidName: '請輸入不含控制字元的名稱。',
    requiredField: '必填欄位',
    minCharacters: '最少{count}個字元',
    spacesForbidden: '禁止使用空格',
    loginSymbols: '允許符號：a-z、0-9、_ . -',
  },
};
