require("dotenv").config();

const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

app.get("/", (req, res) => {
    res.json({ message: "Task Management Practical 7 API" });
});

app.use("/auth", authRoutes);
app.use("/", authRoutes);
app.use("/tasks", taskRoutes);

app.use((req, res) => {
    res.status(404).json({
        error: { message: "Route not found" }
    });
});

app.use(errorHandler);

async function startServer() {
    const { MONGO_URI, JWT_SECRET } = process.env;

    if (!MONGO_URI) {
        throw new Error("MONGO_URI is required. Set it in backend/.env.");
    }
    if (/^mongodb\+srv:\/\//i.test(MONGO_URI)) {
        const authority = MONGO_URI.match(/^mongodb\+srv:\/\/([^/?#]*)/i)?.[1] || "";
        if ((authority.match(/@/g) || []).length > 1) {
            throw new Error(
                "MONGO_URI contains an unescaped '@' in its credentials. URL-encode special characters in the Atlas database password (for example, @ as %40) and update backend/.env."
            );
        }
    }
    if (!JWT_SECRET || JWT_SECRET.length < 32) {
        throw new Error("JWT_SECRET must be set to at least 32 characters in backend/.env.");
    }

    await mongoose.connect(MONGO_URI);

    const port = Number(process.env.PORT) || 5000;
    app.listen(port, () => {
        console.log(`API listening at http://localhost:${port}`);
    });
}

if (require.main === module) {
    startServer().catch((error) => {
        console.error(`Unable to start API: ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = { app, startServer };
