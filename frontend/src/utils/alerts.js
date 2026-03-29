let audioEnabled = true;
let audioContext = null;

export const toggleAudio = () => {
  audioEnabled = !audioEnabled;
  return audioEnabled;
};

export const isAudioEnabled = () => audioEnabled;

// Play alert sound (beep)
export const playAlertSound = () => {
  if (!audioEnabled) return;

  try {
    // Initialize audio context if needed
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const ctx = audioContext;
    const now = ctx.currentTime;
    const duration = 0.2;

    // Create oscillator for beep sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = 800; // Hz
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch (error) {
    console.error('Audio playback error:', error);
  }
};

// Play alert sequence (3 beeps)
export const playAlertSequence = () => {
  if (!audioEnabled) return;

  const playBeep = (delay) => {
    setTimeout(() => playAlertSound(), delay);
  };

  playBeep(0);
  playBeep(250);
  playBeep(500);
};

// Visual alert notification
export const showVisualAlert = (message, type = 'alert') => {
  // Flash the window title
  const originalTitle = document.title;
  let count = 0;
  const flashInterval = setInterval(() => {
    count++;
    if (count > 6) {
      clearInterval(flashInterval);
      document.title = originalTitle;
      return;
    }
    document.title = count % 2 === 0 ? originalTitle : '⚠️ ALERT';
  }, 300);

  // Request notification if available
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Elder Care Alert', {
      body: message,
      icon: '/alert-icon.png',
      tag: 'toilet-alert'
    });
  }
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// Combined alert (visual + audio)
export const triggerAlert = (message) => {
  playAlertSequence();
  showVisualAlert(message);
};
