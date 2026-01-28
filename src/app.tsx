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
 * Toggles track info popup visibility
 */
function toggleTrackInfoPopup(): void {
  const popup = document.querySelector('.track-info-popup') as HTMLElement;
  if (popup) {
    popup.classList.toggle('visible');
    updateTrackInfoPopup();
  }
}

/**
 * Gets the original track title element from the Spotify playbar
 */
function getOriginalTrackElement(): HTMLAnchorElement | null {
  return document.querySelector('.main-trackInfo-name a[href]') as HTMLAnchorElement;
}

/**
 * Gets the original artist elements from the Spotify playbar
 */
function getOriginalArtistElements(): NodeListOf<HTMLAnchorElement> {
  return document.querySelectorAll('.main-trackInfo-artists a[href]');
}

/**
 * Simulates a click on the original track title element
 */
function clickOriginalTrackTitle(): void {
  const originalTrackElement = getOriginalTrackElement();
  if (originalTrackElement) {
    originalTrackElement.click();
    console.log("[Custom Playbar] Clicked original track title");
  } else {
    console.log("[Custom Playbar] Could not find original track element");
  }
}

/**
 * Simulates a click on an original artist element by index
 */
function clickOriginalArtist(index: number): void {
  const artistElements = getOriginalArtistElements();
  if (artistElements[index]) {
    artistElements[index].click();
    console.log("[Custom Playbar] Clicked original artist at index:", index);
  } else {
    console.log("[Custom Playbar] Could not find original artist element at index:", index);
  }
}

/**
 * Opens the context menu for the current track
 */
function openTrackContextMenu(event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();
  
  // Try to find the original track row or title element
  const trackElement = document.querySelector('.main-trackInfo-name a[href]') as HTMLElement;
  
  if (trackElement) {
    // Create and dispatch a right-click event
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 2,
      clientX: event.clientX,
      clientY: event.clientY
    });
    
    trackElement.dispatchEvent(contextMenuEvent);
    console.log("[Custom Playbar] Opened track context menu");
  } else {
    console.log("[Custom Playbar] Could not find track element for context menu");
  }
}

/**
 * Updates track info popup with current track details
 */
function updateTrackInfoPopup(): void {
  if (!Spicetify?.Player?.data?.item) return;
  
  const track = Spicetify.Player.data.item;
  const artists = track.artists || [];
  const coverArt = track.images?.[0]?.url || track.album?.images?.[0]?.url || '';
  
  const coverImg = document.querySelector('.track-popup-cover') as HTMLImageElement;
  const trackName = document.querySelector('.track-popup-name') as HTMLElement;
  const trackArtist = document.querySelector('.track-popup-artist') as HTMLElement;
  
  if (coverImg && coverArt) {
    coverImg.src = coverArt;
    
    // Add right-click context menu handler to cover image
    coverImg.oncontextmenu = (e) => {
      openTrackContextMenu(e as MouseEvent);
    };
  }
  if (trackName) {
    const trackTitle = track.name || 'Unknown Track';
    // Display as plain text but make it clickable
    trackName.textContent = trackTitle;
    // Remove any existing click handlers and add the new one
    trackName.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      clickOriginalTrackTitle();
    };
  }
  if (trackArtist) {
    // Clear the container
    trackArtist.innerHTML = '';
    
    if (artists.length > 0) {
      // Create clickable spans for each artist
      artists.forEach((artist: any, index: number) => {
        const artistSpan = document.createElement('span');
        artistSpan.textContent = artist.name || 'Unknown Artist';
        artistSpan.className = 'artist-name-link';
        artistSpan.style.cursor = 'pointer';
        artistSpan.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          clickOriginalArtist(index);
        };
        
        trackArtist.appendChild(artistSpan);
        
        // Add comma separator if not the last artist
        if (index < artists.length - 1) {
          const separator = document.createElement('span');
          separator.textContent = ', ';
          separator.className = 'artist-separator';
          trackArtist.appendChild(separator);
        }
      });
    } else {
      trackArtist.textContent = 'Unknown Artist';
    }
  }
}

/**
 * Handles track info click without closing immediately
 */
function handleTrackInfoClick(event: MouseEvent): void {
  event.stopPropagation();
  toggleTrackInfoPopup();
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
  
  // Also update the track info popup when track changes
  updateTrackInfoPopup();
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
      <div class="playbar-progress-fill">
        <div class="playbar-progress-thumb"></div>
      </div>
    </div>
    <span class="playbar-time playbar-time-total">0:00</span>
  `;
  
  // Add click and drag handlers for seeking
  const progressBar = progressContainer.querySelector('.playbar-progress-bar') as HTMLElement;
  const progressThumb = progressContainer.querySelector('.playbar-progress-thumb') as HTMLElement;
  
  if (progressBar) {
    let isProgressDragging = false;
    
    const handleProgressSeek = (e: MouseEvent) => {
      const rect = progressBar.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const duration = Spicetify.Player.getDuration();
      const newPosition = duration * percentage;
      
      Spicetify.Player.seek(newPosition);
      updateProgressBar();
    };
    
    // Click anywhere on the bar to seek
    progressBar.addEventListener('click', (e) => {
      if (!isProgressDragging) {
        handleProgressSeek(e);
      }
    });
    
    // Thumb drag functionality
    if (progressThumb) {
      progressThumb.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isProgressDragging = true;
        handleProgressSeek(e);
      });
    }
    
    // Bar drag functionality
    progressBar.addEventListener('mousedown', (e) => {
      if (e.target === progressBar || (e.target as HTMLElement).classList.contains('playbar-progress-fill')) {
        e.preventDefault();
        isProgressDragging = true;
        handleProgressSeek(e);
      }
    });
    
    // Handle dragging
    document.addEventListener('mousemove', (e) => {
      if (isProgressDragging) {
        e.preventDefault();
        handleProgressSeek(e);
      }
    });
    
    document.addEventListener('mouseup', () => {
      if (isProgressDragging) {
        isProgressDragging = false;
      }
    });
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
      <div class="volume-slider-fill">
        <div class="volume-slider-thumb"></div>
      </div>
    </div>
  `;
  
  const volumeSliderBar = volumeSliderContainer.querySelector('.volume-slider-bar') as HTMLElement;
  const volumeThumb = volumeSliderContainer.querySelector('.volume-slider-thumb') as HTMLElement;
  
  if (volumeSliderBar) {
    let isVolumeDragging = false;
    
    const handleVolumeSet = (e: MouseEvent) => {
      const rect = volumeSliderBar.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      
      Spicetify.Player.setVolume(percentage);
      updateVolumeSlider();
    };
    
    // Click anywhere on the bar to set volume
    volumeSliderBar.addEventListener('click', (e) => {
      if (!isVolumeDragging) {
        handleVolumeSet(e);
      }
    });
    
    // Thumb drag functionality
    if (volumeThumb) {
      volumeThumb.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isVolumeDragging = true;
        handleVolumeSet(e);
      });
    }
    
    // Bar drag functionality
    volumeSliderBar.addEventListener('mousedown', (e) => {
      if (e.target === volumeSliderBar || (e.target as HTMLElement).classList.contains('volume-slider-fill')) {
        e.preventDefault();
        e.stopPropagation();
        isVolumeDragging = true;
        handleVolumeSet(e);
      }
    });
    
    // Handle dragging
    document.addEventListener('mousemove', (e) => {
      if (isVolumeDragging) {
        e.preventDefault();
        handleVolumeSet(e);
      }
    });
    
    document.addEventListener('mouseup', () => {
      if (isVolumeDragging) {
        isVolumeDragging = false;
      }
    });
  }
  
  volumeWrapper.appendChild(volumeSliderContainer);
  playbar.appendChild(volumeWrapper);

  // Track Info with popup (wrapped for popover positioning)
  const trackInfoWrapper = document.createElement('div');
  trackInfoWrapper.className = 'track-info-wrapper';
  
  const trackInfo = document.createElement("div");
  trackInfo.className = "playbar-track-info";
  trackInfo.innerHTML = `<span class="playbar-track-name">No track playing</span>`;
  trackInfo.style.cursor = 'pointer';
  trackInfo.addEventListener('click', (e) => handleTrackInfoClick(e as MouseEvent));
  trackInfoWrapper.appendChild(trackInfo);

  // Track info popup
  const trackInfoPopup = document.createElement('div');
  trackInfoPopup.className = 'track-info-popup';
  trackInfoPopup.addEventListener('click', (e) => e.stopPropagation());
  trackInfoPopup.innerHTML = `
    <div class="track-popup-content">
      <div class="track-popup-cover-container">
        <img class="track-popup-cover" src="" alt="Cover art" />
      </div>
      <div class="track-popup-details">
        <div class="track-popup-name">Track Name</div>
        <div class="track-popup-artist">Artist Name</div>
      </div>
      <div class="track-popup-actions">
        <button class="track-popup-btn" data-action="like" title="Add to Liked Songs">
          <svg viewBox="0 0 16 16" class="track-popup-icon">
            <path d="M15.724 4.22A4.313 4.313 0 0 0 12.192.814a4.269 4.269 0 0 0-3.622 1.13.837.837 0 0 1-1.14 0 4.272 4.272 0 0 0-6.21 5.855l5.916 7.05a1.128 1.128 0 0 0 1.727 0l5.916-7.05a4.228 4.228 0 0 0 .945-3.577z"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
  
  // Add action button handlers
  const likeBtn = trackInfoPopup.querySelector('[data-action="like"]') as HTMLButtonElement;
  const queueBtn = trackInfoPopup.querySelector('[data-action="queue"]') as HTMLButtonElement;
  
  if (likeBtn) {
    likeBtn.addEventListener('click', () => {
      Spicetify.Player.toggleHeart();
      console.log('[Custom Playbar] Toggled like');
    });
  }
  
  if (queueBtn) {
    queueBtn.addEventListener('click', () => {
      const addToQueueBtn = document.querySelector('[data-testid="add-to-queue-button"]') as HTMLButtonElement;
      if (addToQueueBtn) {
        addToQueueBtn.click();
        console.log('[Custom Playbar] Added to queue');
      }
    });
  }
  
  trackInfoWrapper.appendChild(trackInfoPopup);
  playbar.appendChild(trackInfoWrapper);

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
      position: relative;
    }

    .playbar-progress-thumb {
      position: absolute;
      right: -6px;
      top: 50%;
      transform: translateY(-50%);
      width: 12px;
      height: 12px;
      background: #fff;
      border-radius: 50%;
      cursor: grab;
      opacity: 0;
      transition: opacity 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      pointer-events: auto;
      z-index: 10;
    }

    .playbar-progress-thumb:active {
      cursor: grabbing;
    }

    .playbar-progress-bar:hover .playbar-progress-fill {
      background: var(--text-bright-accent, #1db954);
      box-shadow: 0 0 8px var(--text-bright-accent, #1db954);
    }

    .playbar-progress-bar:hover .playbar-progress-thumb {
      opacity: 1;
    }

    /* Track info */
    .track-info-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

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
      transition: background 0.2s ease;
    }

    .playbar-track-info:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .playbar-track-name {
      display: block;
      color: rgba(255, 255, 255, 0.8);
    }

    /* Track info popup */
    .track-info-popup {
      position: absolute;
      bottom: 64px;
      left: 0;
      transform: translateY(10px);
      background: rgba(40, 40, 40, 0.98);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s ease;
      pointer-events: none;
      z-index: 10000;
      min-width: 300px;
    }

    .track-info-popup.visible {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
      pointer-events: all;
    }

    .track-popup-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .track-popup-cover-container {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 4px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.1);
    }

    .track-popup-cover {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .track-popup-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .track-popup-name {
      font-size: 16px;
      font-weight: 600;
      color: #fff;
      line-height: 1.4;
      cursor: pointer;
      transition: color 0.2s ease;
    }

    .track-popup-name:hover {
      color: var(--spice-button, #1db954);
    }

    .track-popup-artist {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }

    .artist-name-link {
      transition: color 0.2s ease;
    }

    .artist-name-link:hover {
      color: var(--spice-button, #1db954);
    }

    .artist-separator {
      color: rgba(255, 255, 255, 0.7);
    }

    .track-popup-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .track-popup-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .track-popup-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
    }

    .track-popup-icon {
      width: 20px;
      height: 20px;
      fill: currentColor;
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
      position: relative;
    }

    .volume-slider-thumb {
      position: absolute;
      right: -6px;
      top: 50%;
      transform: translateY(-50%);
      width: 12px;
      height: 12px;
      background: #fff;
      border-radius: 50%;
      cursor: grab;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      pointer-events: auto;
      z-index: 10;
    }

    .volume-slider-thumb:active {
      cursor: grabbing;
    }

    .volume-slider-bar:hover .volume-slider-fill {
      background: var(--text-bright-accent, #1db954);
      box-shadow: 0 0 8px var(--text-bright-accent, #1db954);
    }

    .volume-slider-bar:hover .volume-slider-thumb {
      box-shadow: 0 0 8px rgba(29, 185, 84, 0.6);
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
    updateTrackInfoPopup();
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
    updateTrackInfoPopup();
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
    
    // Close track info popup when clicking outside
    const trackPopup = document.querySelector('.track-info-popup');
    const trackInfo = document.querySelector('.playbar-track-info');
    if (trackPopup && trackInfo && trackPopup.classList.contains('visible')) {
      if (!trackPopup.contains(e.target as Node) && !trackInfo.contains(e.target as Node)) {
        trackPopup.classList.remove('visible');
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

// ============================================
// CUSTOM LIBRARY PAGE
// ============================================

interface LibraryCategory {
  name: string;
  items: Array<{
    title: string;
    href: string;
    color: string;
    image: string;
  }>;
}

const libraryCategories: LibraryCategory[] = [
  {
    name: "Main Categories",
    items: [
      { title: "Music", href: "/genre/0JQ5DAqbMKFSi39LMRT0Cy", color: "rgb(220, 20, 140)", image: "https://i.scdn.co/image/ab67fb8200008e2c21cf047fac53f26680dcad78" },
      { title: "Podcasts", href: "/genre/0JQ5DArNBzkmxXHCqFLx2J", color: "rgb(0, 100, 80)", image: "https://i.scdn.co/image/ab67fb8200005caf6cc0187b9ea66de1525c3cec" },
      { title: "Audiobooks", href: "/genre/0JQ5DAqbMKFKLfwjuJMoNC", color: "rgb(30, 50, 100)", image: "https://i.scdn.co/image/ab67fb8200005cafa6152f62518b4c3251858b21" },
      { title: "Live Events", href: "/concerts", color: "rgb(132, 0, 231)", image: "https://concerts.spotifycdn.com/images/live-events_category-image.jpg" },
    ]
  },
  {
    name: "Genres",
    items: [
      { title: "Hip-Hop", href: "/genre/0JQ5DAqbMKFQ00XGBls6ym", color: "rgb(71, 125, 149)", image: "https://i.scdn.co/image/ab67fb8200005caf5f3752b3234e724f9cd6056f" },
      { title: "Pop", href: "/genre/0JQ5DAqbMKFEC4WFtoNRpw", color: "rgb(175, 40, 150)", image: "https://i.scdn.co/image/ab67fb8200005caf6171b9b0039f71854d4cd3c3" },
      { title: "Country", href: "/genre/0JQ5DAqbMKFKLfwjuJMoNC", color: "rgb(216, 64, 0)", image: "https://i.scdn.co/image/ab67fb8200005caf8573129e9a69a7482eca7879" },
      { title: "Rock", href: "/genre/0JQ5DAqbMKFDXXwE9BDJAr", color: "rgb(0, 100, 80)", image: "https://i.scdn.co/image/ab67fb8200005cafda4c849095796a9e5d2c4ddb" },
      { title: "R&B", href: "/genre/0JQ5DAqbMKFEZPnFQSFB1T", color: "rgb(186, 93, 7)", image: "https://i.scdn.co/image/ab67fb8200005caff4e38be86ca48a3b10884ae3" },
      { title: "Dance/Electronic", href: "/genre/0JQ5DAqbMKFHOzuVTgTizF", color: "rgb(71, 125, 149)", image: "https://i.scdn.co/image/ab67fb8200005caf26ada793217994216c79dad8" },
      { title: "Latin", href: "/genre/0JQ5DAqbMKFxXaXKP7zcDp", color: "rgb(175, 40, 150)", image: "https://i.scdn.co/image/ab67fb8200008e2c63003ca8561d50e223f5bcd8" },
      { title: "Jazz", href: "/genre/0JQ5DAqbMKFAj5xb0fwo9m", color: "rgb(141, 103, 171)", image: "https://i.scdn.co/image/ab67fb8200005cafa1bb187ec2f4606aa7101bad" },
      { title: "Metal", href: "/genre/0JQ5DAqbMKFDkd668ypn6O", color: "rgb(233, 20, 41)", image: "https://i.scdn.co/image/ab67fb8200005cafefa737b67ec51ec989f5a51d" },
      { title: "Classical", href: "/genre/0JQ5DAqbMKFPrEiAOxgac3", color: "rgb(125, 75, 50)", image: "https://i.scdn.co/image/ab67fb8200005caf4597370d1058e1ec3c1a56fa" },
      { title: "Indie", href: "/genre/0JQ5DAqbMKFCWjUTdzaG0e", color: "rgb(230, 30, 50)", image: "https://i.scdn.co/image/ab67fb8200005caf03086007caec2cceb4bce6d8" },
      { title: "Alternative", href: "/genre/0JQ5DAqbMKFTtlLYUHv8bT", color: "rgb(225, 51, 0)", image: "https://i.scdn.co/image/ab67fb8200005caf106e29a9f294cb4265da6af9" },
      { title: "K-pop", href: "/genre/0JQ5DAqbMKFGvOw3O4nLAf", color: "rgb(230, 30, 50)", image: "https://i.scdn.co/image/ab67fb8200005caf4b42030ee01cf793663dbb73" },
    ]
  },
  {
    name: "Moods & Activities",
    items: [
      { title: "Workout", href: "/genre/0JQ5DAqbMKFAXlCG6QvYQ4", color: "rgb(119, 119, 119)", image: "https://i.scdn.co/image/ab67fb8200005caf6af6d83c78493644c9b0627b" },
      { title: "Party", href: "/genre/0JQ5DAqbMKFA3gk1Sm6Vjf", color: "rgb(141, 103, 171)", image: "https://i.scdn.co/image/ab67fb8200005caf0b0d0bfac454671832311615" },
      { title: "Chill", href: "/genre/0JQ5DAqbMKFFzDl7qN9Apr", color: "rgb(176, 98, 57)", image: "https://i.scdn.co/image/ab67fb8200005caf330ca3a3bfaf8b18407fb33e" },
      { title: "Sleep", href: "/genre/0JQ5DAqbMKFCuoRTxhYWow", color: "rgb(30, 50, 100)", image: "https://i.scdn.co/image/ab67fb8200005caf1cef0cee1e498abb8e74955f" },
      { title: "Focus", href: "/genre/0JQ5DAqbMKFCbimwdOYlsl", color: "rgb(165, 103, 82)", image: "https://i.scdn.co/image/ab67fb8200005caf9a27506d5dde68b9da373196" },
      { title: "Love", href: "/genre/0JQ5DAqbMKFAUsdyVjCQuL", color: "rgb(220, 20, 140)", image: "https://i.scdn.co/image/ab67fb8200005caf21c9a95a2702ce535fb07915" },
      { title: "Mood", href: "/genre/0JQ5DAqbMKFzHmL4tf05da", color: "rgb(225, 17, 140)", image: "https://i.scdn.co/image/ab67fb8200005cafe542e9b59b1d2ae04b46b91c" },
      { title: "Gaming", href: "/genre/0JQ5DAqbMKFCfObibaOZbv", color: "rgb(232, 17, 91)", image: "https://i.scdn.co/image/ab67fb8200005caf26dd3719e8824756914ae61f" },
      { title: "Travel", href: "/genre/0JQ5DAqbMKFAQy4HL4XU2D", color: "rgb(13, 114, 237)", image: "https://i.scdn.co/image/ab67fb8200005caf879a886d22672d9b5b987746" },
      { title: "Wellness", href: "/genre/0JQ5DAqbMKFLb2EqgLtpjC", color: "rgb(20, 138, 8)", image: "https://i.scdn.co/image/ab67fb8200005cafd4a8da930bccd56ebd7e48b0" },
      { title: "Student", href: "/genre/0JQ5DAqbMKFJw7QLnM27p6", color: "rgb(175, 40, 150)", image: "https://i.scdn.co/image/ab67fb8200005cafdad1281e13697e8d8cf8f347" },
    ]
  },
  {
    name: "Curated Collections",
    items: [
      { title: "New Releases", href: "/genre/0JQ5DAqbMKFGaKcChsSgUO", color: "rgb(186, 93, 7)", image: "https://i.scdn.co/image/ab67fb8200005cafdccec075f58c20e8824f052c" },
      { title: "Charts", href: "/genre/0JQ5DAudkNjCgYMM0TZXDw", color: "rgb(141, 103, 171)", image: "https://charts-images.scdn.co/assets/locale_en/regional/weekly/region_global_default.jpg" },
      { title: "Trending", href: "/genre/0JQ5DAqbMKFQIL0AXnG5AK", color: "rgb(176, 40, 151)", image: "https://i.scdn.co/image/ab67fb8200005caf8e97784ff1e12e67ae922715" },
      { title: "Fresh Finds", href: "/genre/0JQ5DAqbMKFImHYGo3eTSg", color: "rgb(255, 0, 144)", image: "https://i.scdn.co/image/ab67fb8200005cafcc1499bbb8565f490858c2bc" },
      { title: "Decades", href: "/genre/0JQ5DAqbMKFIVNxQgRNSg0", color: "rgb(165, 103, 82)", image: "https://i.scdn.co/image/ab67fb8200005cafb7e805033eb938aa75d09336" },
      { title: "Made For You", href: "/genre/0JQ5DAt0tbjZptfcdMSKl3", color: "rgb(30, 50, 100)", image: "https://pickasso.spotifycdn.com/image/ab67c0de0000deef/dt/v1/img/topic/pop/1McMsnEElThX1knmY4oliG/en" },
      { title: "Discover", href: "/genre/0JQ5DAtOnAEpjOgUKwXyxj", color: "rgb(141, 103, 171)", image: "https://pickasso.spotifycdn.com/image/ab67c0de0000deef/dt/v1/img/dw/cover/en" },
    ]
  },
];

/**
 * Closes the library overlay
 */
function closeLibraryOverlay(): void {
  const overlay = document.querySelector('.library-overlay') as HTMLElement;
  if (overlay) {
    overlay.classList.remove('visible');
  }
}

/**
 * Opens the library overlay
 */
function openLibraryOverlay(): void {
  const overlay = document.querySelector('.library-overlay') as HTMLElement;
  if (overlay) {
    overlay.classList.add('visible');
  }
}

/**
 * Creates a carousel section with categories
 */
function createCarousel(category: LibraryCategory): HTMLElement {
  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'library-carousel-section';

  const title = document.createElement('h2');
  title.className = 'library-carousel-title';
  title.textContent = category.name;
  carouselContainer.appendChild(title);

  const carouselTrack = document.createElement('div');
  carouselTrack.className = 'library-carousel-track';

  category.items.forEach(item => {
    const card = document.createElement('a');
    card.href = item.href;
    card.className = 'library-card';
    card.style.backgroundColor = item.color;
    card.innerHTML = `
      <img src="${item.image}" alt="${item.title}" class="library-card-image" />
      <span class="library-card-title">${item.title}</span>
    `;
    card.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log("[Custom Library] Navigating to:", item.href, "Title:", item.title);
      
      // Try to find and click the original library item
      const originalLink = document.querySelector(`a[href="${item.href}"]`) as HTMLAnchorElement;
      
      if (originalLink) {
        console.log("[Custom Library] Found original link, clicking it");
        closeLibraryOverlay();
        // Simulate a click on the original item
        originalLink.click();
      } else {
        // Fallback: navigate using hash if original not found
        console.log("[Custom Library] Original link not found, using hash navigation");
        closeLibraryOverlay();
        window.location.hash = item.href;
      }
    });
    carouselTrack.appendChild(card);
  });

  // Add scroll buttons
  const scrollLeftBtn = document.createElement('button');
  scrollLeftBtn.className = 'library-scroll-btn library-scroll-left';
  scrollLeftBtn.innerHTML = '<svg viewBox="0 0 24 24" class="library-scroll-icon"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/></svg>';
  scrollLeftBtn.addEventListener('click', () => {
    carouselTrack.scrollBy({ left: -300, behavior: 'smooth' });
  });

  const scrollRightBtn = document.createElement('button');
  scrollRightBtn.className = 'library-scroll-btn library-scroll-right';
  scrollRightBtn.innerHTML = '<svg viewBox="0 0 24 24" class="library-scroll-icon"><path d="M10 6L8.59 7.41 12.17 11 8.59 14.59 10 16l6-6z" fill="currentColor"/></svg>';
  scrollRightBtn.addEventListener('click', () => {
    carouselTrack.scrollBy({ left: 300, behavior: 'smooth' });
  });

  const carouselWrapper = document.createElement('div');
  carouselWrapper.className = 'library-carousel-wrapper';
  carouselWrapper.appendChild(scrollLeftBtn);
  carouselWrapper.appendChild(carouselTrack);
  carouselWrapper.appendChild(scrollRightBtn);

  carouselContainer.appendChild(carouselWrapper);
  return carouselContainer;
}

/**
 * Creates the library overlay
 */
function createLibraryOverlay(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'library-overlay';

  const container = document.createElement('div');
  container.className = 'library-container';

  const header = document.createElement('div');
  header.className = 'library-header';
  header.innerHTML = `
    <h1>Browse All</h1>
    <button class="library-close-btn" aria-label="Close">
      <svg viewBox="0 0 24 24" class="library-close-icon"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
    </button>
  `;
  const closeBtn = header.querySelector('.library-close-btn') as HTMLButtonElement;
  if (closeBtn) {
    closeBtn.addEventListener('click', closeLibraryOverlay);
  }
  container.appendChild(header);

  const content = document.createElement('div');
  content.className = 'library-content';

  libraryCategories.forEach(category => {
    content.appendChild(createCarousel(category));
  });

  container.appendChild(content);
  overlay.appendChild(container);

  // Close overlay when clicking outside
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeLibraryOverlay();
    }
  });

  return overlay;
}

/**
 * Injects CSS styles for the custom library
 */
function injectLibraryStyles(): void {
  let styleElement = document.getElementById("custom-library-styles");
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = "custom-library-styles";
    document.head.appendChild(styleElement);
  }

  const css = `
    /* Library Overlay */
    .library-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 9998;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .library-overlay.visible {
      opacity: 1;
      visibility: visible;
    }

    /* Library Container */
    .library-container {
      background: linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%);
      border-radius: 12px;
      max-width: 90vw;
      max-height: 90vh;
      width: 100%;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* Library Header */
    .library-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
    }

    .library-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #fff;
    }

    .library-close-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #fff;
    }

    .library-close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .library-close-icon {
      width: 24px;
      height: 24px;
    }

    /* Library Content */
    .library-content {
      overflow-y: auto;
      flex: 1;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .library-content::-webkit-scrollbar {
      width: 8px;
    }

    .library-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
    }

    .library-content::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }

    .library-content::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    /* Carousel Section */
    .library-carousel-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .library-carousel-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #fff;
      padding: 0 12px;
    }

    /* Carousel Wrapper with scroll buttons */
    .library-carousel-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .library-carousel-track {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      scroll-behavior: smooth;
      padding: 0 4px;
      flex: 1;
      scroll-snap-type: x mandatory;
    }

    .library-carousel-track::-webkit-scrollbar {
      height: 6px;
    }

    .library-carousel-track::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 3px;
    }

    .library-carousel-track::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }

    /* Scroll Buttons */
    .library-scroll-btn {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(29, 185, 84, 0.8);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 2;
    }

    .library-scroll-btn:hover {
      background: var(--text-bright-accent, #1db954);
      transform: scale(1.1);
    }

    .library-scroll-btn:active {
      transform: scale(0.95);
    }

    .library-scroll-left {
      order: -1;
    }

    .library-scroll-icon {
      width: 20px;
      height: 20px;
    }

    /* Library Cards */
    .library-card {
      flex: 0 0 180px;
      aspect-ratio: 1;
      border-radius: 8px;
      display: flex;
      align-items: flex-end;
      justify-content: flex-start;
      padding: 12px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
      scroll-snap-align: start;
      background-size: cover;
      background-position: center;
    }

    .library-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.2));
      z-index: 1;
    }

    .library-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
    }

    .library-card:active {
      transform: translateY(-2px);
    }

    .library-card-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
    }

    .library-card-title {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      position: relative;
      z-index: 2;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-word;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .library-container {
        max-width: 95vw;
        max-height: 95vh;
      }

      .library-card {
        flex: 0 0 150px;
      }

      .library-carousel-title {
        font-size: 16px;
      }

      .library-header h1 {
        font-size: 24px;
      }
    }
  `;

  styleElement.textContent = css;
}

/**
 * Sets up the library button listener
 */
function setupLibraryListener(): void {
  // Create the library overlay and add it to the DOM
  const overlay = createLibraryOverlay();
  document.body.appendChild(overlay);

  // Watch for the Browse button and hook into it
  const observer = new MutationObserver(() => {
    // Look for the Browse button by aria-label
    const browseBtn = document.querySelector('button[aria-label="Browse"]') as HTMLButtonElement;
    
    if (browseBtn && !browseBtn.classList.contains('library-hooked')) {
      browseBtn.classList.add('library-hooked');
      
      // Store the original click handler
      const originalOnClick = browseBtn.onclick;
      
      // Replace with our custom handler
      browseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openLibraryOverlay();
        console.log("[Custom Library] Browse button clicked, opening library overlay");
      }, true); // Use capture phase to intercept before other handlers
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Also try to hook it immediately in case it already exists
  setTimeout(() => {
    const browseBtn = document.querySelector('button[aria-label="Browse"]') as HTMLButtonElement;
    if (browseBtn && !browseBtn.classList.contains('library-hooked')) {
      browseBtn.classList.add('library-hooked');
      browseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openLibraryOverlay();
        console.log("[Custom Library] Browse button clicked, opening library overlay");
      }, true);
    }
  }, 500);
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
  
  // Initialize custom library
  injectLibraryStyles();
  setupLibraryListener();
  
  waitForPlaybar();
}

export default main;
