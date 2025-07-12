import './content.css';

interface ClipperState {
  clipper_enabled?: boolean;
}
// TypeScript interfaces
interface Timestamp {
  id: string;
  timestamp: number;
  title: string;
  note: string;
  tags: string[];
  createdAt: string;
}

interface YouTubePageData {
  videoId: string;
  title: string;
  currentTime: number;
}

class YouTubeHandler {
  private player: HTMLVideoElement | null = null;
  private currentVideoId: string | null = null;
  private observers: MutationObserver[] = [];
  private isAuthenticated: boolean = true;
  private clipperEnabled: boolean = true;

  private clipButton: HTMLButtonElement | null = null;
  private playerContainer: HTMLElement | null = null;
  private controlBar: HTMLElement | null = null;

  constructor() {
    this.init();
    this.initializeClipperState();
  }

  private init() {
    this.checkAuthentication();
    this.waitForPlayer();
    this.observeUrlChanges();
  }

  private initializeClipperState() {
    try {
      const result = chrome.storage.sync.get('clipper_enabled') as ClipperState;
      this.clipperEnabled = result?.clipper_enabled ?? true;
    } catch (error) {
      console.error('Failed to initialize clipper state:', error);
      this.clipperEnabled = true;
    }
  }

  handleClipperToggle(enabled: boolean) {
    this.clipperEnabled = enabled;
    this.updateClipButtonVisibility();
  }

  private async checkAuthentication() {
    try {
      const result = await chrome.storage.sync.get([
        'auth0_token',
        'user_info',
      ]);

      this.isAuthenticated = !!(result.auth0_token && result.user_info);
      this.updateClipButtonVisibility();
    } catch (error) {
      console.error('Failed to check authentication:', error);
      this.isAuthenticated = false;
      this.updateClipButtonVisibility();
    }
  }

  private waitForPlayer() {
    const checkPlayer = () => {
      this.player = document.querySelector('video') as HTMLVideoElement;
      console.log('Checking for YouTube player:', this.player);
      if (this.player) {
        this.detectVideoChange();
        this.injectClipButton();
      } else {
        setTimeout(checkPlayer, 1000);
      }
    };

    console.log('Waiting for YouTube player...');
    checkPlayer();
  }

  private injectClipButton() {
    // Find player container
    this.playerContainer = document.querySelector('.html5-video-player');
    if (!this.playerContainer) {
      setTimeout(() => this.injectClipButton(), 500);
      return;
    }

    // Create button if it doesn't exist
    if (!this.clipButton) {
      // Find a reference button (settings button)
      const refButton = document.querySelector(
        '.ytp-settings-button, .ytp-button',
      ) as HTMLElement;

      if (!refButton) {
        setTimeout(() => this.injectClipButton(), 500);
        return;
      }

      // Clone the reference button
      this.clipButton = refButton.cloneNode(true) as HTMLButtonElement;
      this.clipButton.id = 'yt-clipper-button';
      this.clipButton.title = 'Save clip at current time';
      this.clipButton.classList.add('yt-clipper-custom');

      // Remove all children to replace with our icon
      while (this.clipButton.firstChild) {
        this.clipButton.removeChild(this.clipButton.firstChild);
      }

      // Create SVG icon
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', '24');
      svg.setAttribute('height', '24');

      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path',
      );
      path.setAttribute(
        'd',
        'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
      );
      path.setAttribute('stroke', 'white');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');

      svg.appendChild(path);
      this.clipButton.appendChild(svg);

      // Add click handler
      this.clipButton.addEventListener('click', () => {
        this.saveQuickTimestamp();
      });

      // Insert before the reference button
      refButton.parentNode?.insertBefore(this.clipButton, refButton);
    }

    // Apply custom styles
    this.updateClipButtonStyles();
    this.updateClipButtonVisibility();
  }

  private updateClipButtonStyles() {
    if (!this.clipButton) return;

    // Apply orange theme while keeping YouTube's button structure
    this.clipButton.style.cssText = `
    background-color: #FF6B35 !important;
    border-radius: 4px !important;
    margin: 0 4px !important;
    padding: 5px !important;
    width: auto !important;
    height: auto !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
  `;

    // Hover effects
    this.clipButton.onmouseenter = () => {
      this.clipButton!.style.backgroundColor = '#E05A2A !important';
      this.clipButton!.style.transform = 'translateY(-1px)';
      this.clipButton!.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    };

    this.clipButton.onmouseleave = () => {
      this.clipButton!.style.backgroundColor = '#FF6B35 !important';
      this.clipButton!.style.transform = 'none';
      this.clipButton!.style.boxShadow = 'none';
    };

    this.clipButton.onmousedown = () => {
      this.clipButton!.style.transform = 'translateY(1px)';
      this.clipButton!.style.boxShadow = 'none';
    };

    this.clipButton.onmouseup = () => {
      this.clipButton!.style.transform = 'translateY(-1px)';
      this.clipButton!.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    };

    // Adjust icon size
    const svg = this.clipButton.querySelector('svg');
    if (svg) {
      svg.style.width = '20px';
      svg.style.height = '20px';
    }
  }

  private updateClipButtonVisibility() {
    if (!this.clipButton) return;

    if (this.isAuthenticated && this.clipperEnabled) {
      this.clipButton.style.display = 'flex';
      this.clipButton.style.opacity = '1';
    } else {
      this.clipButton.style.display = 'none';
      this.clipButton.style.opacity = '0';
    }
  }

  private observeUrlChanges() {
    // Watch for URL changes in YouTube SPA
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        this.detectVideoChange();
      }

      if (!this.clipButton && document.querySelector('.html5-video-player')) {
        this.injectClipButton();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.observers.push(observer);
  }

  private detectVideoChange() {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');

    if (videoId && videoId !== this.currentVideoId) {
      this.currentVideoId = videoId;
      this.loadTimestamps();
    }
  }

  private async loadTimestamps() {
    if (!this.currentVideoId) return;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_TIMESTAMPS',
        data: { videoId: this.currentVideoId },
      });

      if (response.success) {
        this.displayTimestamps(response.timestamps);
      }
    } catch (error) {
      console.error('Failed to load timestamps:', error);
    }
  }

  private displayTimestamps(timestamps: Timestamp[]) {
    // Remove existing timestamp markers
    document
      .querySelectorAll('.ytclipper-timestamp')
      .forEach((el) => el.remove());

    // Add timestamp markers to the video progress bar
    const progressBar = document.querySelector('.ytp-progress-bar-container');

    if (progressBar && timestamps.length > 0) {
      timestamps.forEach((timestamp) => {
        this.addTimestampMarker(timestamp, progressBar as HTMLElement);
      });
    }
  }

  private addTimestampMarker(timestamp: Timestamp, container: HTMLElement) {
    const marker = document.createElement('div');

    marker.className = 'ytclipper-timestamp';
    marker.title = `${timestamp.title} - ${this.formatTime(timestamp.timestamp)}`;
    marker.style.cssText = `
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background-color: #ff6b35;
      cursor: pointer;
      z-index: 1000;
      left: ${(timestamp.timestamp / (this.player?.duration ?? 1)) * 100}%;
    `;

    marker.addEventListener('click', () => {
      if (this.player) {
        this.player.currentTime = timestamp.timestamp;
      }
    });

    container.appendChild(marker);
  }

  async saveQuickTimestamp() {
    if (!this.player || !this.currentVideoId) return;

    const pageData = this.getPageData();

    if (!pageData) return;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_TIMESTAMP',
        data: {
          videoId: pageData.videoId,
          timestamp: pageData.currentTime,
          title: `Timestamp at ${this.formatTime(pageData.currentTime)}`,
          note: '',
          tags: [],
        },
      });

      if (response.success) {
        this.showNotification('Timestamp saved!');
        this.loadTimestamps(); // Refresh timestamp display
      } else {
        this.showNotification('Failed to save timestamp', 'error');
      }
    } catch (error) {
      console.log('Error saving timestamp:', error);
      this.showNotification('Failed to save timestamp', 'error');
    }
  }

  private getPageData(): YouTubePageData | null {
    if (!this.player || !this.currentVideoId) return null;

    const titleElement = document.querySelector(
      'h1.ytd-watch-metadata yt-formatted-string',
    );
    const title = titleElement?.textContent ?? 'Unknown Video';

    return {
      videoId: this.currentVideoId,
      title,
      currentTime: this.player.currentTime,
    };
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private showNotification(
    message: string,
    type: 'success' | 'error' = 'success',
  ) {
    const notification = document.createElement('div');

    notification.className = 'ytclipper-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background-color: ${type === 'success' ? '#4CAF50' : '#f44336'};
      color: white;
      border-radius: 8px;
      z-index: 10000;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  public destroy() {
    this.observers.forEach((observer) => observer.disconnect());
    if (this.clipButton) {
      this.clipButton.remove();
      this.clipButton = null;
    }
  }
}

const youtubeHandler = new YouTubeHandler();

window.addEventListener('beforeunload', () => {
  youtubeHandler.destroy();
});

console.log('Content script loaded on:', window.location.href);

window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('source') === 'extension') {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #007bff;
      color: white;
      padding: 10px 15px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    indicator.textContent = 'Login to continue using YT Clipper extension';
    document.body.appendChild(indicator);

    setTimeout(() => {
      indicator.remove();
    }, 8000);
  }
});

window.addEventListener('message', (event) => {
  if (event.origin !== 'http://localhost:5173') return;

  if (event.data.type === 'AUTH0_TOKEN_UPDATE') {
    chrome.runtime.sendMessage({
      type: 'AUTH0_TOKEN_UPDATE',
      token: event.data.token,
      expiry: event.data.expiry,
      user: event.data.user,
    });
  }

  if (event.data.type === 'AUTH0_LOGOUT') {
    chrome.runtime.sendMessage({ type: 'AUTH0_LOGOUT' });
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TOGGLE_CLIPPER') {
    youtubeHandler.handleClipperToggle(message.enabled);
  }
});
