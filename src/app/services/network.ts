import { ethers } from 'ethers';
import * as assert from 'assert';
import createError from '@fastify/error';

import { Network as NetworkClass, NetworkModel } from '../models/network';

export const NetworkInvalidError = createError('ERR_NETWORK_INVALID', 'The network is invalid.', 422);

export class Network extends NetworkClass {
  private _hash?: string;
  private _provider?: ethers.AbstractProvider;

  public constructor(network: NetworkClass) {
    super();

    Object.assign(this, network);
  }

  public hash() {
    if (!this._hash) {
      this._hash = ethers.keccak256(ethers.toUtf8Bytes(this.name));
    }

    return this._hash;
  }

  public provider() {
    if (!this._provider) {
      this._provider = new ethers.JsonRpcProvider(this.providerUrl);
    }

    return this._provider;
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
