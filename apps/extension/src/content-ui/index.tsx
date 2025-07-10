console.log('[YTClipper UI] content-ui script loaded');

function waitForPlayerContainer(callback: (container: HTMLElement) => void) {
  const interval = setInterval(() => {
    const playerContainer = document.querySelector(
      '.html5-video-player',
    ) as HTMLElement;

    if (playerContainer) {
      clearInterval(interval);
      callback(playerContainer);
    }
  }, 500);
}

function createOverlayButton() {
  const button = document.createElement('button');

  button.innerText = '⏱️ Clip';
  button.title = 'Save timestamp';
  button.id = 'ytclipper-overlay-button';

  Object.assign(button.style, {
    position: 'absolute',
    bottom: '60px',
    right: '20px',
    zIndex: '10000',
    padding: '8px 14px',
    backgroundColor: '#ff6b35',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    transition: 'opacity 0.2s',
  });

  button.addEventListener('click', () => {
    console.log('[YTClipper UI] Button clicked');
    window.postMessage({ type: 'YTCLIPPER_UI_SAVE_TIMESTAMP' }, '*');
  });

  return button;
}

function injectOverlayButton(playerContainer: HTMLElement) {
  if (document.getElementById('ytclipper-overlay-button')) return;

  const button = createOverlayButton();

  playerContainer.appendChild(button);
  console.log('[YTClipper UI] Button injected');
}

// Run
waitForPlayerContainer((container) => {
  injectOverlayButton(container);
});
