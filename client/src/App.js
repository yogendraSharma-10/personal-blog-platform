import React, { useState, useEffect } from 'react';
import PostItem from './components/PostItem';
import './styles/App.css';

/**
 * Base URL for the backend API.
 * In a production environment, this would typically be configured via environment variables
 * or a build-time configuration (e.g., using `create-react-app`'s `REACT_APP_` prefix).
 * Defaults to `http://localhost:5000/api` for local development.
 */
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

/**
 * The main application component for the Personal Blog Platform.
 * Manages fetching, creating, updating, and deleting blog posts.
 */
function App() {
  // State to store the list of blog posts fetched from the backend.
  const [posts, setPosts] = useState([]);
  // State for the title input field in the post creation/editing form.
  const [title, setTitle] = useState('');
  // State for the content input field in the post creation/editing form.
  const [content, setContent] = useState('');
  // State to track if a post is currently being edited. Stores the ID of the post being edited.
  // Null indicates that a new post is being created.
  const [editingPostId, setEditingPostId] = useState(null);
  // State for displaying a loading indicator during API calls.
  const [loading, setLoading] = useState(false);
  // State for displaying error messages to the user.
  const [error, setError] = useState(null);

  /**
   * Fetches all blog posts from the backend API.
   * Updates the `posts` state and handles loading/error states.
   */
  const fetchPosts = async () => {
    setLoading(true); // Set loading to true before the API call
    setError(null);   // Clear any previous errors
    try {
      const response = await fetch(`${API_BASE_URL}/posts`);
      if (!response.ok) {
        // If the response is not OK (e.g., 404, 500), throw an error
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPosts(data); // Update the posts state with fetched data
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError('Failed to load posts. Please check your network connection or try again later.');
    } finally {
      setLoading(false); // Set loading to false after the API call completes (success or failure)
    }
  };

  // useEffect hook to fetch posts when the component mounts.
  // The empty dependency array `[]` ensures this effect runs only once after the initial render.
  useEffect(() => {
    fetchPosts();
  }, []);

  /**
   * Handles the submission of the post form.
   * This function either creates a new post or updates an existing one based on `editingPostId`.
   * @param {Event} e - The form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the default browser form submission behavior

    // Basic client-side validation
    if (!title.trim() || !content.trim()) {
      setError('Title and content cannot be empty.');
      return;
    }

    setLoading(true); // Indicate loading state
    setError(null);   // Clear previous errors

    const postData = { title, content };
    let url = `${API_BASE_URL}/posts`;
    let method = 'POST';

    // Determine if we are creating or updating a post
    if (editingPostId) {
      url = `${API_BASE_URL}/posts/${editingPostId}`;
      method = 'PUT'; // Use PUT for updating
    }

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json', // Specify content type for JSON payload
        },
        body: JSON.stringify(postData), // Convert JavaScript object to JSON string
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // After successful operation, refetch all posts to ensure the UI is up-to-date.
      // For larger applications, a more optimized approach might be to update the state
      // directly with the new/updated post returned by the API.
      await fetchPosts();

      // Clear the form fields and exit edit mode
      setTitle('');
      setContent('');
      setEditingPostId(null);
    } catch (err) {
      console.error(`Failed to ${editingPostId ? 'update' : 'create'} post:`, err);
      setError(`Failed to ${editingPostId ? 'update' : 'create'} post. Please try again.`);
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  /**
   * Populates the form fields with the data of the post to be edited.
   * Sets `editingPostId` to enable edit mode.
   * @param {Object} post - The post object to be edited.
   */
  const handleEdit = (post) => {
    setTitle(post.title);
    setContent(post.content);
    setEditingPostId(post._id); // Assuming `_id` is the unique identifier from MongoDB
    // Scroll to the top of the page to bring the form into view for editing
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Cancels the current editing operation.
   * Clears the form fields and resets `editingPostId` to exit edit mode.
   */
  const handleCancelEdit = () => {
    setTitle('');
    setContent('');
    setEditingPostId(null);
    setError(null); // Clear any error messages that might have been set during editing
  };

  /**
   * Deletes a post by its ID.
   * Prompts the user for confirmation before proceeding with deletion.
   * @param {string} id - The unique ID of the post to delete.
