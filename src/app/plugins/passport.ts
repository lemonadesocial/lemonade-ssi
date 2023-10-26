import { isError } from 'ethers';
import * as assert from 'assert';
import * as path from 'path';
import Canvas, { createCanvas, loadImage } from 'canvas';
import type { FastifyError, FastifyPluginCallback, FastifyReply, FastifyRequest, RouteHandlerMethod } from 'fastify';

import { LayerType } from '../models/partials/layer';

import { getGroup } from '../services/group';
import { getNetworkByHash, getNetworkByName } from '../services/network';

import * as base from '../services/contract/base';
import * as passport from '../services/contract/passport';

const fonts = path.join(__dirname, '../../../fonts');
Canvas.registerFont(fonts + '/Agdasima.ttf', { family: 'Agdasima' });
Canvas.registerFont(fonts + '/Bungee.ttf', { family: 'Bungee' });

const tokenIdHandler: RouteHandlerMethod = async (request, reply) => {
  const { name, tokenId } = request.params as { name: string, tokenId: string };
  const { baseNetwork, baseAddress, passportMap, layers } = await getGroup(name);

  const network = getNetworkByHash(await base.networkOf(getNetworkByName(baseNetwork), baseAddress, tokenId));
  const target = passportMap.get(network.name);

  assert.ok(target);

  const tokenURI = await passport.tokenURI(network, target, tokenId);
  const metadata = JSON.parse(Buffer.from(tokenURI.substring('data:application/json;base64,'.length), 'base64').toString()) as { image: string };

  const image = await loadImage(metadata.image);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  if (layers?.length || network.layers?.length) {
    const combined = [...layers || [], ...network.layers || []].sort(((a, b) => a.z - b.z));

    const promises = await Promise.allSettled(combined.map(async (layer) => {
      switch(layer.type) {
        case LayerType.Avatar: {
          const avatar = await passport.property(network, target, tokenId, 'avatar');

          if (avatar) return await loadImage(avatar);
          break; }
        case LayerType.Image:
          if (layer.src) return await loadImage(layer.src);
          break;
      }
    }));

    combined.forEach((layer, i) => {
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
  const { name, owner } = request.params as { name: string, owner: string };
  const { baseNetwork, baseAddress } = await getGroup(name);

  const tokenId = await base.token(getNetworkByName(baseNetwork), baseAddress, owner);

  return reply.redirect(302, `/${name}/id/${tokenId}`);
};

function errorHandler(err: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (isError(err, 'CALL_EXCEPTION') && err.revert?.name === 'NotFound') {
    return reply.code(404).send();
  }

  request.log.error({ err }, err.message);
  reply.code(500).send();
}

export const passportPlugin: FastifyPluginCallback = (fastify, _, done) => {
  fastify.get('/:name/id/:tokenId', { errorHandler }, tokenIdHandler);
  fastify.get('/:name/owner/:owner', { errorHandler }, ownerHandler);

  done();
};
