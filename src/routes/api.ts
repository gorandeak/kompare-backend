import express, { Request, Response, NextFunction } from "express";
import UserModel, { IUser } from "../models/Users";
import BasePrice, { IBasePrice } from "../models/BasePrice";
import { Coverages, Discounts } from "../interface/types";
import Decimal from "decimal.js";
const app = express.Router();
const cors = require("cors");

app.use(express.json());

app.use(cors());

type RequestBody = {
  name: string;
  birthDate: Date;
  city: string;
  vehiclePower: number;
  basePrice: number;
  priceMatch: number;
  ao: boolean;
  glassProtection: boolean;
  bonusProtection: boolean;
  voucher: number;
  commercialDiscount: boolean;
  adviserDiscount: boolean;
  vipDiscount: boolean;
  carSurcharge: boolean;
};

app.post("/getBasePrice", async (req: Request, res: Response) => {
  const body: RequestBody = req.body;

  if (!body.birthDate || !body.city) {
    return res.status(400).send("Missing values from body");
  }

  const age = calculateAge(body.birthDate);
  const ageGroup = setAgeGroup(age);

  try {
    const basePriceData: IBasePrice | null = await BasePrice.findOne({
      age: ageGroup,
      city: body.city,
    });

    if (!basePriceData) {
      return res
        .status(404)
        .send("No data found for the given ageGroup and city");
    }

    res.status(200).json({ basePrice: basePriceData.basePrice });
  } catch (error) {
    console.error("Error fetching from MongoDB:", error);
    res.status(500).send("Internal server error");
  }
});

app.post("/getTotal", async (req: Request, res: Response) => {
  const body: RequestBody = req.body;
  let allCovarages: Coverages = {
    ao: false,
    bonusProtection: false,
    glassProtection: false,
  };
  let allDiscounts: Discounts = {
    voucher: false,
    adviserDiscount: false,
    carSurcharge: false,
    commercialDiscount: false,
    vipDiscount: false,
  };
  let total = 0;
  let basePrice = 0;
  const age = calculateAge(body.birthDate);
  const ageGroup = setAgeGroup(age);

  try {
    if (body.priceMatch) {
      total = body.priceMatch;
      allDiscounts.voucher = body.voucher;
      let version = "";
      if (body.bonusProtection && body.commercialDiscount) {
        version = "commercialDiscountPlusBonusProtection";
      } else if (body.bonusProtection) {
        version = "bonusProtectionOnly";
      } else if (body.commercialDiscount) {
        version = "commercialDiscountOnly";
      }

      const result = computeBasePrice(total, body.voucher, version);

      if (result) {
        basePrice = result.basePrice;
        allCovarages.bonusProtection = result.bonusProtection;
        allDiscounts.commercialDiscount = result.commercialDiscount;
      }
    } else {
      total = body.basePrice;
      if (body.bonusProtection) {
        allCovarages.bonusProtection = roundToTwoDecimals(
          0.12 * body.basePrice
        );
        total += 0.12 * body.basePrice;
      }
      if (body.ao) {
        allCovarages.ao = ageGroup < 30 ? 55 : 105;
        total += ageGroup < 30 ? 55 : 105;
      }
      if (body.glassProtection) {
        allCovarages.glassProtection = roundToTwoDecimals(
          0.8 * body.vehiclePower
        );
        total += 0.8 * body.vehiclePower;
      }
      if (body.voucher) {
        allDiscounts.voucher = body.voucher;
        total -= body.voucher;
      }
      if (body.commercialDiscount) {
        allDiscounts.commercialDiscount = roundToTwoDecimals(
          0.1 * body.basePrice
        );
        total -= 0.1 * body.basePrice;
      }
      if (body.adviserDiscount) {
        const trueConditionsCount =
          Object.values(allCovarages).filter(Boolean).length;
        if (trueConditionsCount === 2) {
          const coverageSum = Object.values(allCovarages)
            .filter((value) => typeof value === "number")
            .reduce((acc, current) => acc + current, 0);
          const adviserDiscount = 0.2 * coverageSum;

          allDiscounts.adviserDiscount = roundToTwoDecimals(adviserDiscount);
          total -= adviserDiscount;
        }
      }
      if (body.carSurcharge) {
        if (body.vehiclePower > 100) {
          allDiscounts.carSurcharge = roundToTwoDecimals(0.1 * body.basePrice);
          total += 0.1 * body.basePrice;
        }
      }
      if (body.vipDiscount) {
        if (body.vehiclePower > 100) {
          allDiscounts.vipDiscount = roundToTwoDecimals(0.05 * total);
          total -= 0.05 * total;
        }
      }
    }

    res.status(200).json({
      total: roundToTwoDecimals(total),
      basePrice: roundToTwoDecimals(basePrice),
      allCovarages: allCovarages,
      allDiscounts: allDiscounts,
    });
  } catch (error) {
    console.error("Error fetching total:", error);
    res.status(500).send("Internal server error");
  }
});

app.post("/saveUser", async (req: Request, res: Response) => {
  const body: RequestBody = req.body;

  const { name } = body;

  try {
    let user: IUser | null = await UserModel.findOne({ name });

    const userData = {
      name: body.name,
      birthdate: body.birthDate,
      city: body.city,
      vehiclePower: body.vehiclePower,
      basePrice: body.basePrice || 0,
      priceMatch: body.priceMatch || 0,
      ao: body.ao || 0,
      glassProtection: body.glassProtection || 0,
      bonusProtection: body.bonusProtection || 0,
      voucher: body.voucher || 0,
      commercialDiscount: body.commercialDiscount || 0,
      adviserDiscount: body.adviserDiscount || 0,
      vipDiscount: body.vipDiscount || 0,
      carSurcharge: body.carSurcharge || 0,
    };

    if (!user) {
      user = new UserModel(userData);
    } else {
      Object.assign(user, userData);
    }

    await user.save();
    res.status(200).send("User saved successfully");
  } catch (error) {
    console.error("Error saving user in MongoDB:", error);
    res.status(500).send("Internal server error");
  }
});

function calculateAge(birthdate: Date): number {
  const today = new Date();
  const birthDate = new Date(birthdate);
  let _age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    _age--;
  }
  return _age;
}

function setAgeGroup(ageGroup: number): number {
  if (ageGroup >= 18 && ageGroup < 29) return 20;
  if (ageGroup >= 29 && ageGroup < 39) return 30;
  if (ageGroup >= 39 && ageGroup < 49) return 40;
  if (ageGroup >= 49) return 50;
  return ageGroup;
}

function roundToTwoDecimals(n: number): number {
  let result = new Decimal(n).toDecimalPlaces(2);
  return parseFloat(result.toString());
}

function computeBasePrice(total: number, voucher: number, version: string) {
  let basePrice = 0;
  let commercialDiscount: number | boolean = false;
  let bonusProtection: number | boolean = false;

  switch (version) {
    case "commercialDiscountPlusBonusProtection":
      basePrice = (total + voucher) / 1.02;
      commercialDiscount = roundToTwoDecimals(0.1 * basePrice);
      bonusProtection = roundToTwoDecimals(0.12 * basePrice);
      break;
    case "bonusProtectionOnly":
      basePrice = (total + voucher) / 1.12;
      bonusProtection = roundToTwoDecimals(0.12 * basePrice);
      break;
    case "commercialDiscountOnly":
      basePrice = (total + voucher) / 0.9;
      commercialDiscount = roundToTwoDecimals(0.1 * basePrice);
      break;
    case "":
      basePrice = total + voucher;
      break;
    default:
      console.error("Invalid version provided");
      return;
  }

  return {
    basePrice: basePrice,
    commercialDiscount: commercialDiscount,
    bonusProtection: bonusProtection,
  };
}

export default app;
