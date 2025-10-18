import express from "express";
import Product from "../models/product.model.js";
import Cart from "../models/cart.model.js";

const router = express.Router();

router.get("/", (req, res) => res.redirect("/products"));

const getOrCreateCart = async () => {
    let cart = await Cart.findOne();
    if (!cart) cart = await new Cart().save();
    return cart;
};

router.get("/products", async (req, res) => {
    try {
        const { limit = 9, page = 1, sort, query } = req.query;
        
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
        const cart = await getOrCreateCart();

        res.render("products", {
            products: data.docs,
            page: data.page,
            totalPages: data.totalPages,
            hasPrevPage: data.hasPrevPage,
            hasNextPage: data.hasNextPage,
            prevLink: data.hasPrevPage ? `/products?page=${data.prevPage}&query=${query || ''}&sort=${sort || ''}` : null,
            nextLink: data.hasNextPage ? `/products?page=${data.nextPage}&query=${query || ''}&sort=${sort || ''}` : null,
            cartId: cart._id,
            query: query || "",
            sort: sort || ""
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error al cargar productos");
    }
});

router.get("/products/:pid", async (req, res) => {
    try {
        const product = await Product.findById(req.params.pid).lean();
        if (!product) return res.status(404).send("Producto no encontrado");
        const cart = await getOrCreateCart();
        res.render("productDetail", { product, cartId: cart._id });
    } catch (error) {
        res.status(500).send("Error al cargar producto");
    }
});

router.get("/carts/:cid", async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid).populate("products.product").lean();
        if (!cart) return res.status(404).send("Carrito no encontrado");
        
        let total = 0;
        cart.products.forEach(item => {
            if (item.product) {
                total += item.product.price * item.quantity;
            }
        });
        
        res.render("cartDetail", { cart, total });
    } catch (error) {
        res.status(500).send("Error al cargar carrito");
    }
});

export default router;