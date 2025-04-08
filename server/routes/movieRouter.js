const express = require("express");
const router = express.Router();
const { getLocalMovies, downloadMovieInfo } = require("../controllers/movieController.js");

// Get all local movies
router.get("/local-movies", getLocalMovies);

// Download movie information
router.post("/download-movie-info", downloadMovieInfo);

module.exports = router;
