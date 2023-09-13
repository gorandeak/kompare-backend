import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  birthdate: Date;
  city: string;
  vehiclePower: number;
  priceMatch: number;
  basePrice: number;
  ao: number;
  glassProtection: number;
  bonusProtection: number;
  voucher: number;
  commercialDiscount: number;
  adviserDiscount: number;
  vipDiscount: number;
  carSurcharge: number;
  total: number;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  birthdate: { type: Date, required: true },
  city: { type: String, required: true },
  vehiclePower: { type: Number, required: true },
  priceMatch: Number,
  basePrice: Number,
  ao: Number,
  glassProtection: Number,
  bonusProtection: Number,
  voucher: Number,
  commercialDiscount: Number,
  adviserDiscount: Number,
  vipDiscount: Number,
  carSurcharge: Number,
  total: Number,
});

export default mongoose.model<IUser>("User", UserSchema);
