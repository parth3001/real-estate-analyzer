import { KeyMetrics } from './common';

export interface SFRMetrics extends KeyMetrics {
  pricePerSqFt: number;
  rentPerSqFt: number;
  grossRentMultiplier: number;
  afterRepairValueRatio?: number;
  rehabROI?: number;
}

export interface MultiFamilyMetrics extends KeyMetrics {
  pricePerUnit: number;
  pricePerSqFt: number;
  rentPerUnit: number;
  grossRentMultiplier: number;
  occupancyRate: number;
  averageUnitSize: number;
  totalUnits: number;
  noiPerUnit?: number;
  operatingExpensePerUnit?: number;
  commonAreaExpenseRatio?: number;
  unitMixEfficiency?: number;
  economicVacancyRate?: number;
  averageRentPerUnit?: number;
} 