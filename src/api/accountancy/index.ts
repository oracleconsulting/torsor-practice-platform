import express from 'express';
import { Router } from 'express';
import { assessmentRouter } from './assessment';
import { coachRouter } from './coach';
import { rescuesRouter } from './rescues';
import { complaintsRouter } from './complaints';
import { learningRouter } from './learning';
import { overheadRouter } from './overhead';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all accountancy routes
router.use(authMiddleware);

// Mount feature routers
router.use('/assessment', assessmentRouter);
router.use('/coach', coachRouter);
router.use('/rescues', rescuesRouter);
router.use('/complaints', complaintsRouter);
router.use('/learning', learningRouter);
router.use('/overhead', overheadRouter);

export { router as accountancyRouter }; 