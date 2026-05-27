const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing in .env file");
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log("Database connected successfully");
    } catch (error) {
        console.log("Database connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB; 