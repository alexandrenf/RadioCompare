"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDisplayDate } from "@/lib/format-date";
import type { Modality } from "@/types";

interface StudyCardProps {
  id: string;
  name: string;
  description: string;
  modality: Modality;
  tags: string[];
  thumbnailUrl: string | null;
  createdAt: number;
}

export function StudyCard({
  id,
  name,
  description,
  modality,
  tags,
  thumbnailUrl,
  createdAt,
}: StudyCardProps) {
  return (
    <Link href={`/study/${id}`}>
      <Card className="overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer group">
        <div className="aspect-video bg-muted relative overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No preview
            </div>
          )}
          <Badge className="absolute top-2 right-2" variant="secondary">
            {modality}
          </Badge>
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium truncate">{name}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-1 flex-wrap">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDisplayDate(createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
