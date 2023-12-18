const mongoose = require('mongoose');

/**
 * @file server/models/Post.js
 * @description Mongoose model for a blog post. Defines the schema and includes pre-save hooks for slug generation.
 */

/**
 * Helper function to generate a URL-friendly slug from a given string.
 * @param {string} text - The input string (e.g., post title).
 * @returns {string} A slugified version of the text.
 */
const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD') // Normalize Unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase() // Convert to lowercase
    .trim() // Trim whitespace from both ends
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w-]+/g, '') // Remove all non-word chars except hyphens
    .replace(/--+/g, '-'); // Replace multiple hyphens with a single hyphen
};

/**
 * Defines the Mongoose Schema for a Blog Post.
 *
 * A blog post includes:
 * - title: The main title of the post (required, unique).
 * - slug: A URL-friendly version of the title (required, unique, indexed).
 * - content: The main body of the blog post (required).
 * - author: The name of the author (required).
 * - tags: An array of strings for categorization.
 * - category: A single string for broader categorization.
 * - isPublished: Boolean indicating if the post is live (default: false).
 * - publishedAt: Date when the post was published (set when isPublished becomes true).
 * - thumbnailUrl: URL for a featured image/thumbnail.
 * - metaDescription: Short description for SEO purposes.
 * - views: Number of times the post has been viewed (default: 0).
 * - createdAt: Timestamp for when the post was created (managed by Mongoose).
 * - updatedAt: Timestamp for when the post was last updated (managed by Mongoose).
 */
const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Post title is required.'],
    unique: true,
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long.'],
    maxlength: [200, 'Title cannot exceed 200 characters.'],
  },
  slug: {
    type: String,
    required: [true, 'Post slug is required.'],
    unique: true,
    lowercase: true,
    index: true, // Index for faster lookups
  },
  content: {
    type: String,
    required: [true, 'Post content is required.'],
  },
  author: {
    type: String,
    required: [true, 'Author name is required.'],
    trim: true,
    minlength: [2, 'Author name must be at least 2 characters long.'],
  },
  tags: [{
    type: String,
    trim: true,
  }],
  category: {
    type: String,
    trim: true,
    default: 'Uncategorized',
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  publishedAt: {
    type: Date,
    default: null, // Will be set when `isPublished` becomes true
  },
  thumbnailUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Basic URL validation
        return v === '' || /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(v);
      },
      message: props => `${props.value} is not a valid URL for thumbnail!`
    }
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [300, 'Meta description cannot exceed 300 characters.'],
  },
  views: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

/**
 * Pre-save hook to generate a slug from the title before saving a new post
 * or updating an existing post's title.
 * Also handles setting `publishedAt` when `isPublished` changes to true.
 */
postSchema.pre('save', async function(next) {
  // Generate slug if title is modified or if it's a new document and slug is not set
  if (this.isModified('title') || this.isNew && !this.slug) {
    this.slug = slugify(this.title);
  }

  // Handle publishedAt timestamp
  if (this.isModified('isPublished') && this.isPublished === true && !this.publishedAt) {
    this.publishedAt = new Date();
  } else if (this.isModified('isPublished') && this.isPublished === false) {
    // Optionally reset publishedAt if unpublished
    this.publishedAt = null;
  }

  next();
});

/**
 * Static method to find a post by its slug.
 * @param {string} slug - The slug of the post to find.
 * @returns {Promise<Post|null>} The found post document or null.
 */
postSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug });
};

/**
 * Creates the Mongoose Model from the schema.
 * The model name 'Post' will result in a 'posts' collection in MongoDB.
 */
const Post = mongoose.model('Post', postSchema);

module.exports = Post;