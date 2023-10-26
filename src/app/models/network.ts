import { getModelForClass, prop } from '@typegoose/typegoose';
import type { Address } from 'viem';

import { Base } from './base';
import { Layer } from './partials/layer';

export class Network extends Base {
  @prop({ required: true })
  active!: boolean;

  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  rpcUrl!: string;

  @prop({ required: true, type: String })
  multicallAddress!: Address;

  @prop({ type: Layer })
  layers?: Layer[];
}

export const NetworkModel = getModelForClass(Network);
