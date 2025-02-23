import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { startScreenRecording, startAudioRecording, captureScreenshot, createMediaRecorder } from "@/lib/media";
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
  const screenStreamRef = useRef<MediaStream>();
  const audioStreamRef = useRef<MediaStream>();
  const mediaRecorderRef = useRef<MediaRecorder>();
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      audioStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const screenStream = await startScreenRecording();
      const audioStream = await startAudioRecording();
      
      screenStreamRef.current = screenStream;
      audioStreamRef.current = audioStream;
      
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

      // Set up preview
      const video = document.createElement('video');
      video.srcObject = screenStream;
      video.play();
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || !screenStreamRef.current) return;

    try {
      // Capture final screenshot
      const screenshot = await captureScreenshot(screenStreamRef.current);
      
      // Stop recording
      mediaRecorderRef.current.stop();
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current?.getTracks().forEach(track => track.stop());
      
      // Create final recording blob
      const recordingBlob = new Blob(recordedChunksRef.current, {
        type: "video/webm"
      });
      
      onStepRecorded({ screenshot, recordingBlob });
      setPreviewUrl(screenshot);
      setIsRecording(false);
      recordedChunksRef.current = [];
    } catch (error) {
      console.error("Failed to stop recording:", error);
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
