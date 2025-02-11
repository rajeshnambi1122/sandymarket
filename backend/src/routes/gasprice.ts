import express, { Request, Response } from "express";
import { GasPrice } from "../models/gasprice";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const gasPrices = await GasPrice.find();
    res.json(gasPrices);
  } catch (error) {
    res.status(500).json({ message: "Error fetching gas prices" });
  }
});

export const gasPriceRoutes = router;
