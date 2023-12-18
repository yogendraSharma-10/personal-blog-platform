require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Post = require('./models/Post'); // Import the Post model
const integrations = require('./utils/integrations'); // Import utility for external service integrations

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blogplatform';

// --- Middleware ---
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000', // Allow requests from the client application
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json()); // Parse JSON request bodies

// --- Database Connection ---
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit process with failure
    });

// --- API Routes ---

/**
 * @route GET /api/posts
 * @description Get all blog posts
 * @access Public
 */
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }); // Sort by creation date, newest first
        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Server error while fetching posts.' });
    }
});

/**
 * @route GET /api/posts/:id
 * @description Get a single blog post by ID
 * @access Public
 */
app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }
        res.status(200).json(post);
    } catch (error) {
        console.error(`Error fetching post with ID ${req.params.id}:`, error);
        // Handle invalid ID format specifically
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid post ID format.' });
        }
        res.status(500).json({ message: 'Server error while fetching post.' });
    }
});

/**
 * @route POST /api/posts
 * @description Create a new blog post
 * @access Public (in a real app, this might be protected)
 */
app.post('/api/posts', async (req, res) => {
    const { title, content, author } = req.body;

    // Basic validation
    if (!title || !content || !author) {
        return res.status(400).json({ message: 'Please include a title, content, and author for the post.' });
    }

    try {
        const newPost = new Post({
            title,
            content,
            author,
        });

        const savedPost = await newPost.save();

        // --- Cross-Project Integration Example ---
        // After creating a post, we might want to send it to the AI-Powered Content Assistant
        // for sentiment analysis, keyword extraction, or content suggestions.
        if (process.env.AI_ASSISTANT_SERVICE_URL) {
            try {
                await integrations.sendToAIAssistant(savedPost);
                console.log(`Post ID ${savedPost._id} sent to AI Assistant for processing.`);
            } catch (aiError) {
                console.warn(`Failed to send post to AI Assistant: ${aiError.message}`);
                // Log the error but don't block the main post creation flow
            }
        }

        // Also, if we had a URL shortener, we might generate a short URL for the post.
        // This would typically happen in a dedicated service or a more complex integration flow.
        if (process.env.URL_SHORTENER_SERVICE_URL) {
            // Example: integrations.createShortUrlForPost(savedPost._id);
            console.log('Consider integrating with URL Shortener for this post.');
        }
        // --- End Cross-Project Integration Example ---

        res.status(201).json(savedPost); // 201 Created
    } catch (error) {
        console.error('Error creating post:', error);
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error while creating post.' });
    }
});

/**
 * @route PUT /api/posts/:id
 * @description Update an existing blog post
 * @access Public (in a real app, this might be protected)
 */
app.put('/api/posts/:id', async (req, res) => {
    const { title, content, author } = req.body;

    // Basic validation for update fields
    if (!title && !content && !author) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    try {
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            { title, content, author, updatedAt: Date.now() }, // Update timestamp
            { new: true, runValidators: true } // Return the updated document and run schema validators
        );

        if (!updatedPost) {
            return res.status(404).json({ message: 'Post not found.' });
        }
        res.status(200).json(updatedPost);
    } catch (error) {
        console.error(`Error updating post with ID ${req.params.id}:`, error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid post ID format.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error while updating post.' });
    }
});

/**
 * @route DELETE /api/posts/:id
 * @description Delete a blog post
 * @access Public (in a real app, this might be protected)
 */
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const deletedPost = await Post.findByIdAndDelete(req.params.id);

        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found.' });
        }
        res.status(200).json({ message: 'Post deleted successfully.' });
    } catch (error) {
        console.error(`Error deleting post with ID ${req.params.id}:`, error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid post ID format.' });
        }
        res.status(500).json({ message: 'Server error while deleting post.' });
    }
});

/**
 * @route GET /health
 * @description Health check endpoint for monitoring.
 * @access Public
 */
app.get('/health', async (req, res) => {
    const healthStatus = {
        status: 'UP',
        timestamp: new Date().toISOString(),
        database: 'OK',
        integrations: {}
    };

    // Check MongoDB connection status
    if (mongoose.connection.readyState !== 1) { // 1 means connected
        healthStatus.status = 'DEGRADED';
        healthStatus.database = 'DOWN';
    }

    // --- Cross-Project Integration Health Checks ---
    // Simulate checking connectivity to other services
    if (process.env.WEATHER_API_URL) {
        try {
            // In a real scenario, you'd make an actual ping or a lightweight API call
            await integrations.checkServiceHealth(process.env.WEATHER_API_URL);
            healthStatus.integrations.weatherDashboard = 'OK';
        } catch (e) {
            healthStatus.status = 'DEGRADED';
            healthStatus.integrations.weatherDashboard = 'DOWN';
        }
    }
    if (process.env.URL_SHORTENER_SERVICE_URL) {
        try {
            await integrations.checkServiceHealth(process.env.URL_SHORTENER_SERVICE_URL);
            healthStatus.integrations.urlShortener = 'OK';
        } catch (e) {
            healthStatus.status = 'DEGRADED';
            healthStatus.integrations.urlShortener = 'DOWN';
        }
    }
    if (process.env.AI_ASSISTANT_SERVICE_URL) {
        try {
            await integrations.checkServiceHealth(process.env.AI_ASSISTANT_SERVICE_URL);
            healthStatus.integrations.aiAssistant = 'OK';
        } catch (e) {
            healthStatus.status = 'DEGRADED';
            healthStatus.integrations.aiAssistant = 'DOWN';
        }
    }
    // --- End Cross-Project Integration Health Checks ---

    res.status(healthStatus.status === 'UP' ? 200 : 503).json(healthStatus);
});


// --- Error Handling Middleware (Catch-all for undefined routes) ---
app.use((req, res, next) => {
    res.status(404).json({ message: `Cannot ${req.method} ${req.url}. This route does not exist.` });
});

// --- Global Error Handler (for errors passed via next(err)) ---
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging
    res.status(500).json({ message: 'Something went wrong on the server.', error: err.message });
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the API at ${process.env.SERVER_URL || `http://localhost:${PORT}`}/api/posts`);
    console.log(`Client application expected at ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});