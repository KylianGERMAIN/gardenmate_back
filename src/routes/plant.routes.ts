import { Router, Request, Response } from 'express';
import { authorize } from '../middleware/authHandler';
import { plantService } from '../service/plant.service';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  plantCreateSchema,
  plantDeleteSchema,
  PlantGetQuery,
  plantGetSchema,
} from '../schemas/plant';
import { validate } from '../middleware/validate';

const router = Router();

// GET /plants
router.get(
  '/',
  validate(plantGetSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const plants = await plantService.findPlants(req.query as PlantGetQuery);
    res.status(200).json(plants);
  }),
);

// POST /plants
router.post(
  '/',
  authorize(['ADMIN']),
  validate(plantCreateSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const newPlant = await plantService.createPlant(req.body);
    res.status(201).json(newPlant);
  }),
);

// DELETE /plants/:id
router.delete(
  '/:id',
  authorize(['ADMIN']),
  validate(plantDeleteSchema, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const deletedPlant = await plantService.deletePlant(Number(req.params.id));
    res.status(200).json(deletedPlant);
  }),
);

export default router;
