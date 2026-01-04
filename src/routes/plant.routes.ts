import { Router, Request, Response } from 'express';
import { authorize } from '../middleware/authHandler';
import { CreatePlantDTO, plantService } from '../service/plant.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { CustomError } from '../errors/CustomError';

const router = Router();

// GET /plants
router.get(
  '/',
  authorize(),
  asyncHandler(async (req: Request, res: Response) => {
    const { sunlightLevel, name } = req.query as unknown as {
      sunlightLevel?: string;
      name?: string;
    };

    const plants = await plantService.findPlants({
      sunlightLevel: sunlightLevel,
      name: name,
    });

    res.status(200).json(plants);
  }),
);

// POST /plants
router.post(
  '/',
  authorize(['ADMIN']),
  asyncHandler(async (req: Request, res: Response) => {
    const plant: CreatePlantDTO = req.body;
    const newPlant = await plantService.createPlant(plant);
    res.status(201).json(newPlant);
  }),
);

// DELETE /plants/:id
router.delete(
  '/:id',
  authorize(['ADMIN']),
  asyncHandler(async (req: Request, res: Response) => {
    const plantId = Number(req.params.id);

    if (Number.isNaN(plantId)) {
      throw new CustomError('Invalid plant id', 400);
    }
    const deletedPlant = await plantService.deletePlant(plantId);
    res.status(200).json(deletedPlant);
  }),
);

export default router;
