import { ethers } from 'ethers';

import type { Network } from '../network';

const abi = ethers.Interface.from([
  'error NotFound()',
  'function property(uint256 tokenId, bytes32 key) view returns (bytes memory value)',
  'function tokenURI(uint256 tokenId) view returns (string memory)',
]);

export async function property(network: Network, target: string, tokenId: ethers.BigNumberish, key: string): Promise<string> {
  const contract = new ethers.Contract(target, abi, network.provider());

  const value = await contract.property.staticCall(tokenId, ethers.keccak256(ethers.toUtf8Bytes(key)));

  return ethers.toUtf8String(value);
}

export async function tokenURI(network: Network, target: string, tokenId: ethers.BigNumberish): Promise<string> {
  const contract = new ethers.Contract(target, abi, network.provider());

  return await contract.tokenURI.staticCall(tokenId);
}
