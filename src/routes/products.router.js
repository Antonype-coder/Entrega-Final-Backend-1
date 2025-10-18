import express from "express";
import Product from "../models/product.model.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { limit = 10, page = 1, sort, query } = req.query;
        
        let filter = {};
        if (query) {
            filter.$or = [
                { title: { $regex: query, $options: "i" } },
                { category: { $regex: query, $options: "i" } }
            ];
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            lean: true,
            sort: sort === "asc" ? { price: 1 } : sort === "desc" ? { price: -1 } : {}
        };

        const data = await Product.paginate(filter, options);

        res.json({
            status: "success",
            payload: data.docs,
            totalPages: data.totalPages,
            page: data.page,
            hasPrevPage: data.hasPrevPage,
            hasNextPage: data.hasNextPage
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Error al obtener productos" });
    }
});

router.post("/", async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json({ status: "success", payload: product });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Error al crear producto" });
    }
});

export default router;