import { ethers } from 'ethers';

import type { Network } from '../network';

const abi = ethers.Interface.from([
  'error NotFound()',
  'function networkOf(uint256 tokenId) view returns (bytes32 network)',
  'function token(address owner) view returns (uint256)',
]);

export async function networkOf(network: Network, target: string, tokenId: ethers.BigNumberish): Promise<string> {
  const contract = new ethers.Contract(target, abi, network.provider());

  return await contract.networkOf.staticCall(tokenId);
}

export async function token(network: Network, target: string, owner: string): Promise<bigint> {
  const contract = new ethers.Contract(target, abi, network.provider());

  return await contract.token.staticCall(owner);
}
