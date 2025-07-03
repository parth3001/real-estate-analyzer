/**
 * Census API Routes
 */

import express from 'express';
import { 
  getDemographicData,
  getIncomeData,
  getHousingData,
  getComprehensiveCensusData
} from '../controllers/censusController';

const router = express.Router();

/**
 * @route   GET /api/census/demographics
 * @desc    Get demographic data for a location
 * @access  Public
 * @params  state, county, zip, city, tract, year, dataset
 */
router.get('/demographics', getDemographicData);

/**
 * @route   GET /api/census/income
 * @desc    Get income data for a location
 * @access  Public
 * @params  state, county, zip, city, tract, year, dataset
 */
router.get('/income', getIncomeData);

/**
 * @route   GET /api/census/housing
 * @desc    Get housing data for a location
 * @access  Public
 * @params  state, county, zip, city, tract, year, dataset
 */
router.get('/housing', getHousingData);

/**
 * @route   GET /api/census/comprehensive
 * @desc    Get comprehensive census data for a location
 * @access  Public
 * @params  state, county, zip, city, tract, year, dataset
 */
router.get('/comprehensive', getComprehensiveCensusData);

export default router; 