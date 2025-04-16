/**
 * Error-related translations for Portuguese language
 * This file contains translations for error messages and validators
 */
export default {
  errors: {
    wrongPassword: 'Senha incorreta',
    emailNotExist: 'Usuário com este e-mail não encontrado',
    loginNotExist: 'Usuário com este login não encontrado',
    emailAlreadyExist: 'Um usuário com este e-mail já está registrado',
    loginAlreadyExist: 'Um usuário com este login já está registrado',
    avatarNotExist: 'Avatar não existe',
    avatarNotAvailable: 'Este avatar não está disponível para você',
  },
  validators: {
    requiredField: 'Campo obrigatório',
    minCharacters: 'Mínimo {count} caracteres',
    spacesForbidden: 'Espaços não são permitidos',
    loginSymbols: 'Permitido: a-z, 0-9, _ . -',
  },
};
