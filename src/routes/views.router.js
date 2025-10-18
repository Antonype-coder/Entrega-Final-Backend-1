import express from "express";
import Product from "../models/product.model.js";
import Cart from "../models/cart.model.js";

const router = express.Router();

router.get("/", async (req, res) => {
  res.redirect("/products");
});

router.get("/products", async (req, res) => {
  try {
    const { limit = 10, page = 1, sort, query } = req.query;

    let filter = {};
    if (query) {
      if (query.includes(":")) {
        const [field, val] = query.split(":");
        if (field === "status") filter.status = val === "true" || val === "1";
        else if (field === "category") filter.category = val;
        else filter.$or = [{ title: { $regex: query, $options: "i" } }, { description: { $regex: query, $options: "i" } }];
      } else {
        filter.$or = [{ category: { $regex: `^${query}$`, $options: "i" } }, { title: { $regex: query, $options: "i" } }];
      }
    }

    let sortObj = {};
    if (sort === "asc") sortObj.price = 1;
    else if (sort === "desc") sortObj.price = -1;

    const options = { page: parseInt(page), limit: parseInt(limit), lean: true };
    if (Object.keys(sortObj).length) options.sort = sortObj;

    const data = await Product.paginate(filter, options);

    const baseUrl = "/products";
    const queryParams = { ...req.query };
    const buildHref = (p) => {
      const q = { ...queryParams, page: p };
      const qs = Object.keys(q).map(k => `${k}=${encodeURIComponent(q[k])}`).join("&");
      return `${baseUrl}?${qs}`;
    };

    let cart = await Cart.findOne();
    if (!cart) {
      cart = new Cart();
      await cart.save();
    }

    res.render("products", {
      products: data.docs,
      page: data.page,
      totalPages: data.totalPages,
      hasPrevPage: data.hasPrevPage,
      hasNextPage: data.hasNextPage,
      prevLink: data.hasPrevPage ? buildHref(data.prevPage) : null,
      nextLink: data.hasNextPage ? buildHref(data.nextPage) : null,
      cartId: cart._id
    });
  } catch (error) {
    console.error("GET /products view error:", error);
    res.status(500).send("Error al mostrar productos");
  }
});

router.get("/products/:pid", async (req, res) => {
  try {
    const product = await Product.findById(req.params.pid).lean();
    if (!product) return res.status(404).send("Producto no encontrado");
    
    let cart = await Cart.findOne();
    if (!cart) {
      cart = new Cart();
      await cart.save();
    }
    
    res.render("productDetail", { product, cartId: cart._id });
  } catch (error) {
    console.error("GET /products/:pid view error:", error);
    res.status(500).send("Error al mostrar detalle");
  }
});

router.get("/carts/:cid", async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid).populate("products.product").lean();
    if (!cart) return res.status(404).send("Carrito no encontrado");
    res.render("cartDetail", { cart });
  } catch (error) {
    console.error("GET /carts/:cid view error:", error);
    res.status(500).send("Error al mostrar carrito");
  }
});

export default router;