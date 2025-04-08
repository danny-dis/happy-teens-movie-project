/**
 * Keyboard navigation utility for accessibility
 * Implements arrow key navigation for focusable elements
 */

// Initialize keyboard navigation
export const initKeyboardNavigation = () => {
  // Add keyboard event listener to document
  document.addEventListener('keydown', handleKeyDown);
  
  // Add focus visible class to body when using keyboard
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });
  
  // Remove focus visible class when using mouse
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
  });
};

// Handle keyboard navigation
const handleKeyDown = (e) => {
  // Only handle arrow keys
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Space'].includes(e.key)) {
    return;
  }
  
  const focusableElements = getFocusableElements();
  const currentElement = document.activeElement;
  
  // If no element is focused, focus the first one
  if (!currentElement || currentElement === document.body) {
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      e.preventDefault();
    }
    return;
  }
  
  // Find the current element's index
  const currentIndex = focusableElements.indexOf(currentElement);
  if (currentIndex === -1) return;
  
  // Handle navigation based on key pressed
  switch (e.key) {
    case 'ArrowRight':
      // Move focus to the next element
      if (currentIndex < focusableElements.length - 1) {
        focusableElements[currentIndex + 1].focus();
        e.preventDefault();
      }
      break;
      
    case 'ArrowLeft':
      // Move focus to the previous element
      if (currentIndex > 0) {
        focusableElements[currentIndex - 1].focus();
        e.preventDefault();
      }
      break;
      
    case 'ArrowDown':
      // Find the element below the current one
      navigateVertically(currentElement, focusableElements, 'down');
      e.preventDefault();
      break;
      
    case 'ArrowUp':
      // Find the element above the current one
      navigateVertically(currentElement, focusableElements, 'up');
      e.preventDefault();
      break;
      
    case 'Enter':
    case 'Space':
      // Simulate click on the focused element
      if (currentElement.tagName !== 'INPUT' && currentElement.tagName !== 'TEXTAREA') {
        currentElement.click();
        e.preventDefault();
      }
      break;
      
    default:
      break;
  }
};

// Get all focusable elements
const getFocusableElements = () => {
  const selector = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(document.querySelectorAll(selector))
    .filter(el => {
      // Filter out hidden elements
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             style.opacity !== '0' &&
             el.offsetWidth > 0 &&
             el.offsetHeight > 0;
    });
};

// Navigate vertically between elements
const navigateVertically = (currentElement, allElements, direction) => {
  const currentRect = currentElement.getBoundingClientRect();
  const currentCenterX = currentRect.left + currentRect.width / 2;
  
  // Filter elements that are above/below the current element
  const eligibleElements = allElements.filter(el => {
    if (el === currentElement) return false;
    
    const rect = el.getBoundingClientRect();
    const isBelow = direction === 'down' && rect.top > currentRect.bottom;
    const isAbove = direction === 'up' && rect.bottom < currentRect.top;
    
    return isBelow || isAbove;
  });
  
  if (eligibleElements.length === 0) return;
  
  // Find the closest element
  let closestElement = eligibleElements[0];
  let closestDistance = Infinity;
  
  eligibleElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const horizontalDistance = Math.abs(centerX - currentCenterX);
    const verticalDistance = direction === 'down' 
      ? rect.top - currentRect.bottom 
      : currentRect.top - rect.bottom;
    
    // Prioritize elements that are directly above/below
    const totalDistance = horizontalDistance * 3 + verticalDistance;
    
    if (totalDistance < closestDistance) {
      closestDistance = totalDistance;
      closestElement = el;
    }
  });
  
  closestElement.focus();
  
  // Add focus indicator
  closestElement.classList.add('remote-control-focus');
  setTimeout(() => {
    closestElement.classList.remove('remote-control-focus');
  }, 1000);
};

// Add keyboard navigation styles
export const addKeyboardNavigationStyles = () => {
  // Create a style element
  const style = document.createElement('style');
  style.textContent = `
    .keyboard-navigation *:focus {
      outline: 3px solid #e50914 !important;
      outline-offset: 2px !important;
    }
    
    .keyboard-navigation .movie:focus,
    .keyboard-navigation .nav-btn:focus,
    .keyboard-navigation .category-btn:focus,
    .keyboard-navigation .profile-avatar:focus {
      transform: scale(1.05);
    }
  `;
  
  // Add the style to the document head
  document.head.appendChild(style);
};
