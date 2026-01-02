import { Router, Request, Response } from 'express';
import { authorize } from '../middleware/auth';
import { CustomError } from '../errors/CustomError';
import { CreatePlantDTO, GetPlantsParams, plantService } from '../service/plant.service';
import { SunlightLevel } from '../generated/prisma/browser';

const router = Router();

// GET /plants
router.get('/', authorize(), async (req: Request, res: Response) => {
  try {
    const { sunlightLevel, name } = req.query as unknown as {
      sunlightLevel?: string;
      name?: string;
    };

    const plants = await plantService.findPlants({
      sunlightLevel: sunlightLevel,
      name: name,
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
  try {
    const plant: CreatePlantDTO = req.body;

    plantService.checkSunlightLevel(plant.sunlightLevel);
    const newPlant = await plantService.createPlant(plant);
    res.status(201).json(newPlant);
  } catch (error: unknown) {
    if (error instanceof CustomError) {
      return res.status(error.code).json({ message: error.message });
    } else {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// DELETE /plants/:id
router.delete('/:id', authorize(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const plantId = Number(req.params.id);

    if (Number.isNaN(plantId)) {
      return res.status(400).json({ message: 'Invalid plant id' });
    }
    const deletedPlant = await plantService.deletePlant(plantId);
    res.status(200).json(deletedPlant);
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
