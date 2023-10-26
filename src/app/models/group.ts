import { getModelForClass, prop } from '@typegoose/typegoose';
import type { Address } from 'viem';

import { Base } from './base';
import { Layer } from './partials/layer';

export class Group extends Base {
  @prop({ required: true })
  active!: boolean;

  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  baseNetwork!: string;

  @prop({ required: true, type: String })
  baseAddress!: Address;

  @prop({ required: true, type: String })
  passportMap!: Map<string, Address>;

  @prop({ type: Layer })
  layers?: Layer[];
}

export const GroupModel = getModelForClass(Group);
