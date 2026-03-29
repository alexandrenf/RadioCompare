import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
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
    annotations: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("studies", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("studies"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    modality: v.optional(
      v.union(
        v.literal("CT"),
        v.literal("MRI"),
        v.literal("X-Ray"),
        v.literal("Ultrasound"),
        v.literal("Other")
      )
    ),
    tags: v.optional(v.array(v.string())),
    annotations: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = { ...fields, updatedAt: Date.now() };
    // Remove undefined fields
    for (const key of Object.keys(updates)) {
      if (updates[key] === undefined) delete updates[key];
    }
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("studies") },
  handler: async (ctx, args) => {
    const study = await ctx.db.get(args.id);
    if (study) {
      await ctx.storage.delete(study.imageStorageId);
      await ctx.storage.delete(study.thumbnailStorageId);
      await ctx.db.delete(args.id);
    }
  },
});

export const getById = query({
  args: { id: v.id("studies") },
  handler: async (ctx, args) => {
    const study = await ctx.db.get(args.id);
    if (!study) return null;
    const imageUrl = await ctx.storage.getUrl(study.imageStorageId);
    const thumbnailUrl = await ctx.storage.getUrl(study.thumbnailStorageId);
    return { ...study, imageUrl, thumbnailUrl };
  },
});

export const list = query({
  args: {
    modality: v.optional(
      v.union(
        v.literal("CT"),
        v.literal("MRI"),
        v.literal("X-Ray"),
        v.literal("Ultrasound"),
        v.literal("Other")
      )
    ),
  },
  handler: async (ctx, args) => {
    let studies;
    if (args.modality) {
      studies = await ctx.db
        .query("studies")
        .withIndex("by_modality", (q) => q.eq("modality", args.modality!))
        .order("desc")
        .collect();
    } else {
      studies = await ctx.db
        .query("studies")
        .withIndex("by_created")
        .order("desc")
        .collect();
    }
    return Promise.all(
      studies.map(async (study) => ({
        ...study,
        imageUrl: await ctx.storage.getUrl(study.imageStorageId),
        thumbnailUrl: await ctx.storage.getUrl(study.thumbnailStorageId),
      }))
    );
  },
});

export const search = query({
  args: {
    query: v.string(),
    modality: v.optional(
      v.union(
        v.literal("CT"),
        v.literal("MRI"),
        v.literal("X-Ray"),
        v.literal("Ultrasound"),
        v.literal("Other")
      )
    ),
  },
  handler: async (ctx, args) => {
    let searchQuery = ctx.db
      .query("studies")
      .withSearchIndex("search_studies", (q) => {
        let sq = q.search("name", args.query);
        if (args.modality) {
          sq = sq.eq("modality", args.modality);
        }
        return sq;
      });
    const studies = await searchQuery.collect();
    return Promise.all(
      studies.map(async (study) => ({
        ...study,
        imageUrl: await ctx.storage.getUrl(study.imageStorageId),
        thumbnailUrl: await ctx.storage.getUrl(study.thumbnailStorageId),
      }))
    );
  },
});
