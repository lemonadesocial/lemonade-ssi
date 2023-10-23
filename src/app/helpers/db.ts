import mongoose from 'mongoose';

import { databaseDebug, databaseUrl } from '../../config';

mongoose.set('debug', databaseDebug);

export async function connect() {
  await mongoose.connect(databaseUrl);
}

export async function disconnect() {
  await mongoose.disconnect();
}
