"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SearchBar } from "@/components/library/search-bar";
import { StudyCard } from "@/components/library/study-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Library } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Modality } from "@/types";

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [modality, setModality] = useState<Modality | "all">("all");

  const modalityFilter = modality === "all" ? undefined : modality;

  const studies = useQuery(
    query.trim()
      ? api.studies.search
      : api.studies.list,
    query.trim()
      ? { query: query.trim(), modality: modalityFilter }
      : { modality: modalityFilter }
  );

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">My Library</h1>
        <p className="text-sm text-muted-foreground">
          Browse and search your saved studies
        </p>
      </div>

      <div className="p-4 space-y-4 flex-1">
        <SearchBar
          query={query}
          modality={modality}
          onQueryChange={setQuery}
          onModalityChange={setModality}
        />

        {studies === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : studies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Library className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium">No studies yet</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upload your first radiology image to get started
            </p>
            <Button asChild className="mt-4">
              <Link href="/upload">Upload Image</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {studies.map((study) => (
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
        )}
      </div>
    </div>
  );
}
