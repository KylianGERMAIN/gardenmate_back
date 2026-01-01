import { Router, Request, Response } from 'express';
import { authorize } from '../middleware/auth';
import { CustomError } from '../errors/CustomError';
import { PlantDTO, plantService } from '../service/plant.service';

const router = Router();

// GET /plants
router.get('/', authorize(), async (req: Request, res: Response) => {
  try {
    const plants = await plantService.getPlants({
      sunlightLevel: req.query.sunlightLevel as string,
      name: req.query.name as string,
    });
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

// POST /plants
router.post('/', authorize(['ADMIN']), async (req: Request, res: Response) => {
  const plant: PlantDTO = req.body;
  try {
    await plantService.createPlant(plant);
    res.status(200).json({ message: 'Plant created successfully' });
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
