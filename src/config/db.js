import mongoose from "mongoose";

const connectMongoDB = async () => {
  try {
    const uri = process.env.URI_MONGODB;
    if (!uri) throw new Error("Falta URI_MONGODB en .env");

    await mongoose.connect(uri);
    console.log("✅ Conectado con MongoDB!");
  } catch (error) {
    console.error("❌ Error al conectar con MongoDB:", error.message);
  }
};

export default connectMongoDB;