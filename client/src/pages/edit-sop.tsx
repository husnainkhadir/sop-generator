import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Recorder } from "@/components/recorder";
import { DocumentEditor } from "@/components/document-editor";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import type { Sop, Step } from "@shared/schema";

export default function EditSOP({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState<{
    screenshot: string;
    transcription?: string;
    refinedContent?: string;
  }>();

  const { data: sop } = useQuery<Sop>({
    queryKey: [`/api/sops/${params.id}`],
  });

  const { data: steps } = useQuery<Step[]>({
    queryKey: [`/api/sops/${params.id}/steps`],
  });

  const transcribe = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append("audio", audioBlob);
      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to transcribe");
      return res.json();
    },
  });

  const createStep = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/steps", {
        ...data,
        sopId: Number(params.id),
        order: (steps?.length || 0) + 1,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sops/${params.id}/steps`] });
      setCurrentStep(undefined);
    },
  });

  const handleStepRecorded = async (data: {
    screenshot: string;
    recordingBlob: Blob;
  }) => {
    setCurrentStep({ screenshot: data.screenshot });
    const { transcription, refinedContent } = await transcribe.mutateAsync(
      data.recordingBlob
    );
    setCurrentStep({
      screenshot: data.screenshot,
      transcription,
      refinedContent,
    });
  };

  if (!sop) return null;

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        className="mb-6 gap-2"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">{sop.title}</h1>
          <p className="text-muted-foreground">{sop.description}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Record New Step</h2>
            <Recorder onStepRecorded={handleStepRecorded} />
          </div>

          {currentStep && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Edit Step</h2>
              <DocumentEditor
                sopId={Number(params.id)}
                screenshot={currentStep.screenshot}
                transcription={currentStep.transcription || ""}
                refinedContent={currentStep.refinedContent || ""}
                onSave={createStep.mutate}
              />
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Steps</h2>
          <div className="space-y-4">
            {steps?.map((step) => (
              <div
                key={step.id}
                className="border rounded-lg p-4 space-y-4"
              >
                {step.screenshot && (
                  <img
                    src={step.screenshot}
                    alt={`Step ${step.order}`}
                    className="rounded-lg"
                  />
                )}
                <p>{step.instruction}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}