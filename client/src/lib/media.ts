export async function startScreenRecording() {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: { ideal: 30 } },
  });
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
