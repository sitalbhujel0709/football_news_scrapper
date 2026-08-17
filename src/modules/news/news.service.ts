import { prisma } from '../../config/prisma';
import { Prisma } from '../../generated/prisma/client';

export interface GetNewsQuery {
  page?: number;
  limit?: number;
  title?: string;
  content?: string;
  tags?: string[] | string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'publishedAt';
  sortOrder?: 'asc' | 'desc';
}

async function getNews(query: GetNewsQuery) {
  const {
    page = 1,
    limit = 10,
    title,
    content,
    tags,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: Prisma.NewsWhereInput = {};

  if (title) {
    where.title = { contains: title, mode: 'insensitive' };
  }

  if (content) {
    where.content = { contains: content, mode: 'insensitive' };
  }

  if (tags) {
    const tagsArray = Array.isArray(tags) ? tags : [tags];
    if (tagsArray.length > 0) {
      where.tags = { hasSome: tagsArray };
    }
  }

  if (startDate || endDate) {
    where.publishedAt = {};
    if (startDate) {
      where.publishedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.publishedAt.lte = new Date(endDate);
    }
  }

  const [data, total] = await Promise.all([
    prisma.news.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.news.count({ where }),
  ]);

  const totalPages = Math.ceil(total / take);

  return {
    data,
    meta: {
      total,
      page: Number(page),
      limit: take,
      totalPages,
      hasNextPage: Number(page) < totalPages,
      hasPrevPage: Number(page) > 1,
    },
  };
}

export { getNews };