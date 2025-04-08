const express = require("express");
const router = express.Router();
const { scanDirectories, analyzeVideo, downloadMovieAssets } = require("../controllers/scanController.js");

// Scan directories for movie files
router.post("/scan-directories", scanDirectories);

// Analyze video file for intro/outro detection
router.post("/analyze-video", analyzeVideo);

// Download movie poster and metadata
router.post("/download-assets", downloadMovieAssets);

module.exports = router;
