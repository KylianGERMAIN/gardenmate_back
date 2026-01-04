import { Router, Response } from 'express';
import { authorize } from '../middleware/authHandler';
import { plantService } from '../service/plant.service';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  PlantCreateBody,
  plantCreateSchema,
  PlantDeleteParams,
  plantDeleteSchema,
  PlantGetQuery,
  plantGetSchema,
} from '../schemas/plant';
import { validate } from '../middleware/validate';
import { RequestWithBody, RequestWithParams, RequestWithQuery } from '../types/express';

const router = Router();

// GET /plants
router.get(
  '/',
  authorize(),
  validate(plantGetSchema, 'query'),
  asyncHandler(async (req: RequestWithQuery<PlantGetQuery>, res: Response) => {
    const plants = await plantService.findPlants(req.query);
    res.status(200).json(plants);
  }),
);

// POST /plants
router.post(
  '/',
  authorize(['ADMIN']),
  validate(plantCreateSchema, 'body'),
  asyncHandler(async (req: RequestWithBody<PlantCreateBody>, res: Response) => {
    const newPlant = await plantService.createPlant(req.body);
    res.status(201).json(newPlant);
  }),
);

// DELETE /plants/:id
router.delete(
  '/:id',
  authorize(['ADMIN']),
  validate(plantDeleteSchema, 'params'),
  asyncHandler(async (req: RequestWithParams<PlantDeleteParams>, res: Response) => {
    const deletedPlant = await plantService.deletePlant(req.params.id);
    res.status(200).json(deletedPlant);
  }),
);

export default router;
