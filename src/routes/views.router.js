import express from "express";
import Product from "../models/product.model.js";
import Cart from "../models/cart.model.js";
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const userCarts = new Map();

const generatePCId = (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    return Buffer.from(ip + userAgent).toString('base64').slice(0, 16);
};

const getOrCreatePCCart = async (req) => {
    try {
        const pcId = generatePCId(req);
        
        if (userCarts.has(pcId)) {
            const cartId = userCarts.get(pcId);
            const cart = await Cart.findById(cartId);
            if (cart) return cart;
        }
        
        const newCart = new Cart();
        await newCart.save();
        
        userCarts.set(pcId, newCart._id.toString());
        
        return newCart;
        
    } catch (error) {
        console.error("Error creando carrito:", error);
        const fallbackCart = new Cart();
        await fallbackCart.save();
        return fallbackCart;
    }
};

router.get("/", async (req, res) => {
    res.redirect("/products");
});

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
        const cart = await getOrCreatePCCart(req);

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
        console.error("Error en /products:", error);
        res.status(500).send("Error al cargar productos");
    }
});

router.get("/products/:pid", async (req, res) => {
    try {
        const product = await Product.findById(req.params.pid).lean();
        if (!product) return res.status(404).send("Producto no encontrado");
        
        const cart = await getOrCreatePCCart(req);
        res.render("productDetail", { product, cartId: cart._id });
    } catch (error) {
        console.error("Error en /products/:pid:", error);
        res.status(500).send("Error al cargar producto");
    }
});

router.get("/carts/:cid", async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cid).populate("products.product").lean();
        if (!cart) {
            const newCart = await getOrCreatePCCart(req);
            return res.redirect(`/carts/${newCart._id}`);
        }
        
        let total = 0;
        cart.products.forEach(item => {
            if (item.product) {
                total += item.product.price * item.quantity;
            }
        });
        
        res.render("cartDetail", { cart, total });
    } catch (error) {
        console.error("Error en /carts/:cid:", error);
        res.status(500).send("Error al cargar carrito");
    }
});

router.get("/reset-cart", async (req, res) => {
    try {
        const pcId = generatePCId(req);
        userCarts.delete(pcId); 
        
        const newCart = new Cart();
        await newCart.save();
        userCarts.set(pcId, newCart._id.toString());
        
        res.redirect(`/carts/${newCart._id}`);
    } catch (error) {
        res.redirect("/products");
    }
});

export default router;