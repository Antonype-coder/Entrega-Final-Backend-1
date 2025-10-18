import express from "express";
import Product from "../models/product.model.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const sort = req.query.sort;
    const q = req.query.query;

    let filter = {};
    if (q) {
      if (q.includes(":")) {
        const [field, val] = q.split(":");
        if (field === "status") {
          filter.status = val === "true" || val === "1";
        } else if (field === "category") {
          filter.category = val;
        } else {
          filter.$or = [
            { title: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } }
          ];
        }
      } else {
        filter.$or = [
          { category: { $regex: `^${q}$`, $options: "i" } },
          { title: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } }
        ];
      }
    }

    let sortObj = {};
    if (sort === "asc") sortObj.price = 1;
    else if (sort === "desc") sortObj.price = -1;

    const options = {
      page,
      limit,
      lean: true
    };
    if (Object.keys(sortObj).length) options.sort = sortObj;

    const data = await Product.paginate(filter, options);

    const buildLink = (p) => {
      if (!p) return null;
      const queryObj = { ...req.query, page: p };
      const qs = Object.keys(queryObj)
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryObj[k])}`)
        .join("&");
      return `${req.protocol}://${req.get("host")}${req.baseUrl || ""}${req.path}?${qs}`;
    };

    res.status(200).json({
      status: "success",
      payload: data.docs,
      totalPages: data.totalPages,
      prevPage: data.hasPrevPage ? data.prevPage : null,
      nextPage: data.hasNextPage ? data.nextPage : null,
      page: data.page,
      hasPrevPage: data.hasPrevPage,
      hasNextPage: data.hasNextPage,
      prevLink: data.hasPrevPage ? buildLink(data.prevPage) : null,
      nextLink: data.hasNextPage ? buildLink(data.nextPage) : null
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    res.status(500).json({ status: "error", message: "Error al recuperar los productos" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, code, price, stock, category, thumbnail, status } = req.body;
    const product = new Product({ title, description, code, price, stock, category, thumbnail, status });
    await product.save();
    res.status(201).json({ status: "success", payload: product });
  } catch (error) {
    console.error("POST /api/products error:", error);
    res.status(500).json({ status: "error", message: "Error al crear producto" });
  }
});

router.put("/:pid", async (req, res) => {
  try {
    const pid = req.params.pid;
    const updates = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(pid, updates, { new: true, runValidators: true });
    if (!updatedProduct) return res.status(404).json({ status: "error", message: "Producto no encontrado" });
    res.status(200).json({ status: "success", payload: updatedProduct });
  } catch (error) {
    console.error("PUT /api/products/:pid error:", error);
    res.status(500).json({ status: "error", message: "Error al actualizar producto" });
  }
});

router.delete("/:pid", async (req, res) => {
  try {
    const pid = req.params.pid;
    const deleted = await Product.findByIdAndDelete(pid);
    if (!deleted) return res.status(404).json({ status: "error", message: "Producto no encontrado" });
    res.status(200).json({ status: "success", payload: deleted });
  } catch (error) {
    console.error("DELETE /api/products/:pid error:", error);
    res.status(500).json({ status: "error", message: "Error al eliminar producto" });
  }
});

export default router;