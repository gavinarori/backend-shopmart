const mongoose = require('mongoose');

module.exports.dbConnect = async () => {
    try {
        console.log("⏳ Database connecting...");
        await mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("✅ Database connected successfully!");
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
    }
};
