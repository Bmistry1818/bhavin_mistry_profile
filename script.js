document.addEventListener('DOMContentLoaded', () => {
  // Set current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Load blog feed
  loadBlogFeed();
});

/**
 * Load and display blog feed from _data/blogs.json
 */
async function loadBlogFeed() {
  const blogContainer = document.getElementById('blog-container');
  const fallbackBlogs = document.getElementById('fallback-blogs');

  try {
    // Fetch the blogs data
    const response = await fetch('./_data/blogs.json');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blogs: ${response.status}`);
    }

    const data = await response.json();
    const blogs = data.blogs || [];

    // If no blogs found, show fallback
    if (blogs.length === 0) {
      console.log('No blogs loaded yet. Showing fallback content.');
      blogContainer.style.display = 'none';
      fallbackBlogs.style.display = 'block';
      return;
    }

    // Clear loading state
    blogContainer.innerHTML = '';

    // Create and append article cards
    blogs.forEach((blog) => {
      const card = createArticleCard(blog);
      blogContainer.appendChild(card);
    });

    console.log(`✅ Loaded ${blogs.length} blog articles`);

  } catch (error) {
    console.error('Error loading blog feed:', error);
    blogContainer.style.display = 'none';
    fallbackBlogs.style.display = 'block';
  }
}

/**
 * Create an article card element
 */
function createArticleCard(blog) {
  const article = document.createElement('article');
  article.className = 'article-card';

  // Extract year from date
  const date = new Date(blog.date);
  const year = date.getFullYear();
  const source = blog.source || 'Blog';

  // Create the card HTML
  article.innerHTML = `
    <span class="article-tag">${year} • ${source}</span>
    <h3>${escapeHtml(blog.title)}</h3>
    <p>${escapeHtml(blog.description)}</p>
    <a href="${blog.url}" target="_blank" rel="noreferrer noopener">Read on ${source}</a>
  `;

  return article;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
