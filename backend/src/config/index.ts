import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://allianzgpt:allianzgpt123@localhost:5432/allianzgpt',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },

  auth: {
    accessPassword: process.env.ACCESS_PASSWORD || 'default-password',
  },

  upload: {
    maxFileSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/csv',
      'text/markdown',
      'application/json',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
};
