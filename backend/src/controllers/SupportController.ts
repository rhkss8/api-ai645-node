import { Request, Response } from 'express';
import { FAQS } from '../data/faqs';

export class SupportController {
  getFaqs(req: Request, res: Response): void {
    const category =
      typeof req.query.category === 'string' ? req.query.category.trim().toUpperCase() : undefined;

    const items = category
      ? FAQS.filter((item) => item.category === category)
      : FAQS;

    res.status(200).json({
      success: true,
      data: {
        categories: [...new Set(FAQS.map((item) => item.category))],
        items,
      },
    });
  }
}
