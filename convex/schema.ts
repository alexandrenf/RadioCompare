import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  studies: defineTable({
    name: v.string(),
    description: v.string(),
    modality: v.union(
      v.literal("CT"),
      v.literal("MRI"),
      v.literal("X-Ray"),
      v.literal("Ultrasound"),
      v.literal("Other")
    ),
    tags: v.array(v.string()),
    imageStorageId: v.id("_storage"),
    thumbnailStorageId: v.id("_storage"),
    annotations: v.string(), // JSON-serialized annotations
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_modality", ["modality"])
    .index("by_created", ["createdAt"])
    .searchIndex("search_studies", {
      searchField: "name",
      filterFields: ["modality"],
    }),

  normals: defineTable({
    name: v.string(),
    bodyRegion: v.string(),
    description: v.string(),
    imageStorageId: v.id("_storage"),
    thumbnailStorageId: v.id("_storage"),
    createdAt: v.number(),
  })
    .index("by_region", ["bodyRegion"])
    .index("by_created", ["createdAt"])
    .searchIndex("search_normals", {
      searchField: "name",
      filterFields: ["bodyRegion"],
    }),
});
