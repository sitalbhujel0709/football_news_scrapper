import { Request, Response } from 'express';
import { getNews, GetNewsQuery } from './news.service';

export const getNewsController = async (req: Request, res: Response) => {
  try {
    const {
      page,
      limit,
      title,
      content,
      tags,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = req.query;

    const query: GetNewsQuery = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      title: title as string,
      content: content as string,
      tags: tags as string | string[],
      startDate: startDate as string,
      endDate: endDate as string,
      sortBy: sortBy as 'createdAt' | 'publishedAt',
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await getNews(query);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};