import { getModelForClass, prop } from '@typegoose/typegoose';

import { Base } from './base';
import { Layer } from './partials/layer';

export class Network extends Base {
  @prop({ required: true })
  active!: boolean;

  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  providerUrl!: string;

  @prop({ type: Layer })
  layers?: Layer[];
}

export const NetworkModel = getModelForClass(Network);
