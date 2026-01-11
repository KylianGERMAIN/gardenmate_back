import { Router, Response } from 'express';
import { authorize } from '../middleware/authHandler';
import { plantService } from '../service/plant.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { PlantCreateBody, PlantDeleteParams, PlantGetQuery, schemas } from '../schemas';
import { validate } from '../middleware/validate';
import { RequestWithBody, RequestWithParams, RequestWithQuery } from '../types/express';

const router = Router();

// GET /plants
router.get(
  '/',
  authorize(),
  validate(schemas.plant.plantGetSchema, 'query'),
  asyncHandler(async (req: RequestWithQuery<PlantGetQuery>, res: Response) => {
    const plants = await plantService.findPlants(req.query);
    res.status(200).json(plants);
  }),
);

// POST /plants
router.post(
  '/',
  authorize(['ADMIN']),
  validate(schemas.plant.plantCreateSchema, 'body'),
  asyncHandler(async (req: RequestWithBody<PlantCreateBody>, res: Response) => {
    const newPlant = await plantService.createPlant(req.body);
    res.status(201).json(newPlant);
  }),
);

// DELETE /plants/:uid
router.delete(
  '/:uid',
  authorize(['ADMIN']),
  validate(schemas.plant.plantDeleteSchema, 'params'),
  asyncHandler(async (req: RequestWithParams<PlantDeleteParams>, res: Response) => {
    const deletedPlant = await plantService.deletePlant(req.params.uid);
    res.status(200).json(deletedPlant);
  }),
);

export default router;
