import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { insertSopSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";

export default function CreateSOP() {
  const [, navigate] = useLocation();
  
  const form = useForm({
    resolver: zodResolver(insertSopSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const createSop = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      const res = await apiRequest("POST", "/api/sops", data);
      return res.json();
    },
    onSuccess: (data) => {
      navigate(`/edit/${data.id}`);
    },
  });

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

      <Card>
        <CardHeader>
          <CardTitle>Create New SOP</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => createSop.mutate(data))}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <Input {...field} placeholder="Enter SOP title..." />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      {...field}
                      placeholder="Enter SOP description..."
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={createSop.isPending}
              >
                {createSop.isPending ? "Creating..." : "Create SOP"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
