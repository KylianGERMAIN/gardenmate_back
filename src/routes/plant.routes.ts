import { Router, Request, Response } from 'express';
import { authorize } from '../middleware/auth';
import { CustomError } from '../errors/CustomError';
import { prisma } from '../prisma';
import { SunlightLevel } from '../generated/prisma/enums';
import { plantService } from '../service/plant.service';

const router = Router();

// GET /plants
router.get('/', authorize(), async (req: Request, res: Response) => {
  try {
    const plants = await plantService.getPlants(req);
    res.status(200).json(plants);
  } catch (error: unknown) {
    if (error instanceof CustomError) {
      return res.status(error.code).json({ message: error.message });
    } else {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
});

export default router;
