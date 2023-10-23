import { modelOptions, prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@modelOptions({ schemaOptions: { timestamps: true } })
export abstract class Base {
  _id?: Types.ObjectId;

  @prop()
  createdAt?: Date;

  @prop()
  updatedAt?: Date;
}
