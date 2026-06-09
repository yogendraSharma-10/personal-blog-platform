import React, { useState } from 'react';

/**
 * PostItem Component
 *
 * Displays a single blog post with options to edit and delete.
 * It manages its own editing state and communicates changes via props.
 *
 * @param {object} props - The component props.
 * @param {object} props.post - The post object containing id, title, and content.
 *                               Expected structure: `{ _id: string, title: string, content: string, createdAt?: string }`.
 * @param {function} props.onEdit - Callback function to handle post edits.
 *                                  Signature: `(postId: string, updatedData: { title: string, content: string }) => void`.
 * @param {function} props.onDelete - Callback function to handle post deletions.
 *                                    Signature: `(postId: string) => void`.
 */
function PostItem({ post, onEdit, onDelete }) {
  // State to manage whether the post is currently in editing mode
  const [isEditing, setIsEditing] = useState(false);
  // State to hold the title value during editing
  const [editedTitle, setEditedTitle] = useState(post.title);
  // State to hold the content value during editing
  const [editedContent, setEditedContent] = useState(post.content);

  /**
   * Handles the click event for the 'Edit' button.
   * Switches the component into editing mode and initializes the edit fields
   * with the current post's data.
   */
  const handleEditClick = () => {
    setIsEditing(true);
    setEditedTitle(post.title); // Ensure current post data is loaded into edit fields
    setEditedContent(post.content);
  };

  /**
   * Handles the click event for the 'Save' button during editing.
   * Validates input, then calls the `onEdit` prop with the post's ID and
   * the new title/content. Finally, exits editing mode.
   */
  const handleSaveClick = () => {
    // Basic validation to prevent saving empty title or content
    if (editedTitle.trim() === '' || editedContent.trim() === '') {
      alert('Title and content cannot be empty.');
      return;
    }
    // Call the parent's onEdit function with the post ID and updated data
    onEdit(post._id, { title: editedTitle, content: editedContent });
    setIsEditing(false); // Exit editing mode
  };

  /**
   * Handles the click event for the 'Delete' button.
   * Prompts the user for confirmation before calling the `onDelete` prop
   * with the post's ID.
   */
  const handleDeleteClick = () => {
    if (window.confirm(`Are you sure you want to delete "${post.title}"? This action cannot be undone.`)) {
      onDelete(post._id);
    }
  };

  /**
   * Handles the click event for the 'Cancel' button during editing.
   * Exits editing mode without saving any changes and resets the edit fields
   * to the original post's values.
   */
  const handleCancelClick = () => {
    setIsEditing(false);
    // Reset edited values to the original post's values
    setEditedTitle(post.title);
    setEditedContent(post.content);
  };

  return (
    <div className="post-item" data-post-id={post._id}>
      {isEditing ? (
        // Render the edit form when in editing mode
        <div className="post-edit-form">
          <input
            type="text"
            className="post-edit-title-input"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder="Post Title"
            aria-label="Edit post title"
            required
          />
          <textarea
            className="post-edit-content-textarea"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows="6"
            placeholder="Post Content"
            aria-label="Edit post content"
            required
          ></textarea>
          <div className="post-actions">
            <button onClick={handleSaveClick} className="btn btn-save">Save</button>
            <button onClick={handleCancelClick} className="btn btn-cancel">Cancel</button>
          </div>
        </div>
      ) : (
        // Render the post view when not in editing mode
        <>
          <h3 className="post-title">{post.title}</h3>
          <p className="post-content">{post.content}</p>
          <div className="post-meta">
            {/* Example of a subtle cross-project context mention: */}
            {/* If this blog post was processed by an AI assistant, we could display a tag. */}
            {/* <span className="post-meta-tag" data-service="ai-assistant" title="Content enhanced by AI-Powered Content Assistant">AI-Enhanced</span> */}
            {post.createdAt && (
              <span className="post-date">
                Published: {new Date(post.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="post-actions">
            <button onClick={handleEditClick} className="btn btn-edit">Edit</button>
            <button onClick={handleDeleteClick} className="btn btn-delete">Delete</button>
          </div>
        </>
      )}
    </div>
  );
}

export default PostItem;