import { prop } from '@typegoose/typegoose';

export enum LayerType {
  Avatar = 'avatar',
  Image = 'image',
}

export class Layer {
  @prop({ required: true, enum: LayerType, type: String })
  type!: LayerType;

  @prop({ required: true })
  x!: number;

  @prop({ required: true })
  y!: number;

  @prop({ required: true })
  z!: number;

  @prop()
  w?: number;

  @prop()
  h?: number;

  @prop()
  r?: number;

  @prop()
  src?: string;
}
