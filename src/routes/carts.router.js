import express from "express";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const cart = new Cart();
        await cart.save();
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

        if (!cart || !product) return res.status(404).json({ status: "error", message: "No encontrado" });

        const existing = cart.products.find(p => p.product.toString() === req.params.pid);
        
        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.products.push({ product: req.params.pid, quantity });
        }

        await cart.save();
        const updated = await Cart.findById(cart._id).populate("products.product").lean();
        
        res.json({ status: "success", payload: updated });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

router.put("/:cid/products/:pid", async (req, res) => {
    try {
        const { quantity } = req.body;
        const cart = await Cart.findById(req.params.cid);
        if (!cart) return res.status(404).json({ status: "error", message: "Carrito no encontrado" });

        const item = cart.products.find(p => p.product.toString() === req.params.pid);
        if (!item) return res.status(404).json({ status: "error", message: "Producto no encontrado" });

        item.quantity = quantity;
        await cart.save();
        
        const updated = await Cart.findById(cart._id).populate("products.product").lean();
        res.json({ status: "success", payload: updated });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

router.put("/:cid", async (req, res) => {
    try {
        const products = req.body;
        if (!Array.isArray(products)) return res.status(400).json({ status: "error", message: "Debe ser array" });

        const cart = await Cart.findById(req.params.cid);
        if (!cart) return res.status(404).json({ status: "error", message: "Carrito no encontrado" });

        cart.products = products;
        await cart.save();
        
        const updated = await Cart.findById(cart._id).populate("products.product").lean();
        res.json({ status: "success", payload: updated });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

router.delete("/:cid/products/:pid", async (req, res) => {
    try {
        const updated = await Cart.findByIdAndUpdate(
            req.params.cid,
            { $pull: { products: { product: req.params.pid } } },
            { new: true }
        ).populate("products.product").lean();

        if (!updated) return res.status(404).json({ status: "error", message: "Carrito no encontrado" });
        res.json({ status: "success", payload: updated });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

router.delete("/:cid", async (req, res) => {
    try {
        const updated = await Cart.findByIdAndUpdate(
            req.params.cid,
            { products: [] },
            { new: true }
        ).populate("products.product").lean();

        if (!updated) return res.status(404).json({ status: "error", message: "Carrito no encontrado" });
        res.json({ status: "success", payload: updated });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

export default router;