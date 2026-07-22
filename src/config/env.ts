import { z } from 'zod';

const environmentSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().min(1),
  DATABASE_URL: z.string().url(),
  DISCORD_GUILD_ID: z.string().min(1).optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  GAME_SPEED_MULTIPLIER: z.coerce.number().positive().default(0.23),
  BUTTON_SIGNING_SECRET: z.string().min(16).optional(),
});

export type Environment = z.infer<typeof environmentSchema>;

const databaseEnvironmentSchema = environmentSchema.pick({ DATABASE_URL: true });

export type DatabaseEnvironment = z.infer<typeof databaseEnvironmentSchema>;

export function loadEnvironment(source: NodeJS.ProcessEnv = process.env): Environment {
  return environmentSchema.parse(source);
}

export function loadDatabaseEnvironment(
  source: NodeJS.ProcessEnv = process.env,
): DatabaseEnvironment {
  return databaseEnvironmentSchema.parse(source);
}
