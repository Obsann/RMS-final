const express = require('express');
const {
    getOverview,
    getDemographics,
    getRequestReport
} = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// All routes require admin auth
router.use(authMiddleware);
router.use(adminAuth);

// Overview dashboard
router.get('/overview', getOverview);

// Demographics report
router.get('/demographics', getDemographics);

// Request statistics report
router.get('/requests', getRequestReport);

module.exports = router;
