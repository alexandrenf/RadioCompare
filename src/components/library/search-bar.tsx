"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import type { Modality } from "@/types";

interface SearchBarProps {
  query: string;
  modality: Modality | "all";
  onQueryChange: (query: string) => void;
  onModalityChange: (modality: Modality | "all") => void;
}

export function SearchBar({
  query,
  modality,
  onQueryChange,
  onModalityChange,
}: SearchBarProps) {
  return (
    <div className="flex gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search studies..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="pl-9"
          aria-label="Search studies"
        />
      </div>
      <Select
        value={modality}
        onValueChange={(val) => val && onModalityChange(val as Modality | "all")}
      >
        <SelectTrigger className="w-[140px]" aria-label="Filter by modality">
          <SelectValue placeholder="Modality" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="CT">CT</SelectItem>
          <SelectItem value="MRI">MRI</SelectItem>
          <SelectItem value="X-Ray">X-Ray</SelectItem>
          <SelectItem value="Ultrasound">Ultrasound</SelectItem>
          <SelectItem value="Other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
