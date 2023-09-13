import mongoose, { Document, Schema } from "mongoose";

export interface IBasePrice extends Document {
  city: string;
  age: number;
  basePrice: number;
}

const BasePriceSchema: Schema = new Schema({
  city: String,
  age: Number,
  basePrice: Number,
});

export default mongoose.model<IBasePrice>("BasePrice", BasePriceSchema);
