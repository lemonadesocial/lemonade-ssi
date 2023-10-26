import { Address, BaseError, ContractFunctionRevertedError, hexToString, keccak256, stringToBytes } from 'viem';
import * as assert from 'node:assert';
import * as path from 'node:path';
import Canvas, { createCanvas, loadImage } from 'canvas';
import type { FastifyError, FastifyPluginCallback, FastifyReply, FastifyRequest, RouteHandlerMethod } from 'fastify';

import { LayerType } from '../models/partials/layer';

import { getGroup } from '../services/group';
import { getNetworkByHash, getNetworkByName } from '../services/network';

import { baseAbi, passportAbi } from '../constants';

const fonts = path.join(__dirname, '../../../fonts');
Canvas.registerFont(fonts + '/Agdasima.ttf', { family: 'Agdasima' });
Canvas.registerFont(fonts + '/Bungee.ttf', { family: 'Bungee' });

const tokenIdHandler: RouteHandlerMethod = async (request, reply) => {
  const params = request.params as { group: string; tokenId: bigint };

  const group = await getGroup(params.group);

  const baseNetwork = getNetworkByName(group.baseNetwork);

  const [networkOf] = await baseNetwork.client().multicall({
    contracts: [
      {
        address: group.baseAddress,
        abi: baseAbi,
        functionName: 'networkOf',
        args: [params.tokenId],
      },
    ],
    multicallAddress: baseNetwork.multicallAddress,
  });

  if (networkOf.status === 'failure') {
    throw networkOf.error;
  }

  const passportNetwork = getNetworkByHash(networkOf.result);
  const passportAddress = group.passportMap.get(passportNetwork.name);

  assert.ok(passportAddress);

  const [tokenURI, avatar] = await passportNetwork.client().multicall({
    contracts: [
      {
        address: passportAddress,
        abi: passportAbi,
        functionName: 'tokenURI',
        args: [params.tokenId],
      },
      {
        address: passportAddress,
        abi: passportAbi,
        functionName: 'property',
        args: [params.tokenId, keccak256(stringToBytes('avatar'))],
      },
    ],
    multicallAddress: passportNetwork.multicallAddress,
  });

  if (tokenURI.status === 'failure') {
    throw tokenURI.error;
  }

  const metadata = JSON.parse(Buffer.from(tokenURI.result.substring('data:application/json;base64,'.length), 'base64').toString()) as { image: string };

  const image = await loadImage(metadata.image);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  if (group.layers?.length || passportNetwork.layers?.length) {
    const layers = [
      ...group.layers || [],
      ...passportNetwork.layers || [],
    ].sort(((a, b) => a.z - b.z));

    const promises = await Promise.allSettled(layers.map((layer) => {
      switch(layer.type) {
        case LayerType.Avatar:
          if (avatar.status === 'success' && avatar.result !== '0x') return loadImage(hexToString(avatar.result));
          break;
        case LayerType.Image:
          if (layer.src) return loadImage(layer.src);
          break;
      }
    }));

    layers.forEach((layer, i) => {
      const promise = promises[i];

      switch (layer.type) {
        case LayerType.Avatar:
        case LayerType.Image:
          if (promise.status === 'fulfilled' && promise.value) {
            if (layer.r) {
              ctx.save();
              ctx.beginPath();
              ctx.arc(layer.x, layer.y, layer.r, 0, Math.PI * 2);
              ctx.clip();
              ctx.drawImage(promise.value, layer.x - layer.r, layer.y - layer.r, layer.r * 2, layer.r * 2);
              ctx.restore();
            } else if (layer.w && layer.h) {
              ctx.drawImage(promise.value, layer.x, layer.y, layer.w, layer.h);
            } else {
              ctx.drawImage(promise.value, layer.x, layer.y);
            }
          }
          break;
      }
    });
  }

  reply.type('image/png');
  return canvas.createPNGStream();
};

const ownerHandler: RouteHandlerMethod = async (request, reply) => {
  const params = request.params as { group: string; owner: Address };

  const group = await getGroup(params.group);

  const tokenId = await getNetworkByName(group.baseNetwork).client().readContract({
    address: group.baseAddress,
    abi: baseAbi,
    functionName: 'token',
    args: [params.owner],
  });

  return reply.redirect(302, `/${params.group}/id/${tokenId}`);
};

function errorHandler(err: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (err instanceof BaseError && err.cause instanceof ContractFunctionRevertedError && err.cause.data?.errorName === 'NotFound') {
    return reply.code(404).send();
  }

  request.log.error({ err }, err.message);
  reply.code(500).send();
}

export const passportPlugin: FastifyPluginCallback = (fastify, _, done) => {
  fastify.get('/:group/id/:tokenId', { errorHandler }, tokenIdHandler);
  fastify.get('/:group/owner/:owner', { errorHandler }, ownerHandler);

  done();
};
