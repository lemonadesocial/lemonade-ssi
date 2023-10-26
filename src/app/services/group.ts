import { LRUCache } from 'lru-cache';
import createError from '@fastify/error';

import { Group, GroupModel } from '../models/group';

export const GroupNotFoundError = createError('ERR_GROUP_NOT_FOUND', 'The group cannot be found.', 404);

const cache = new LRUCache<string, Promise<Group>>({ max: 1000 });

export async function getGroup(name: string) {
  let promise = cache.get(name);

  if (!promise) {
    promise = GroupModel.findOne({ active: true, name })
      .then((group) => group || Promise.reject(new GroupNotFoundError()))
      .catch((err) => { cache.delete(name); throw err; });

    cache.set(name, promise);
  }

  return await promise;
}
