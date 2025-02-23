import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertStepSchema } from "@shared/schema";
import { Save, FileDown } from "lucide-react";

interface DocumentEditorProps {
  sopId: number;
  screenshot: string;
  transcription: string;
  refinedContent: string;
  onSave: (data: { instruction: string }) => void;
}

export function DocumentEditor({
  sopId,
  screenshot,
  transcription,
  refinedContent,
  onSave,
}: DocumentEditorProps) {
  const form = useForm({
    resolver: zodResolver(insertStepSchema),
    defaultValues: {
      sopId,
      order: 1,
      instruction: refinedContent || transcription,
      screenshot,
      transcription,
      refinedContent,
    },
  });

  useEffect(() => {
    form.reset({
      sopId,
      order: 1,
      instruction: refinedContent || transcription,
      screenshot,
      transcription,
      refinedContent,
    });
  }, [sopId, screenshot, transcription, refinedContent]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              {screenshot && (
                <img
                  src={screenshot}
                  alt="Step screenshot"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="instruction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions</FormLabel>
                  <Textarea
                    {...field}
                    className="min-h-[200px]"
                    placeholder="Edit the instructions for this step..."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="submit" className="gap-2">
                <Save className="w-4 h-4" />
                Save Step
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </Form>
  );
}
