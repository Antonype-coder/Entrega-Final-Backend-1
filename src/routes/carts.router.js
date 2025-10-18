import express from "express";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import mongoose from "mongoose";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const cart = new Cart();
    await cart.save();
    res.status(201).json({ status: "success", payload: cart });
  } catch (error) {
    console.error("POST /api/carts error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.get("/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    if (!mongoose.Types.ObjectId.isValid(cid))
      return res.status(400).json({ status: "error", message: "CID inválido" });

    const cart = await Cart.findById(cid).populate("products.product").lean();
    if (!cart)
      return res.status(404).json({ status: "error", message: "Carrito no encontrado" });

    res.status(200).json({ status: "success", payload: cart });
  } catch (error) {
    console.error("GET /api/carts/:cid error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.post("/:cid/products/:pid", async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findById(cid);
    if (!cart)
      return res.status(404).json({ status: "error", message: "Carrito no encontrado" });

    const product = await Product.findById(pid);
    if (!product)
      return res.status(404).json({ status: "error", message: "Producto no encontrado" });

    const existing = cart.products.find(p => p.product.toString() === pid);

    if (existing) {
      if (quantity !== undefined) {
        existing.quantity = Number(quantity);
      } else {
        existing.quantity += 1;
      }
    } else {
      cart.products.push({ product: pid, quantity: Number(quantity) || 1 });
    }

    await cart.save();
    const populated = await Cart.findById(cid).populate("products.product").lean();
    res.status(200).json({ status: "success", payload: populated });
  } catch (error) {
    console.error("POST /api/carts/:cid/products/:pid error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.delete("/:cid/products/:pid", async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const updated = await Cart.findByIdAndUpdate(
      cid,
      { $pull: { products: { product: pid } } },
      { new: true }
    ).populate("products.product").lean();

    if (!updated)
      return res.status(404).json({ status: "error", message: "Carrito no encontrado" });

    res.status(200).json({ status: "success", payload: updated });
  } catch (error) {
    console.error("DELETE /api/carts/:cid/products/:pid error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.put("/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    const products = req.body;
    if (!Array.isArray(products))
      return res.status(400).json({ status: "error", message: "Body debe ser un array" });

    for (const item of products) {
      if (!mongoose.Types.ObjectId.isValid(item.product))
        return res.status(400).json({ status: "error", message: "ID de producto inválido" });
      const exists = await Product.exists({ _id: item.product });
      if (!exists)
        return res.status(404).json({ status: "error", message: `Producto ${item.product} no existe` });
    }

    const updated = await Cart.findByIdAndUpdate(
      cid,
      { products },
      { new: true }
    ).populate("products.product").lean();

    if (!updated)
      return res.status(404).json({ status: "error", message: "Carrito no encontrado" });

    res.status(200).json({ status: "success", payload: updated });
  } catch (error) {
    console.error("PUT /api/carts/:cid error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.put("/:cid/products/:pid", async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined)
      return res.status(400).json({ status: "error", message: "Falta quantity" });

    const cart = await Cart.findById(cid);
    if (!cart)
      return res.status(404).json({ status: "error", message: "Carrito no encontrado" });

    const item = cart.products.find(p => p.product.toString() === pid);
    if (!item)
      return res.status(404).json({ status: "error", message: "Producto no está en el carrito" });

    if (Number(quantity) === 0)
      cart.products = cart.products.filter(p => p.product.toString() !== pid);
    else item.quantity = Number(quantity);

    await cart.save();
    const populated = await Cart.findById(cid).populate("products.product").lean();
    res.status(200).json({ status: "success", payload: populated });
  } catch (error) {
    console.error("PUT /api/carts/:cid/products/:pid error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.delete("/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    const updated = await Cart.findByIdAndUpdate(
      cid,
      { products: [] },
      { new: true }
    ).populate("products.product").lean();

    if (!updated)
      return res.status(404).json({ status: "error", message: "Carrito no encontrado" });

    res.status(200).json({ status: "success", payload: updated });
  } catch (error) {
    console.error("DELETE /api/carts/:cid error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;