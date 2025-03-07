import { UserForUI } from '@avalon/types';
import { config } from '@/config';
import jwt from 'jsonwebtoken';

export const generateJWT = (user: UserForUI): string => {
  return jwt.sign(user, config.SECRET_KEY, { expiresIn: '7d' });
};

export const validateJWT = (token: string) => {
  return jwt.verify(token, config.SECRET_KEY) as UserForUI;
};
