import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  servicem8ApiToken: string;
  mongodbUri: string;
  frontendUrl: string;
}

const getEnvVariable = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};

export const config: EnvConfig = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: getEnvVariable('NODE_ENV', 'development'),
  jwtSecret: getEnvVariable('JWT_SECRET'),
  jwtExpiresIn: getEnvVariable('JWT_EXPIRES_IN', '7d'),
  servicem8ApiToken: getEnvVariable('SERVICEM8_API_TOKEN'),
  mongodbUri: getEnvVariable('MONGODB_URI'),
  frontendUrl: getEnvVariable('FRONTEND_URL', 'http://localhost:3000'),
};

