/**
 * Error-related translations for Portuguese language
 * This file contains translations for error messages and validators
 */
export default {
  errors: {
    rateLimited: 'Muitas solicitações. Aguarde e tente novamente.',
    invalidRequest: 'Confira os dados inseridos.',
    requestFailed: 'A solicitação falhou. Tente novamente.',
    roomLimit: 'O limite de salas foi atingido. Tente novamente mais tarde.',
    forbidden: 'Você não tem permissão para realizar esta ação.',

    wrongPassword: 'Login, e-mail ou senha incorretos.',
    emailNotExist: 'Usuário com este e-mail não encontrado',
    loginNotExist: 'Usuário com este login não encontrado',
    emailAlreadyExist: 'Um usuário com este e-mail já está registrado',
    loginAlreadyExist: 'Um usuário com este login já está registrado',
    avatarNotExist: 'Avatar não existe',
    avatarNotAvailable: 'Este avatar não está disponível para você',
  },
  validators: {
    maxCharacters: 'Máximo de {count} caracteres',
    invalidName: 'Digite um nome sem caracteres de controle.',
    requiredField: 'Campo obrigatório',
    minCharacters: 'Mínimo {count} caracteres',
    spacesForbidden: 'Espaços não são permitidos',
    loginSymbols: 'Permitido: a-z, 0-9, _ . -',
  },
};
