export async function startScreenRecording() {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: { ideal: 30 } },
  });

  // Create a floating recording indicator
  const indicator = document.createElement('div');
  indicator.id = 'recording-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    padding: 8px 16px;
    background: rgba(255, 0, 0, 0.8);
    color: white;
    border-radius: 4px;
    font-size: 14px;
    font-family: sans-serif;
    pointer-events: none;
    z-index: 999999;
    animation: pulse 2s infinite;
  `;
  indicator.textContent = '🔴 Recording';

  // Add pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(indicator);

  // Clean up when stream ends
  stream.getVideoTracks()[0].onended = () => {
    indicator.remove();
    style.remove();
  };

  return stream;
}

export async function startAudioRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });
  return stream;
}

export async function captureScreenshot(stream: MediaStream): Promise<string> {
  const videoTrack = stream.getVideoTracks()[0];
  const imageCapture = new ImageCapture(videoTrack);
  const bitmap = await imageCapture.grabFrame();

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(bitmap, 0, 0);
  }

  return canvas.toDataURL('image/png');
}

export function createMediaRecorder(stream: MediaStream, onDataAvailable: (blob: Blob) => void) {
  const mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = (e) => onDataAvailable(e.data);
  return mediaRecorder;
}

// Clean up recording indicator if it exists
export function cleanupRecordingBorder() {
  const indicator = document.getElementById('recording-indicator');
  const style = document.querySelector('style');
  if (indicator) indicator.remove();
  if (style?.textContent.includes('pulse')) style.remove();
}