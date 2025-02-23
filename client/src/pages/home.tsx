import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Plus, FileText, Clock } from "lucide-react";
import type { Sop } from "@shared/schema";

export default function Home() {
  const { data: sops, isLoading } = useQuery<Sop[]>({
    queryKey: ["/api/sops"],
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">SOP Generator</h1>
        <Link href="/create">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create New SOP
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))
        ) : sops?.length === 0 ? (
          <Card className="col-span-full p-8">
            <CardContent className="text-center text-muted-foreground">
              No SOPs created yet. Click "Create New SOP" to get started.
            </CardContent>
          </Card>
        ) : (
          sops?.map((sop) => (
            <Link key={sop.id} href={`/edit/${sop.id}`}>
              <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {sop.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(sop.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
