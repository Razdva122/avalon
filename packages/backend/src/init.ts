import { config } from 'dotenv';

// Local secrets override checked-in defaults, but never override process environment.
config({ path: '.env.local' });

config({
  path: `.env.${process.env.NODE_ENV || 'development'}`,
});
