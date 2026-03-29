import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    bodyRegion: v.string(),
    description: v.string(),
    imageStorageId: v.id("_storage"),
    thumbnailStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("normals", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("normals") },
  handler: async (ctx, args) => {
    const normal = await ctx.db.get(args.id);
    if (normal) {
      await ctx.storage.delete(normal.imageStorageId);
      await ctx.storage.delete(normal.thumbnailStorageId);
      await ctx.db.delete(args.id);
    }
  },
});

export const getById = query({
  args: { id: v.id("normals") },
  handler: async (ctx, args) => {
    const normal = await ctx.db.get(args.id);
    if (!normal) return null;
    const imageUrl = await ctx.storage.getUrl(normal.imageStorageId);
    const thumbnailUrl = await ctx.storage.getUrl(normal.thumbnailStorageId);
    return { ...normal, imageUrl, thumbnailUrl };
  },
});

export const list = query({
  args: {
    bodyRegion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let normals;
    if (args.bodyRegion) {
      normals = await ctx.db
        .query("normals")
        .withIndex("by_region", (q) => q.eq("bodyRegion", args.bodyRegion!))
        .order("desc")
        .collect();
    } else {
      normals = await ctx.db
        .query("normals")
        .withIndex("by_created")
        .order("desc")
        .collect();
    }
    return Promise.all(
      normals.map(async (normal) => ({
        ...normal,
        imageUrl: await ctx.storage.getUrl(normal.imageStorageId),
        thumbnailUrl: await ctx.storage.getUrl(normal.thumbnailStorageId),
      }))
    );
  },
});

export const search = query({
  args: {
    query: v.string(),
    bodyRegion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normals = await ctx.db
      .query("normals")
      .withSearchIndex("search_normals", (q) => {
        let sq = q.search("name", args.query);
        if (args.bodyRegion) {
          sq = sq.eq("bodyRegion", args.bodyRegion);
        }
        return sq;
      })
      .collect();
    return Promise.all(
      normals.map(async (normal) => ({
        ...normal,
        imageUrl: await ctx.storage.getUrl(normal.imageStorageId),
        thumbnailUrl: await ctx.storage.getUrl(normal.thumbnailStorageId),
      }))
    );
  },
});
