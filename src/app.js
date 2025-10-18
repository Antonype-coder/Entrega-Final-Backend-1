import express from "express";
import dotenv from "dotenv";
import connectMongoDB from "./config/db.js";
import productsRouter from "./routes/products.router.js";
import cartRouter from "./routes/carts.router.js";
import { engine } from "express-handlebars";
import viewsRouter from "./routes/views.router.js";
import path from "path";

const app = express();
const PORT = process.env.PORT || 8080;

dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
connectMongoDB();

app.engine("handlebars", engine({
  helpers: {
    multiply: (a, b) => a * b
  }
}));
app.set("view engine", "handlebars");
app.set("views", path.join(process.cwd(), "views"));

app.use(express.static("public"));
app.use("/api/products", productsRouter);
app.use("/api/carts", cartRouter);
app.use("/", viewsRouter);

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});