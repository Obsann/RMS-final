const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const logger = require('../config/logger');

const LUXAND_API_URL = 'https://api.luxand.cloud/photo/liveness/v2';
const LUXAND_API_TOKEN = process.env.LUXAND_API_TOKEN || 'a54d540c608e4bc19190ff1e05fba2e1';

/**
 * Performs a liveness check on an uploaded photo using the Luxand Cloud API.
 *
 * @param {string} filePath - Absolute path to the photo file on disk.
 * @returns {Promise<{ isLive: boolean, score: number|null, raw: object }>}
 *   - isLive: true if the photo passed the liveness check
 *   - score: liveness confidence score (0-1) if available
 *   - raw: the full API response for logging / debugging
 */
async function checkLiveness(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            logger.warn(`Liveness check: file not found at ${filePath}`);
            return { isLive: false, score: null, raw: { error: 'File not found' } };
        }

        const form = new FormData();
        form.append('photo', fs.createReadStream(filePath));

        const formHeaders = form.getHeaders();
        formHeaders['token'] = LUXAND_API_TOKEN;

        const response = await axios({
            method: 'POST',
            url: LUXAND_API_URL,
            headers: formHeaders,
            data: form,
            timeout: 30000  // 30-second timeout
        });

        const data = response.data;
        logger.info('Luxand liveness response:', JSON.stringify(data));

        // Luxand v2 response format:
        // { "status": "success", "liveness": "real" | "fake", "score": 0.95 }
        // OR for faces array: [{ "liveness": "real", "score": 0.95 }]
        let isLive = false;
        let score = null;

        if (Array.isArray(data)) {
            // Array of faces — check first face
            if (data.length > 0) {
                isLive = data[0].liveness === 'real';
                score = data[0].score ?? null;
            }
        } else if (data && typeof data === 'object') {
            if (data.liveness) {
                isLive = data.liveness === 'real';
                score = data.score ?? null;
            } else if (data.status === 'success') {
                isLive = true;
                score = data.score ?? null;
            }
        }

        return { isLive, score, raw: data };
    } catch (error) {
        // If the API is unreachable or returns an error, log it but don't block
        // the entire flow — admins can still manually review.
        logger.error('Liveness check API error:', error.message);
        return {
            isLive: false,
            score: null,
            raw: { error: error.message, apiUnavailable: true }
        };
    }
}

module.exports = { checkLiveness };
