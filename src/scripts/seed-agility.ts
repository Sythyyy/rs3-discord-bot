import { loadEnvironment } from '../config/env.js';
import { AgilityRepository } from '../infrastructure/agility/agility-repository.js';
import { createDatabase } from '../infrastructure/database/database.js';

const database = createDatabase(loadEnvironment().DATABASE_URL);
try { await new AgilityRepository(database).seedApprovedCatalogue(); console.log('Agility catalogue seeded.'); } finally { await database.end(); }
