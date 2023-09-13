import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import BasePrice, { IBasePrice } from "../models/BasePrice";

const router = express.Router();
const app = express();

dotenv.config();

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.render("index", { title: "kompare-backend" });
});

app.use("/", router);

async function insertBasePriceData() {
  const cities = ["Zagreb", "Rijeka", "Split", "Osijek", "Dubrovnik", "Pula"];
  const ages = [20, 30, 40, 50];
  const prices: { [city: string]: number[] } = {
    Zagreb: [400, 350, 300, 250],
    Rijeka: [390, 340, 290, 240],
    Split: [380, 330, 280, 230],
    Osijek: [370, 320, 270, 220],
    Dubrovnik: [360, 310, 260, 210],
    Pula: [350, 300, 250, 200],
  };

  for (let city of cities) {
    for (let i = 0; i < ages.length; i++) {
      const basePriceData: Partial<IBasePrice> = {
        city: city,
        age: ages[i],
        basePrice: prices[city][i],
      };

      try {
        await BasePrice.create(basePriceData);
        //console.log("basePrice created");
      } catch (error) {
        console.error("Error creating base price data:", error);
      }
    }
  }
}

insertBasePriceData();

export default router;
