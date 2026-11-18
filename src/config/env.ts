import "dotenv/config";


function getEnv<T>(name: string, defaultValue?: T): T {
  const value = process.env[name] ?? defaultValue;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value as T;
}

const env = {
  PORT: Number(getEnv("PORT", "3000")),
  NODE_ENV: getEnv("NODE_ENV", "development"),
  MONGODB_URI: getEnv("MONGODB_URI"),
  JWT_SECRET: getEnv<string>("JWT_SECRET"),
  JWT_EXPIRES_IN: getEnv<number>("JWT_EXPIRES_IN", 1 * 24 * 60 * 60),
  Node_ENV: getEnv("NODE_ENV", "development"),
};

if (!Number.isInteger(env.PORT) || env.PORT < 1 || env.PORT > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

if (env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters");
}

export default env;