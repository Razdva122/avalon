export const backendPort = 3000;
export const frontendURL = process.env.NODE_ENV === 'production' ? 'avalon-game.com' : 'http://localhost:8080';

// Dev servers can use another port when 8080 is already occupied.
export const frontendOrigin =
  process.env.NODE_ENV === 'production' ? frontendURL : /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
