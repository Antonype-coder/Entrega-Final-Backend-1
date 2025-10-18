import express from "express";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const cart = await new Cart().save();
        res.json({ status: "success", payload: cart });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

router.get("/:cid", async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid).populate("products.product").lean();
        if (!cart) return res.status(404).json({ status: "error", message: "Carrito no encontrado" });
        res.json({ status: "success", payload: cart });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

router.post("/:cid/products/:pid", async (req, res) => {
    try {
        const quantity = parseInt(req.body.quantity) || 1;
        const cart = await Cart.findById(req.params.cid);
        const product = await Product.findById(req.params.pid);

        if (!cart || !product) {
            return res.status(404).json({ status: "error", message: "No encontrado" });
        }

        const existing = cart.products.find(p => p.product.toString() === req.params.pid);
        
        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.products.push({ product: req.params.pid, quantity });
        }

        await cart.save();
        
        res.redirect(`/carts/${cart._id}`);
        
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

router.delete("/:cid/products/:pid", async (req, res) => {
    try {
        const cart = await Cart.findByIdAndUpdate(
            req.params.cid,
            { $pull: { products: { product: req.params.pid } } },
            { new: true }
        ).populate("products.product").lean();
        
        res.json({ status: "success", payload: cart });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

router.delete("/:cid", async (req, res) => {
    try {
        const cart = await Cart.findByIdAndUpdate(
            req.params.cid,
            { products: [] },
            { new: true }
        ).populate("products.product").lean();
        
        res.json({ status: "success", payload: cart });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

export default router;