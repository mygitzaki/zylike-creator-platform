// Mobile debugging utility for Zylike Creator Platform
export const mobileDebug = {
  // Check if running on mobile device
  isMobile: () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  },

  // Check if running on iOS
  isIOS: () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  },

  // Check if running on Android
  isAndroid: () => {
    return /Android/.test(navigator.userAgent);
  },

  // Get device info
  getDeviceInfo: () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
      touchSupport: 'ontouchstart' in window,
      maxTouchPoints: navigator.maxTouchPoints || 0
    };
  },

  // Check clipboard support
  checkClipboardSupport: () => {
    return {
      clipboardAPI: !!navigator.clipboard,
      secureContext: window.isSecureContext,
      execCommand: !!document.execCommand,
      clipboardWrite: navigator.clipboard ? 'write' in navigator.clipboard : false,
      clipboardRead: navigator.clipboard ? 'read' in navigator.clipboard : false
    };
  },

  // Check network status
  checkNetworkStatus: () => {
    return {
      onLine: navigator.onLine,
      connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection,
      effectiveType: navigator.connection?.effectiveType || 'unknown',
      downlink: navigator.connection?.downlink || 'unknown',
      rtt: navigator.connection?.rtt || 'unknown'
    };
  },

  // Log all mobile debug info
  logAllInfo: () => {
    console.log('📱 === MOBILE DEBUG INFO ===');
    console.log('📱 Device Type:', mobileDebug.isMobile() ? 'Mobile' : 'Desktop');
    console.log('📱 Platform:', mobileDebug.isIOS() ? 'iOS' : mobileDebug.isAndroid() ? 'Android' : 'Other');
    console.log('📱 Device Info:', mobileDebug.getDeviceInfo());
    console.log('📱 Clipboard Support:', mobileDebug.checkClipboardSupport());
    console.log('📱 Network Status:', mobileDebug.checkNetworkStatus());
    console.log('📱 Local Storage:', {
      token: !!localStorage.getItem('token'),
      tokenLength: localStorage.getItem('token')?.length || 0
    });
    console.log('📱 === END MOBILE DEBUG ===');
  },

  // Test touch events
  testTouchEvents: () => {
    const testElement = document.createElement('div');
    testElement.style.position = 'fixed';
    testElement.style.top = '0';
    testElement.style.left = '0';
    testElement.style.width = '100px';
    testElement.style.height = '100px';
    testElement.style.backgroundColor = 'red';
    testElement.style.zIndex = '9999';
    
    let touchCount = 0;
    testElement.addEventListener('touchstart', () => {
      touchCount++;
      console.log('📱 Touch event detected:', touchCount);
      if (touchCount >= 3) {
        document.body.removeChild(testElement);
        console.log('📱 Touch test completed - removing test element');
      }
    });
    
    document.body.appendChild(testElement);
    console.log('📱 Touch test element added - tap the red square 3 times');
  }
};

export default mobileDebug;
