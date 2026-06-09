const axios = require('axios');

/**
 * Utility functions for integrating with other microservices in the ecosystem.
 * These functions abstract away the details of making HTTP requests to external APIs,
 * ensuring consistent error handling and configuration management.
 */

// Load environment variables for service URLs and API keys.
// It's assumed that `dotenv` or similar is configured in `server.js`
// to load these variables into `process.env`.
const AI_ASSISTANT_SERVICE_URL = process.env.AI_ASSISTANT_SERVICE_URL || 'http://localhost:5001/api/ai';
const AI_ASSISTANT_API_KEY = process.env.AI_ASSISTANT_API_KEY; // API key for authentication with the AI service

const URL_SHORTENER_SERVICE_URL = process.env.URL_SHORTENER_SERVICE_URL || 'http://localhost:5002/api/shorten';
const URL_SHORTENER_API_KEY = process.env.URL_SHORTENER_API_KEY; // API key for authentication with the URL shortener service

const ECOMMERCE_SERVICE_URL = process.env.ECOMMERCE_SERVICE_URL || 'http://localhost:5003/api/products';
// No specific API key for E-commerce assumed for this example, but could be added.

/**
 * Calls the AI-Powered Content Assistant service to get suggestions, summarize,
 * or perform other content enhancement operations on a blog post.
 *
 * @param {string} content The blog post content to be sent to the AI assistant.
 * @param {string} [operationType='suggestions'] The specific operation the AI should perform (e.g., 'suggestions', 'summarize', 'seo-optimize').
 * @returns {Promise<object|null>} A promise that resolves to the AI service's response data, or null if an error occurs or the service URL is not configured.
 */
async function getAISuggestions(content, operationType = 'suggestions') {
    if (!AI_ASSISTANT_SERVICE_URL) {
        console.warn('AI_ASSISTANT_SERVICE_URL is not defined. Skipping AI-Powered Content Assistant integration.');
        return null;
    }

    try {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (AI_ASSISTANT_API_KEY) {
            headers['X-API-Key'] = AI_ASSISTANT_API_KEY; // Common header for API key authentication
        }

        const response = await axios.post(AI_ASSISTANT_SERVICE_URL, {
            content,
            operationType,
            source: 'personal-blog-platform' // Provide context to the AI service about the caller
        }, { headers });

        console.log(`Successfully called AI Assistant for '${operationType}'. Response data:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error calling AI-Powered Content Assistant for '${operationType}':`, error.message);
        if (error.response) {
            // Log specific error details from the AI service if available
            console.error('AI Assistant service error details:', error.response.status, error.response.data);
        }
        return null;
    }
}

/**
 * Calls the Custom URL Shortener service to generate a short URL for a given long URL.
 * This is useful for sharing blog post links.
 *
 * @param {string} longUrl The original, full URL of the blog post.
 * @param {string} [customAlias] An optional custom alias to use for the shortened URL.
 * @returns {Promise<string|null>} A promise that resolves to the shortened URL string, or null if an error occurs or the service URL is not configured.
 */
async function getShortenedUrl(longUrl, customAlias = null) {
    if (!URL_SHORTENER_SERVICE_URL) {
        console.warn('URL_SHORTENER_SERVICE_URL is not defined. Skipping Custom URL Shortener integration.');
        return null;
    }

    try {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (URL_SHORTENER_API_KEY) {
            headers['X-API-Key'] = URL_SHORTENER_API_KEY; // Common header for API key authentication
        }

        const payload = {
            longUrl,
            source: 'personal-blog-platform' // Provide context to the URL shortener service
        };
        if (customAlias) {
            payload.customAlias = customAlias;
        }

        const response = await axios.post(URL_SHORTENER_SERVICE_URL, payload, { headers });

        // Assuming the URL shortener service returns an object like { shortUrl: '...' }
        const shortUrl = response.data.shortUrl;
        if (shortUrl) {
            console.log(`Successfully shortened URL '${longUrl}' to '${shortUrl}'.`);
            return shortUrl;
        } else {
            console.warn('URL Shortener service did not return a short URL in the expected format.');
            return null;
        }
    } catch (error) {
        console.error('Error calling Custom URL Shortener service:', error.message);
        if (error.response) {
            // Log specific error details from the URL shortener service if available
            console.error('URL Shortener service error details:', error.response.status, error.response.data);
        }
        return null;
    }
}

/**
 * Fetches product details from the Interactive E-commerce Product Catalog service.
 * This integration could be used if blog posts feature or review specific products.
 *
 * @param {string} productId The unique identifier of the product to fetch.
 * @returns {Promise<object|null>} A promise that resolves to the product details object, or null if an error occurs or the service URL is not configured.
 */
async function getProductInfo(productId) {
    if (!ECOMMERCE_SERVICE_URL) {
        console.warn('ECOMMERCE_SERVICE_URL is not defined. Skipping Interactive E-commerce Product Catalog integration.');
        return null;
    }

    try {
        // Assuming the E-commerce service uses a GET request for product details by ID
        const response = await axios.get(`${ECOMMERCE_SERVICE_URL}/${productId}`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log(`Successfully fetched product info for ID '${productId}'.`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching product info for ID '${productId}' from E-commerce service:`, error.message);
        if (error.response) {
            // Log specific error details from the E-commerce service if available
            console.error('E-commerce service error details:', error.response.status, error.response.data);
        }
        return null;
    }
}

// Export the integration functions for use in other parts of the server.
module.exports = {
    getAISuggestions,
    getShortenedUrl,
    getProductInfo,
};