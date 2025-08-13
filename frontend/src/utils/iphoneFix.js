// iPhone-specific fixes for Zylike Creator Platform
export const iphoneFix = {
  // Check if running on iPhone
  isIPhone: () => {
    return /iPhone/.test(navigator.userAgent) && !window.MSStream;
  },

  // Check if running on iOS Safari
  isIOSSafari: () => {
    const ua = navigator.userAgent;
    return /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/Chrome/.test(ua);
  },

  // Enhanced touch event handling for iPhone
  addIPhoneTouchHandlers: (element, handler) => {
    if (iphoneFix.isIPhone()) {
      // iPhone-specific touch handling
      element.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handler(e);
      }, { passive: false });
      
      element.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handler(e);
      }, { passive: false });
      
      // Also add click for fallback
      element.addEventListener('click', handler);
    } else {
      // Regular click for non-iPhone
      element.addEventListener('click', handler);
    }
  },

  // iPhone-safe clipboard copy
  copyToClipboardIPhone: async (text) => {
    if (iphoneFix.isIPhone()) {
      try {
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          return { success: true, method: 'modern' };
        }
      } catch {
        console.log('📱 iPhone: Modern clipboard failed, trying fallback');
      }

      // Fallback for iPhone
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        textArea.style.opacity = '0';
        textArea.style.pointerEvents = 'none';
        textArea.style.zIndex = '-1';
        
        document.body.appendChild(textArea);
        
        // iPhone-specific selection
        textArea.select();
        textArea.setSelectionRange(0, textArea.value.length);
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          return { success: true, method: 'fallback' };
        } else {
          return { success: false, method: 'fallback', error: 'execCommand failed' };
        }
      } catch (error) {
        return { success: false, method: 'fallback', error: error.message };
      }
    } else {
      // Non-iPhone devices
      try {
        await navigator.clipboard.writeText(text);
        return { success: true, method: 'standard' };
      } catch (error) {
        return { success: false, method: 'standard', error: error.message };
      }
    }
  },

  // iPhone-safe form submission
  submitFormIPhone: (formData, submitFunction) => {
    if (iphoneFix.isIPhone()) {
      // Add small delay for iPhone to process
      setTimeout(() => {
        submitFunction(formData);
      }, 100);
    } else {
      submitFunction(formData);
    }
  },

  // iPhone-specific input handling
  setupIPhoneInput: (inputElement) => {
    if (iphoneFix.isIPhone()) {
      // iPhone-specific input attributes
      inputElement.setAttribute('autocomplete', 'url');
      inputElement.setAttribute('autocapitalize', 'none');
      inputElement.setAttribute('autocorrect', 'off');
      inputElement.setAttribute('spellcheck', 'false');
      inputElement.setAttribute('inputmode', 'url');
      
      // iPhone-specific event handling
      inputElement.addEventListener('focus', () => {
        // Ensure input is visible on iPhone
        setTimeout(() => {
          inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      });
      
      // iPhone-specific blur handling
      inputElement.addEventListener('blur', () => {
        // Prevent iOS zoom on input blur
        document.body.style.fontSize = '16px';
      });
    }
  },

  // iPhone-specific button setup
  setupIPhoneButton: (buttonElement, clickHandler) => {
    if (iphoneFix.isIPhone()) {
      // iPhone-specific button attributes
      buttonElement.style.minHeight = '44px';
      buttonElement.style.minWidth = '44px';
      buttonElement.style.webkitTapHighlightColor = 'transparent';
      buttonElement.style.webkitTouchCallout = 'none';
      buttonElement.style.webkitUserSelect = 'none';
      
      // iPhone-specific touch handling
      iphoneFix.addIPhoneTouchHandlers(buttonElement, clickHandler);
      
      // iPhone-specific visual feedback
      buttonElement.addEventListener('touchstart', () => {
        buttonElement.style.transform = 'scale(0.95)';
      });
      
      buttonElement.addEventListener('touchend', () => {
        buttonElement.style.transform = 'scale(1)';
      });
    } else {
      buttonElement.addEventListener('click', clickHandler);
    }
  },

  // iPhone network request enhancement
  enhanceIPhoneRequest: (requestConfig) => {
    if (iphoneFix.isIPhone()) {
      return {
        ...requestConfig,
        timeout: 30000, // Longer timeout for iPhone
        headers: {
          ...requestConfig.headers,
          'User-Agent': navigator.userAgent,
          'Accept': 'application/json, text/plain, */*',
          'Cache-Control': 'no-cache'
        }
      };
    }
    return requestConfig;
  },

  // iPhone-specific error handling
  handleIPhoneError: (error, context) => {
    if (iphoneFix.isIPhone()) {
      console.log(`📱 iPhone Error in ${context}:`, error);
      
      // iPhone-specific error messages
      if (error.message.includes('Network Error')) {
        return 'Network connection issue. Please check your internet and try again.';
      } else if (error.message.includes('timeout')) {
        return 'Request timed out. Please try again.';
      } else if (error.response?.status === 401) {
        return 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 400) {
        return 'Invalid request. Please check your URL and try again.';
      } else {
        return 'An error occurred. Please try again.';
      }
    }
    return error.message || 'An error occurred';
  }
};

export default iphoneFix;
