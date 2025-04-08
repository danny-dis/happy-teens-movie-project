const express = require("express");
const mysql = require("mysql");
const app = express();
const cors = require('cors');
const path = require('path');

// Import routers and controllers
const usersRouter = require("./routes/userRouter.js");
const movieRouter = require("./routes/movieRouter.js");
const scanRouter = require("./routes/scanRouter.js");
const { registerUser, loginUser } = require("./controllers/userController.js");

// Parse incoming JSON data
app.use(express.json());
app.use(cors());

// Create MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "",
  password: "",
  database: "happyteens",
});

// Serve static files (for downloaded movie posters)
app.use('/static', express.static(path.join(__dirname, 'public')));

// Define authentication routes
app.post("/register", registerUser);
app.post("/login", loginUser);

// Mount the routers
app.use("/", usersRouter);
app.use("/api", movieRouter);
app.use("/api/scan", scanRouter);

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`=== Server started on port ${port} ===`));
