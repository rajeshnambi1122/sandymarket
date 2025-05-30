import express, { Request, Response } from "express";
import { GasPrice } from "../models/Gasprice";

const router = express.Router();

// Public route to get gas prices
router.get("/", async (req: Request, res: Response) => {
  try {
    const gasPrices = await GasPrice.find();
    res.json(gasPrices);
  } catch (error) {
    console.error("Error fetching gas prices:", error);
    res.status(500).json({ message: "Error fetching gas prices" });
  }
});

router.patch("/", async (req: Request, res: Response) => {
  try {
    console.log("Received gas price update request:", req.body);
    const { type, price } = req.body;

    // Validate input
    if (!type || !price) {
      console.error("Missing required fields:", { type, price });
      return res.status(400).json({ 
        message: "Type and price are required",
        received: { type, price }
      });
    }

    // Check if price is a valid number
    if (isNaN(Number(price))) {
      console.error("Invalid price format:", price);
      return res.status(400).json({ 
        message: "Price must be a valid number",
        received: price
      });
    }

    // Normalize the type to match existing entries
    const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    
    // Find and update existing gas price, or create new if not found
    const updatedPrice = await GasPrice.findOneAndUpdate(
      { type: normalizedType },
      { 
        price,
        lastUpdated: new Date()
      },
      { 
        new: true,  // Return the updated document
        upsert: false  // Create if doesn't exist
      }
    );

    console.log("Gas price updated successfully:", updatedPrice);
    res.status(200).json(updatedPrice);
  } catch (error) {
    console.error("Error updating gas price:", error);
    res.status(500).json({ 
      message: "Error updating gas price",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export const gasPriceRoutes = router;
