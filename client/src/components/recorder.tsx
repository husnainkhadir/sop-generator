import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { startScreenRecording, startAudioRecording, captureScreenshot, createMediaRecorder, cleanupRecordingBorder } from "@/lib/media";
import { Loader2, Video, Mic, Camera, Square, StopCircle } from "lucide-react";

interface RecorderProps {
  onStepRecorded: (data: {
    screenshot: string;
    recordingBlob: Blob;
  }) => void;
}

export function Recorder({ onStepRecorded }: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [currentTranscription, setCurrentTranscription] = useState<string>("");
  const screenStreamRef = useRef<MediaStream>();
  const audioStreamRef = useRef<MediaStream>();
  const mediaRecorderRef = useRef<MediaRecorder>();
  const recordedChunksRef = useRef<Blob[]>([]);
  const wsRef = useRef<WebSocket>();
  const audioRecorderRef = useRef<MediaRecorder>();

  useEffect(() => {
    return () => {
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      audioStreamRef.current?.getTracks().forEach(track => track.stop());
      audioRecorderRef.current?.stop();
      cleanupRecordingBorder();
      wsRef.current?.close();
    };
  }, []);

  const setupWebSocket = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/transcribe`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'transcription') {
        console.log('Received transcription:', message.data);
        setCurrentTranscription(prev => prev + " " + message.data);
      } else if (message.type === 'error') {
        console.error('Transcription error:', message.message);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    wsRef.current = ws;
  };

  const startRecording = async () => {
    try {
      const screenStream = await startScreenRecording();
      const audioStream = await startAudioRecording();

      screenStreamRef.current = screenStream;
      audioStreamRef.current = audioStream;

      // Set up WebSocket for real-time transcription
      setupWebSocket();

      // Create a separate audio recorder for streaming to WebSocket
      const audioRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioRecorder.ondataavailable = async (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN && e.data.size > 0) {
          console.log('Sending audio chunk of size:', e.data.size);
          // Convert blob to base64
          const reader = new FileReader();
          reader.onload = () => {
            const base64Audio = (reader.result as string).split(',')[1];
            wsRef.current?.send(JSON.stringify({
              type: 'audio',
              data: base64Audio,
              final: false
            }));
          };
          reader.readAsDataURL(e.data);
        }
      };

      audioRecorderRef.current = audioRecorder;
      audioRecorder.start(1000); // Collect data every second

      // Set up main recorder for final recording
      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);

      const mediaRecorder = createMediaRecorder(combinedStream, (blob) => {
        recordedChunksRef.current.push(blob);
      });

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setCurrentTranscription(""); // Reset transcription

      // Set up preview
      const video = document.createElement('video');
      video.srcObject = screenStream;
      video.play();
    } catch (error) {
      console.error("Failed to start recording:", error);
      cleanupRecordingBorder();
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || !screenStreamRef.current) return;

    try {
      // Capture final screenshot
      const screenshot = await captureScreenshot(screenStreamRef.current);

      // Stop recording
      mediaRecorderRef.current.stop();
      audioRecorderRef.current?.stop();
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current?.getTracks().forEach(track => track.stop());

      // Send final audio chunk
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'audio',
          final: true
        }));
        wsRef.current.close();
      }

      // Create final recording blob
      const recordingBlob = new Blob(recordedChunksRef.current, {
        type: "video/webm"
      });

      onStepRecorded({ screenshot, recordingBlob });
      setPreviewUrl(screenshot);
      setIsRecording(false);
      recordedChunksRef.current = [];

      // Clean up recording border
      cleanupRecordingBorder();
    } catch (error) {
      console.error("Failed to stop recording:", error);
      cleanupRecordingBorder();
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {isRecording && currentTranscription && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Live Transcription:</p>
            <p className="mt-2">{currentTranscription}</p>
          </div>
        )}

        <div className="flex gap-2 justify-center">
          {!isRecording ? (
            <Button onClick={startRecording} className="gap-2">
              <Camera className="w-4 h-4" />
              Start Recording
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive" className="gap-2">
              <StopCircle className="w-4 h-4" />
              Stop Recording
            </Button>
          )}
        </div>

        {isRecording && (
          <div className="flex items-center justify-center gap-2 text-red-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Recording in progress...
          </div>
        )}
      </div>
    </Card>
  );
}