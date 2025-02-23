export async function startScreenRecording() {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: { ideal: 30 } },
  });

  // Add recording border
  const border = document.createElement('div');
  border.id = 'recording-border';
  border.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 4px solid red;
    pointer-events: none;
    z-index: 9999;
    animation: pulse 2s infinite;
  `;

  // Add pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { border-color: rgba(255, 0, 0, 1); }
      50% { border-color: rgba(255, 0, 0, 0.5); }
      100% { border-color: rgba(255, 0, 0, 1); }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(border);

  // Clean up when stream ends
  stream.getVideoTracks()[0].onended = () => {
    border.remove();
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
  ctx?.drawImage(bitmap, 0, 0);

  return canvas.toDataURL('image/png');
}

export function createMediaRecorder(stream: MediaStream, onDataAvailable: (blob: Blob) => void) {
  const mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = (e) => onDataAvailable(e.data);
  return mediaRecorder;
}

// Clean up recording border if it exists
export function cleanupRecordingBorder() {
  const border = document.getElementById('recording-border');
  const style = document.querySelector('style');
  if (border) border.remove();
  if (style && style.textContent.includes('pulse')) style.remove();
}