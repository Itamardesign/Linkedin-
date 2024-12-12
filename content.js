
// UI Components
const createCommentButton = () => {
  const button = document.createElement('button');
  button.innerHTML = 'Generate AI Comment';
  button.className = 'generate-comment-btn';
  button.style.cssText = `
    background-color: #FF69B4;
    color: white;
    padding: 8px 16px;
    border-radius: 16px;
    border: none;
    margin-left: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;
  `;

  button.addEventListener('mouseover', () => {
    button.style.backgroundColor = '#FF1493';
  });

  button.addEventListener('mouseout', () => {
    button.style.backgroundColor = '#FF69B4';
  });

  button.addEventListener('click', generateAIComment);
  return button;
}

const createSuggestionsPopup = (suggestions) => {
  const popup = document.createElement('div');
  popup.className = 'suggestions-popup';
  popup.style.cssText = `
    position: absolute;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 12px;
    z-index: 9999;
    width: 300px;
    margin-top: 8px;
  `;

  const title = document.createElement('div');
  title.textContent = 'Choose a comment:';
  title.style.cssText = `
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #000000E6;
  `;
  popup.appendChild(title);

  suggestions.forEach((suggestion) => {
    const option = document.createElement('div');
    option.textContent = suggestion;
    option.style.cssText = `
      padding: 8px 12px;
      margin: 4px 0;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
      font-size: 14px;
      color: #000000E6;
    `;
    option.addEventListener('mouseover', () => {
      option.style.backgroundColor = '#F3F6F8';
    });
    option.addEventListener('mouseout', () => {
      option.style.backgroundColor = 'transparent';
    });
    option.addEventListener('click', () => {
      insertComment(suggestion);
      popup.remove();
    });
    popup.appendChild(option);
  });

  return popup;
}

async function generateAIComment() {
  const apiKey = localStorage.getItem('openai_api_key');
  if (!apiKey) {
    alert('Please set your OpenAI API key in the extension popup first.');
    return;
  }

  const postElement = findNearestPost();
  if (!postElement) {
    alert('Could not find the post content. Please try again.');
    return;
  }

  const button = document.querySelector('.generate-comment-btn');
  if (button) {
    button.style.opacity = '0.7';
    button.textContent = 'Generating...';
    button.style.cursor = 'wait';
  }

  const postContent = postElement.textContent || '';
  
  try {
    const response = await fetch('https://byxmnqmvvtnvbqhiqcbl.supabase.co/functions/v1/generate-comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ postContent }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate comment');
    }

    const data = await response.json();
    
    if (data.suggestions && data.suggestions.length > 0) {
      const popup = createSuggestionsPopup(data.suggestions);
      const buttonRect = button?.getBoundingClientRect();
      if (buttonRect) {
        popup.style.left = `${buttonRect.left}px`;
        popup.style.top = `${buttonRect.bottom + window.scrollY}px`;
      }
      document.body.appendChild(popup);

      // Close popup when clicking outside
      const closePopup = (e) => {
        if (!popup.contains(e.target) && e.target !== button) {
          popup.remove();
          document.removeEventListener('click', closePopup);
        }
      };
      setTimeout(() => {
        document.addEventListener('click', closePopup);
      }, 0);
    }
  } catch (error) {
    console.error('Error generating comment:', error);
    alert('Failed to generate comment. Please check your API key and try again.');
  } finally {
    if (button) {
      button.style.opacity = '1';
      button.textContent = 'Generate AI Comment';
      button.style.cursor = 'pointer';
    }
  }
}

function findNearestPost() {
  const commentBox = document.querySelector('[contenteditable="true"]');
  if (!commentBox) return null;

  let element = commentBox.parentElement;
  while (element && !element.classList.contains('feed-shared-update-v2')) {
    element = element.parentElement;
  }

  if (!element) return null;

  return element.querySelector('.feed-shared-update-v2__description');
}

function insertComment(comment) {
  const commentBox = document.querySelector('[contenteditable="true"]');
  if (commentBox) {
    commentBox.textContent = comment;
    // Trigger input event to ensure LinkedIn registers the change
    const event = new Event('input', { bubbles: true });
    commentBox.dispatchEvent(event);
  }
}

function init() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        const commentBoxes = document.querySelectorAll('[contenteditable="true"]');
        commentBoxes.forEach((box) => {
          if (!box.parentElement?.querySelector('.generate-comment-btn')) {
            const button = createCommentButton();
            box.parentElement?.appendChild(button);
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

init();
