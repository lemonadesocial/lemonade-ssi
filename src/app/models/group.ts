import { getModelForClass, prop } from '@typegoose/typegoose';

import { Base } from './base';
import { Layer } from './partials/layer';

export class Group extends Base {
  @prop({ required: true })
  active!: boolean;

  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  baseNetwork!: string;

  @prop({ required: true })
  baseAddress!: string;

  @prop({ required: true, type: String })
  passportMap!: Map<string, string>;

  @prop({ type: Layer })
  layers?: Layer[];
}

export const GroupModel = getModelForClass(Group);
