// Custom Playbar Extension
// Creates a complete custom playbar overlay with reordered controls

// ============================================
// PLAYBAR STATE TRACKING
// ============================================

interface PlaybarState {
  isPlaying: boolean;
  isShuffle: boolean;
  repeat: number; // 0 = off, 1 = context, 2 = track
  volume: number;
}

let playbarState: PlaybarState = {
  isPlaying: false,
  isShuffle: false,
  repeat: 0,
  volume: 1,
};

let progressUpdateInterval: number | null = null;

// ============================================
// PLAYBAR CONTROL FUNCTIONS
// ============================================

/**
 * Triggers play/pause action
 */
function togglePlayPause(): void {
  Spicetify.Player.togglePlay();
  console.log("[Custom Playbar] Play/Pause toggled");
}

/**
 * Triggers previous track
 */
function playPrevious(): void {
  Spicetify.Player.back();
  console.log("[Custom Playbar] Previous track");
}

/**
 * Triggers next track
 */
function playNext(): void {
  Spicetify.Player.next();
  console.log("[Custom Playbar] Next track");
}

/**
 * Toggles shuffle
 */
function toggleShuffle(): void {
  Spicetify.Player.toggleShuffle();
  playbarState.isShuffle = !playbarState.isShuffle;
  updateShuffleButton();
  console.log("[Custom Playbar] Shuffle toggled:", playbarState.isShuffle);
}

/**
 * Toggles repeat
 */
function toggleRepeat(): void {
  Spicetify.Player.toggleRepeat();
  playbarState.repeat = (playbarState.repeat + 1) % 3;
  updateRepeatButton();
  console.log("[Custom Playbar] Repeat toggled:", playbarState.repeat);
}

/**
 * Updates shuffle button visual state
 */
function updateShuffleButton(): void {
  const shuffleBtn = document.querySelector('.shuffle-btn') as HTMLButtonElement;
  if (shuffleBtn) {
    shuffleBtn.classList.toggle('active', playbarState.isShuffle);
  }
}

/**
 * Updates repeat button visual state
 */
function updateRepeatButton(): void {
  const repeatBtn = document.querySelector('.repeat-btn') as HTMLButtonElement;
  if (repeatBtn) {
    repeatBtn.classList.toggle('active', playbarState.repeat > 0);
    repeatBtn.classList.toggle('repeat-one', playbarState.repeat === 2);
  }
}

/**
 * Toggles volume slider visibility
 */
function toggleVolumeSlider(): void {
  const slider = document.querySelector('.volume-slider-container') as HTMLElement;
  if (slider) {
    slider.classList.toggle('visible');
    updateVolumeSlider();
  }
}

/**
 * Updates volume slider position and icon
 */
function updateVolumeSlider(): void {
  const volume = Spicetify.Player.getVolume();
  const volumeFill = document.querySelector('.volume-slider-fill') as HTMLElement;
  const volumeBtn = document.querySelector('.volume-btn') as HTMLButtonElement;
  
  if (volumeFill) {
    volumeFill.style.width = `${volume * 100}%`;
  }
  
  if (volumeBtn) {
    let icon = '';
    if (volume === 0) {
      // Muted icon
      icon = `<svg viewBox="0 0 24 24" class="playbar-icon"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;
    } else if (volume < 0.33) {
      // Low volume icon
      icon = `<svg viewBox="0 0 24 24" class="playbar-icon"><path d="M7 9v6h4l5 5V4l-5 5H7z"/></svg>`;
    } else if (volume < 0.67) {
      // Medium volume icon
      icon = `<svg viewBox="0 0 24 24" class="playbar-icon"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02z"/></svg>`;
    } else {
      // High volume icon
      icon = `<svg viewBox="0 0 24 24" class="playbar-icon"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
    }
    volumeBtn.innerHTML = icon;
  }
}

/**
 * Sets volume based on slider position
 */
function setVolumeFromSlider(event: MouseEvent): void {
  const slider = event.currentTarget as HTMLElement;
  const rect = slider.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, x / rect.width));
  
  Spicetify.Player.setVolume(percentage);
  updateVolumeSlider();
  console.log("[Custom Playbar] Volume set to:", Math.round(percentage * 100) + "%");
}

/**
 * Handles clicks on the volume button without closing immediately
 */
function handleVolumeButtonClick(event: MouseEvent): void {
  event.stopPropagation();
  toggleVolumeSlider();
}

/**
 * Updates play/pause button icon
 */
function updatePlayPauseButton(): void {
  const playBtn = document.querySelector('.play-pause-btn') as HTMLButtonElement;
  if (playBtn) {
    const isPlaying = typeof Spicetify.Player.isPlaying === 'function'
      ? Spicetify.Player.isPlaying()
      : Spicetify.Player.data?.is_paused === false;
    playBtn.classList.toggle('is-playing', isPlaying === true);
    playBtn.classList.toggle('is-paused', isPlaying !== true);
    playBtn.innerHTML = isPlaying
      ? `<svg viewBox="0 0 24 24" class="playbar-icon"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>`
      : `<svg viewBox="0 0 24 24" class="playbar-icon"><path d="M8 5v14l11-7z"/></svg>`;
  }
}

/**
 * Updates progress bar
 */
function updateProgressBar(): void {
  const progressFill = document.querySelector('.playbar-progress-fill') as HTMLElement;
  const currentTimeEl = document.querySelector('.playbar-time-current') as HTMLElement;
  const totalTimeEl = document.querySelector('.playbar-time-total') as HTMLElement;

  if (Spicetify?.Player?.data) {
    const current = Spicetify.Player.getProgress();
    const duration = Spicetify.Player.getDuration();
    
    if (duration > 0) {
      const percentage = (current / duration) * 100;

      if (progressFill) {
        progressFill.style.width = `${Math.min(percentage, 100)}%`;
      }
      if (currentTimeEl) {
        currentTimeEl.textContent = formatTime(current);
      }
      if (totalTimeEl) {
        totalTimeEl.textContent = formatTime(duration);
      }
    }
  }
}

/**
 * Updates track info
 */
function updateTrackInfo(): void {
  const trackInfoEl = document.querySelector('.playbar-track-name') as HTMLElement;
  
  if (!trackInfoEl) return;
  
  if (Spicetify?.Player?.data?.item) {
    const track = Spicetify.Player.data.item;
    const artists = track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist';
    trackInfoEl.textContent = `${track.name || 'Unknown'} - ${artists}`;
  } else {
    // Fallback using getTrack
    const track = Spicetify.Player.data?.track;
    if (track) {
      const artists = track.metadata?.artist_name || 'Unknown Artist';
      const title = track.metadata?.title || 'Unknown';
      trackInfoEl.textContent = `${title} - ${artists}`;
    }
  }
}

/**
 * Formats milliseconds to MM:SS
 */
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Seeks to position on progress bar
 */
function seekToPosition(event: MouseEvent): void {
  const progressBar = event.currentTarget as HTMLElement;
  const rect = progressBar.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percentage = x / rect.width;
  const duration = Spicetify.Player.data.duration;
  const newPosition = duration * percentage;
  
  Spicetify.Player.seek(newPosition);
  console.log("[Custom Playbar] Seeked to:", formatTime(newPosition));
}

/**
 * Triggers lyrics button
 */
function showLyrics(): void {
  const lyricsBtn = document.querySelector('[data-testid="lyrics-button"]') as HTMLButtonElement;
  if (lyricsBtn) {
    lyricsBtn.click();
    console.log("[Custom Playbar] Lyrics opened");
  }
}

/**
 * Triggers queue button
 */
function showQueue(): void {
  const queueBtn = document.querySelector('[data-testid="control-button-queue"]') as HTMLButtonElement;
  if (queueBtn) {
    queueBtn.click();
    console.log("[Custom Playbar] Queue opened");
  }
}

/**
 * Creates a control button with icon and click handler
 */
function createControlButton(
  icon: string,
  label: string,
  onClick: () => void
): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "custom-playbar-btn";
  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
  button.innerHTML = icon;
  button.addEventListener("click", onClick);
  return button;
}

/**
 * Creates the custom playbar with all controls in order
 */
function createCustomPlaybar(): HTMLElement {
  const playbar = document.createElement("div");
  playbar.id = "custom-playbar-container";
  playbar.className = "custom-playbar-container";

  // Play/Pause button
  const playPauseBtn = createControlButton(
    `<svg viewBox="0 0 24 24" class="playbar-icon"><path d="M8 5v14l11-7z"/></svg>`,
    "Play/Pause",
    togglePlayPause
  );
  playPauseBtn.classList.add('play-pause-btn');
  playbar.appendChild(playPauseBtn);

  // Previous button
  playbar.appendChild(
    createControlButton(
      `<svg viewBox="0 0 24 24" class="playbar-icon"><path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6z"/></svg>`,
      "Previous",
      playPrevious
    )
  );

  // Next button
  playbar.appendChild(
    createControlButton(
      `<svg viewBox="0 0 24 24" class="playbar-icon"><path d="M16 18h2V6h-2v12zM6 18l8.5-6L6 6v12z"/></svg>`,
      "Next",
      playNext
    )
  );

  // Shuffle button
  const shuffleBtn = createControlButton(
    `<svg viewBox="0 0 24 24" class="playbar-icon"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>`,
    "Shuffle",
    toggleShuffle
  );
  shuffleBtn.classList.add('shuffle-btn');
  playbar.appendChild(shuffleBtn);

  // Repeat button
  const repeatBtn = createControlButton(
    `<svg viewBox="0 0 24 24" class="playbar-icon"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>`,
    "Repeat",
    toggleRepeat
  );
  repeatBtn.classList.add('repeat-btn');
  playbar.appendChild(repeatBtn);

  // Progress bar container
  const progressContainer = document.createElement("div");
  progressContainer.className = "playbar-progress-container";
  progressContainer.innerHTML = `
    <span class="playbar-time playbar-time-current">0:00</span>
    <div class="playbar-progress-bar">
      <div class="playbar-progress-fill"></div>
    </div>
    <span class="playbar-time playbar-time-total">0:00</span>
  `;
  
  // Add click handler for seeking
  const progressBar = progressContainer.querySelector('.playbar-progress-bar') as HTMLElement;
  if (progressBar) {
    progressBar.addEventListener('click', seekToPosition);
  }
  
  playbar.appendChild(progressContainer);

  // Volume button with slider (wrapped for popover positioning)
  const volumeWrapper = document.createElement('div');
  volumeWrapper.className = 'volume-wrapper';

  const volumeBtn = createControlButton(
    `<svg viewBox="0 0 24 24" class="playbar-icon"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`,
    "Volume",
    (e) => handleVolumeButtonClick(e as MouseEvent)
  );
  volumeBtn.classList.add('volume-btn');
  volumeWrapper.appendChild(volumeBtn);

  // Volume slider container
  const volumeSliderContainer = document.createElement('div');
  volumeSliderContainer.className = 'volume-slider-container';
  // Prevent clicks inside the slider from bubbling and closing it
  volumeSliderContainer.addEventListener('click', (e) => e.stopPropagation());
  volumeSliderContainer.innerHTML = `
    <div class="volume-slider-bar">
      <div class="volume-slider-fill"></div>
    </div>
  `;
  
  const volumeSliderBar = volumeSliderContainer.querySelector('.volume-slider-bar') as HTMLElement;
  if (volumeSliderBar) {
    volumeSliderBar.addEventListener('click', setVolumeFromSlider);
    
    // Add drag support
    let isDragging = false;
    volumeSliderBar.addEventListener('mousedown', (e) => {
      isDragging = true;
      setVolumeFromSlider(e as MouseEvent);
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const rect = volumeSliderBar.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right) {
          setVolumeFromSlider(e as MouseEvent);
        }
      }
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
  
  volumeWrapper.appendChild(volumeSliderContainer);
  playbar.appendChild(volumeWrapper);

  // Track Info (display only)
  const trackInfo = document.createElement("div");
  trackInfo.className = "playbar-track-info";
  trackInfo.innerHTML = `<span class="playbar-track-name">No track playing</span>`;
  playbar.appendChild(trackInfo);

  // Lyrics button
  playbar.appendChild(
    createControlButton(
      `<svg viewBox="0 0 16 16" class="playbar-icon"><path d="M13.426 2.574a2.831 2.831 0 0 0-4.797 1.55l3.247 3.247a2.831 2.831 0 0 0 1.55-4.797zM10.5 8.118l-2.619-2.62A63303.13 63303.13 0 0 0 4.74 9.075L2.065 12.12a1.287 1.287 0 0 0 1.816 1.816l3.06-2.688 3.56-3.129z"/></svg>`,
      "Lyrics",
      showLyrics
    )
  );

  // Queue button
  playbar.appendChild(
    createControlButton(
      `<svg viewBox="0 0 16 16" class="playbar-icon"><path d="M15 15H1v-1.5h14V15zm0-4.5H1V9h14v1.5zm-14-7A2.5 2.5 0 0 1 3.5 1h9a2.5 2.5 0 0 1 0 5h-9A2.5 2.5 0 0 1 1 3.5z"/></svg>`,
      "Queue",
      showQueue
    )
  );

  // Mini Player button (toggles picture-in-picture)
  playbar.appendChild(
    createControlButton(
      `<svg viewBox="0 0 16 16" class="playbar-icon"><path d="M16 2.45c0-.8-.65-1.45-1.45-1.45H1.45C.65 1 0 1.65 0 2.45v11.1C0 14.35.65 15 1.45 15h5.557v-1.5H1.5v-11h13V7H16V2.45z"/><path d="M15.25 9.007a.75.75 0 0 1 .75.75v4.493a.75.75 0 0 1-.75.75H9.325a.75.75 0 0 1-.75-.75V9.757a.75.75 0 0 1 .75-.75z"/></svg>`,
      "Mini Player",
      () => {
        const pipBtn = document.querySelector('[data-testid="pip-toggle-button"]') as HTMLButtonElement;
        if (pipBtn) {
          pipBtn.click();
          console.log("[Custom Playbar] Mini player toggled");
        } else {
          console.warn("[Custom Playbar] Mini player button not found");
        }
      }
    )
  );

  // Fullscreen button
  playbar.appendChild(
    createControlButton(
      `<svg viewBox="0 0 16 16" class="playbar-icon" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M0.25 3C0.25 2.0335 1.0335 1.25 2 1.25H5.375V2.75H2C1.86193 2.75 1.75 2.86193 1.75 3V5.42857H0.25V3ZM14 2.75H10.625V1.25H14C14.9665 1.25 15.75 2.0335 15.75 3V5.42857H14.25V3C14.25 2.86193 14.1381 2.75 14 2.75ZM1.75 10.5714V13C1.75 13.1381 1.86193 13.25 2 13.25H5.375V14.75H2C1.0335 14.75 0.25 13.9665 0.25 13V10.5714H1.75ZM14.25 13V10.5714H15.75V13C15.75 13.9665 14.9665 14.75 14 14.75H10.625V13.25H14C14.1381 13.25 14.25 13.1381 14.25 13Z" fill="currentColor"/></svg>`,
      "Fullscreen",
      () => {
        const fullscreenBtn = document.querySelector('[data-testid="fullscreen-mode-button"]') as HTMLButtonElement;
        if (fullscreenBtn) {
          fullscreenBtn.click();
          console.log("[Custom Playbar] Fullscreen toggled");
        } else {
          console.warn("[Custom Playbar] Fullscreen button not found");
        }
      }
    )
  );

  return playbar;
}

/**
 * Injects CSS styles for the custom playbar
 */
function injectCustomPlaybarStyles(): void {
  let styleElement = document.getElementById("custom-playbar-styles");
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = "custom-playbar-styles";
    document.head.appendChild(styleElement);
  }

  const css = `
    /* Hide original playbar */
    .Root__now-playing-bar,
    .player-controls,
    footer.Root__now-playing-bar {
      display: none !important;
    }

    /* Custom playbar container */
    .custom-playbar-container {
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      height: 90px !important;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.85)) !important;
      border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
      display: flex !important;
      align-items: center !important;
      gap: 16px !important;
      padding: 0 16px !important;
      z-index: 9999 !important;
      overflow: visible !important;
      box-sizing: border-box !important;
    }

    /* Custom playbar button styling */
    .custom-playbar-btn {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      padding: 0;
    }

    .custom-playbar-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      color: var(--text-bright-accent, #1db954);
      transform: scale(1.1);
    }

    .custom-playbar-btn:active {
      transform: scale(0.95);
    }

    /* Play/pause distinct colors */
    .custom-playbar-btn.play-pause-btn {
      background: var(--text-bright-accent, #1db954);
      color: #000;
    }

    .custom-playbar-btn.play-pause-btn.is-paused {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
    }

    .custom-playbar-btn.play-pause-btn:hover {
      box-shadow: 0 0 10px rgba(29, 185, 84, 0.6);
    }

    /* Active button states */
    .custom-playbar-btn.active {
      background: rgba(29, 185, 84, 0.2);
      color: var(--text-bright-accent, #1db954);
    }

    .custom-playbar-btn.repeat-one::after {
      content: "1";
      position: absolute;
      font-size: 10px;
      font-weight: bold;
      margin-top: 8px;
    }

    /* Playbar icon styling */
    .playbar-icon {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }

    /* Progress bar container */
    .playbar-progress-container {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-grow: 1;
      min-width: 200px;
    }

    .playbar-time {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      min-width: 35px;
    }

    .playbar-progress-bar {
      flex-grow: 1;
      height: 4px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
      cursor: pointer;
      position: relative;
    }

    .playbar-progress-fill {
      height: 100%;
      background: var(--text-bright-accent, #1db954);
      border-radius: 2px;
      width: 0%;
    }

    .playbar-progress-bar:hover .playbar-progress-fill {
      background: var(--text-bright-accent, #1db954);
      box-shadow: 0 0 8px var(--text-bright-accent, #1db954);
    }

    /* Track info */
    .playbar-track-info {
      min-width: 200px;
      max-width: 250px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
      color: #fff;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .playbar-track-name {
      display: block;
      color: rgba(255, 255, 255, 0.8);
    }

    /* Scrollbar styling for custom playbar */
    .custom-playbar-container::-webkit-scrollbar {
      height: 4px;
    }

    .custom-playbar-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .custom-playbar-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
    }

    .custom-playbar-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    /* Volume slider */
    .volume-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .volume-slider-container {
      position: absolute;
      bottom: 64px;
      right: -8px;
      transform: translateY(10px);
      background: rgba(40, 40, 40, 0.98);
      border-radius: 8px;
      padding: 12px 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s ease;
      pointer-events: none;
      z-index: 10000;
      min-width: 150px;
    }

    .volume-slider-container.visible {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
      pointer-events: all;
    }

    .volume-slider-bar {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      cursor: pointer;
      position: relative;
    }

    .volume-slider-fill {
      height: 100%;
      background: var(--text-bright-accent, #1db954);
      border-radius: 3px;
      width: 100%;
      transition: width 0.1s ease;
    }

    .volume-slider-bar:hover .volume-slider-fill {
      background: var(--text-bright-accent, #1db954);
      box-shadow: 0 0 8px var(--text-bright-accent, #1db954);
    }

    /* Adjust body to account for fixed playbar */
    body {
      padding-bottom: 90px;
    }
  `;

  styleElement.textContent = css;
}

/**
 * Creates the toggle button with icon
 */
function createToggleButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.setAttribute("data-testid", "playbar-toggle-button");
  button.setAttribute("aria-pressed", toggleState.isToggled.toString());
  button.setAttribute("aria-label", "Toggle");
  button.setAttribute("data-encore-id", "buttonTertiary");
  button.className =
    "Button-sc-1dqy6lx-0 Button-buttonTertiary-small-iconOnly-isUsingKeyboard-useBrowserDefaultFocusStyle e-91000-overflow-wrap-anywhere e-91000-button-tertiary--icon-only playbar-toggle-button";

  const iconSpan = document.createElement("span");
  iconSpan.setAttribute("aria-hidden", "true");
  iconSpan.className = "e-91000-button__icon-wrapper";

  // Create SVG icon (star icon as example - you can change this)
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("data-encore-id", "icon");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", "e-91000-icon e-91000-baseline");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute(
    "style",
    "--encore-icon-height: var(--encore-graphic-size-decorative-smaller); --encore-icon-width: var(--encore-graphic-size-decorative-smaller);"
  );

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8"
  );
  svg.appendChild(path);

  iconSpan.appendChild(svg);
  button.appendChild(iconSpan);

  // Add click handler
  button.addEventListener("click", () => {
    toggleOverlay();
    button.setAttribute("aria-pressed", toggleState.isToggled.toString());
    console.log("[Playbar Control] Toggled:", toggleState.isToggled);

    if (toggleState.isToggled) {
      applyRearrangements();
      button.style.color = "var(--text-bright-accent, #1db954)";
    } else {
      revertRearrangements();
      button.style.color = "inherit";
    }

    // Dispatch custom event for other extensions to listen to
    window.dispatchEvent(
      new CustomEvent("playbar-toggle-changed", {
        detail: { isToggled: toggleState.isToggled },
      })
    );
  });

  return button;
}

/**
 * Inserts the toggle button in the correct position
 * The button goes into the .player-controls__right div
 */
function insertToggleButton(): void {
  // Toggle button is no longer used - custom playbar replaces it
  console.log("[Custom Playbar] Toggle button disabled, using custom playbar instead");
}

/**
 * Apply CSS styles to ensure proper layout on one horizontal axis
 */
function applyPlaybarStyles(): void {
  // Old playbar styles - no longer needed
  console.log("[Custom Playbar] Using custom playbar styles");
}

/**
 * Wait for the DOM to be ready and set up the extension
 */
function waitForPlaybar(): void {
  const checkInterval = setInterval(() => {
    // Wait for Spotify Player API to be ready
    if (Spicetify?.Player && document.body) {
      clearInterval(checkInterval);

      // Inject custom playbar styles
      injectCustomPlaybarStyles();

      // Create and inject the custom playbar
      const customPlaybar = createCustomPlaybar();
      document.body.appendChild(customPlaybar);

      // Set up event listeners for state updates
      setupEventListeners();

      // Initial state update
      updateAllStates();

      console.log("[Custom Playbar] Extension loaded successfully");
    }
  }, 100);

  // Timeout after 10 seconds
  setTimeout(() => {
    clearInterval(checkInterval);
    console.error("[Custom Playbar] Timeout waiting for DOM");
  }, 10000);
}

/**
 * Sets up Spicetify event listeners
 */
function setupEventListeners(): void {
  // Listen for song changes
  Spicetify.Player.addEventListener("songchange", () => {
    console.log("[Custom Playbar] Song changed");
    updateTrackInfo();
    updateProgressBar();
  });

  // Listen for playback state changes
  Spicetify.Player.addEventListener("onplaypause", () => {
    console.log("[Custom Playbar] Play/pause state changed");
    updatePlayPauseButton();
  });

  // Update progress bar more frequently (every 200ms for smooth animation)
  progressUpdateInterval = window.setInterval(() => {
    updateProgressBar();
  }, 200);

  // Initial update after a short delay to ensure data is loaded
  setTimeout(() => {
    updateTrackInfo();
    updateProgressBar();
    playbarState.isShuffle = Spicetify.Player.getShuffle();
    playbarState.repeat = Spicetify.Player.getRepeat();
    updatePlayPauseButton();
    updateShuffleButton();
    updateRepeatButton();
    updateVolumeSlider();
  }, 500);

  // Close volume slider when clicking outside
  document.addEventListener('click', (e) => {
    const slider = document.querySelector('.volume-slider-container');
    const volumeBtn = document.querySelector('.volume-btn');
    if (slider && volumeBtn && slider.classList.contains('visible')) {
      if (!slider.contains(e.target as Node) && !volumeBtn.contains(e.target as Node)) {
        slider.classList.remove('visible');
      }
    }
  });

  console.log("[Custom Playbar] Event listeners set up");
}

/**
 * Updates all states initially
 */
function updateAllStates(): void {
  updateTrackInfo();
  updateProgressBar();
  updatePlayPauseButton();
  
  playbarState.isShuffle = Spicetify.Player.getShuffle();
  playbarState.repeat = Spicetify.Player.getRepeat();
  updateShuffleButton();
  updateRepeatButton();
}

/**
 * Main function to initialize the extension
 */
async function main(): Promise<void> {
  // Wait for Spicetify to be available
  while (!Spicetify) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("[Playbar Toggle] Initializing extension...");
  waitForPlaybar();
}

export default main;
