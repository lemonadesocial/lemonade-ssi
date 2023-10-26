import { createPublicClient, http, keccak256, PublicClient, stringToBytes } from 'viem';
import * as assert from 'node:assert';
import createError from '@fastify/error';

import { Network as NetworkClass, NetworkModel } from '../models/network';

export const NetworkInvalidError = createError('ERR_NETWORK_INVALID', 'The network is invalid.', 422);

export class Network extends NetworkClass {
  private _client?: PublicClient;
  private _hash?: string;

  public constructor(network: NetworkClass) {
    super();

    Object.assign(this, network);
  }

  public client() {
    if (!this._client) {
      this._client = createPublicClient({ transport: http(this.rpcUrl, { fetchOptions: { keepalive: true } }) });
    }

    return this._client;
  }

  public hash() {
    if (!this._hash) {
      this._hash = keccak256(stringToBytes(this.name));
    }

    return this._hash;
  }
}

const networkByName: Record<string, Network> = {};
const networkByHash: Record<string, Network> = {};

export async function init() {
  const documents = await NetworkModel.find({ active: true }).lean();

  documents.forEach((document) => {
    const network = new Network(document);

    networkByName[network.name] = networkByHash[network.hash()] = network;
  });
}

export function getNetworkByName(name: string) {
  assert.ok(networkByName[name], new NetworkInvalidError());

  return networkByName[name];
}

export function getNetworkByHash(hash: string) {
  assert.ok(networkByHash[hash], new NetworkInvalidError());

  return networkByHash[hash];
}
