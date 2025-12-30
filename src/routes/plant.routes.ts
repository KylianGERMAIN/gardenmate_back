import { Router, Request, Response } from 'express';
import { authorize } from '../middleware/auth';
import { CustomError } from '../errors/CustomError';
import { prisma } from '../prisma';
import { SunlightLevel } from '../generated/prisma/enums';

const router = Router();

// GET /plants
router.get('/', authorize(), async (req: Request, res: Response) => {
  const sunlightQuery = req.query.sunlightLevel as string;
  var plants = null;

  try {
    if (!['FULL_SUN', 'PARTIAL_SHADE', 'SHADE'].includes(sunlightQuery)) {
      return res.status(400).json({ message: 'Invalid sunlightLevel' });
    }
    plants = await prisma.plant.findMany({
      where: { sunlightLevel: sunlightQuery as SunlightLevel },
    });
  } catch (error: unknown) {
    if (error instanceof CustomError) {
      return res.status(error.code).json({ message: error.message });
    } else {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  res.status(200).json(plants);
});

export default router;
