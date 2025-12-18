require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('ENV loaded:', !!process.env.DATABASE_URL);