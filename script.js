document.documentElement.classList.add('js');
document.addEventListener('DOMContentLoaded', () => {
  // Set current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Load blog feed
  loadBlogFeed();

  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.getElementById('main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      mainNav.classList.toggle('is-open', !isOpen);
      navToggle.querySelector('.sr-only').textContent = isOpen ? 'Open navigation' : 'Close navigation';
    });
    mainNav.addEventListener('click', (event) => {
      if (event.target.matches('a')) {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.querySelector('.sr-only').textContent = 'Open navigation';
        mainNav.classList.remove('is-open');
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.querySelector('.sr-only').textContent = 'Open navigation';
        mainNav.classList.remove('is-open');
        navToggle.focus();
      }
    });
  }
});

/**
 * Load and display the four most recent articles from the public feed.
 */
async function loadBlogFeed() {
  const blogContainer = document.getElementById('blog-container');
  const fallbackBlogs = document.getElementById('fallback-blogs');

  try {
    // Fetch the blogs data
    const response = await fetch('./data/blogs.json', { signal: AbortSignal.timeout(10000) });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blogs: ${response.status}`);
    }

    const data = await response.json();
    const blogs = Array.isArray(data.blogs) ? data.blogs.filter(blog => blog && typeof blog === 'object') : [];

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
    blogs.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4).forEach((blog) => {
      const card = createArticleCard(blog);
      blogContainer.appendChild(card);
    });
    blogContainer.style.removeProperty('display');
    fallbackBlogs.style.display = 'none';

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

  // Extract year from date, with a safe fallback for malformed feed values
  const date = new Date(blog.date);
  const year = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-AU', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  const source = typeof blog.source === 'string' && blog.source.trim() ? blog.source.trim() : 'Blog';

  const tag = document.createElement('span');
  tag.className = 'article-tag';
  tag.textContent = [source, year].filter(Boolean).join(' · ');

  const title = document.createElement('h3');
  title.textContent = blog.title || 'Untitled article';

  const description = document.createElement('p');
  description.textContent = blog.description || '';

  const link = document.createElement('a');
  const isListing = /linkedin\.com\/in\/[^/]+\/recent-activity\/articles\/?$|medium\.com\/@[^/]+\/?$/.test(blog.url || '');
  link.textContent = isListing ? `Browse ${source} writing` : `Read on ${source}`;
  link.target = '_blank';
  link.rel = 'noreferrer noopener';
  try {
    const url = new URL(blog.url, window.location.href);
    link.href = ['http:', 'https:'].includes(url.protocol) ? url.href : '#insights';
  } catch {
    link.href = '#insights';
  }

  article.append(tag, title, description, link);

  return article;
}
