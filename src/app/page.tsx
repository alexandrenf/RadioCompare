"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Library, ScanLine, Columns2, ArrowRight } from "lucide-react";
import { StudyCard } from "@/components/library/study-card";

export default function DashboardPage() {
  const studies = useQuery(api.studies.list, {});
  const normals = useQuery(api.normals.list, {});

  const recentStudies = studies?.slice(0, 4);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your radiology study companion
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-8">
        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/upload">
            <Card className="hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer h-full">
              <CardHeader className="pb-2">
                <Upload className="h-8 w-8 text-primary" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base">Upload & Annotate</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a new radiology image
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/library">
            <Card className="hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer h-full">
              <CardHeader className="pb-2">
                <Library className="h-8 w-8 text-primary" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base">My Library</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {studies?.length ?? 0} saved studies
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/normals">
            <Card className="hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer h-full">
              <CardHeader className="pb-2">
                <ScanLine className="h-8 w-8 text-primary" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base">Normal Scans</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {normals?.length ?? 0} reference scans
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/compare">
            <Card className="hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer h-full">
              <CardHeader className="pb-2">
                <Columns2 className="h-8 w-8 text-primary" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base">Compare</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Side-by-side comparison
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent studies */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Studies</h2>
            {studies && studies.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/library">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>

          {recentStudies && recentStudies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentStudies.map((study) => (
                <StudyCard
                  key={study._id}
                  id={study._id}
                  name={study.name}
                  description={study.description}
                  modality={study.modality}
                  tags={study.tags}
                  thumbnailUrl={study.thumbnailUrl}
                  createdAt={study.createdAt}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                No studies yet. Upload your first image to get started!
              </p>
              <Button asChild className="mt-4">
                <Link href="/upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Link>
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
