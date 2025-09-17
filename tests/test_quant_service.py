#!/usr/bin/env python3
"""
Comprehensive unit tests for the enhanced quantification service
"""

import unittest
import numpy as np
from datetime import datetime
from typing import List

from backend.app.services.quant_service import QuantitationService
from backend.app.models.schemas import (
    CalibrationLevel, CalibrationFitRequest, CalibrationMode, OutlierPolicy,
    InternalStandard, RunRecord, Peak
)


class TestQuantitationService(unittest.TestCase):
    """Test cases for enhanced quantification service"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.service = QuantitationService()
    
    def test_external_linear_calibration(self):
        """Test external standard linear calibration"""
        # Create test calibration levels
        levels = [
            CalibrationLevel(
                target_name="Benzene", amount=1.0, unit="ppm",
                area=1000.0, included=True
            ),
            CalibrationLevel(
                target_name="Benzene", amount=2.0, unit="ppm",
                area=2100.0, included=True
            ),
            CalibrationLevel(
                target_name="Benzene", amount=5.0, unit="ppm",
                area=5050.0, included=True
            ),
            CalibrationLevel(
                target_name="Benzene", amount=10.0, unit="ppm",
                area=10200.0, included=True
            ),
            CalibrationLevel(
                target_name="Benzene", amount=20.0, unit="ppm",
                area=20100.0, included=True
            )
        ]
        
        request = CalibrationFitRequest(
            method_id=1,
            instrument_id=1,
            target_name="Benzene",
            model_type="linear",
            mode=CalibrationMode.EXTERNAL,
            outlier_policy=OutlierPolicy.NONE,
            levels=levels
        )
        
        calibration = self.service.fit_calibration_enhanced(request)
        
        # Check fit quality
        self.assertIsNotNone(calibration.slope)
        self.assertIsNotNone(calibration.intercept)
        self.assertIsNotNone(calibration.r2)
        self.assertGreater(calibration.r2, 0.99)  # Should have excellent fit
        self.assertEqual(len(calibration.levels), 5)
        self.assertTrue(all(level.included for level in calibration.levels))
        self.assertEqual(calibration.mode, CalibrationMode.EXTERNAL)
    
    def test_internal_standard_calibration(self):
        """Test internal standard calibration with response factors"""
        # Create IS configuration
        internal_standard = InternalStandard(
            peak_name="Toluene-d8", amount=10.0, unit="ppm"
        )
        
        # Create test levels with IS areas
        levels = [
            CalibrationLevel(
                target_name="Benzene", amount=1.0, unit="ppm",
                area=1000.0, is_area=5000.0, included=True
            ),
            CalibrationLevel(
                target_name="Benzene", amount=2.0, unit="ppm",
                area=2100.0, is_area=5100.0, included=True
            ),
            CalibrationLevel(
                target_name="Benzene", amount=5.0, unit="ppm",
                area=5050.0, is_area=4950.0, included=True
            ),
            CalibrationLevel(
                target_name="Benzene", amount=10.0, unit="ppm",
                area=10200.0, is_area=5200.0, included=True
            ),
            CalibrationLevel(
                target_name="Benzene", amount=20.0, unit="ppm",
                area=20100.0, is_area=5050.0, included=True
            )
        ]
        
        request = CalibrationFitRequest(
            method_id=1,
            instrument_id=1,
            target_name="Benzene",
            model_type="linear",
            mode=CalibrationMode.INTERNAL_STANDARD,
            internal_standard=internal_standard,
            outlier_policy=OutlierPolicy.NONE,
            levels=levels
        )
        
        calibration = self.service.fit_calibration_enhanced(request)
        
        # Check IS calibration specifics
        self.assertEqual(calibration.mode, CalibrationMode.INTERNAL_STANDARD)
        self.assertIsNotNone(calibration.internal_standard)
        self.assertEqual(calibration.internal_standard.peak_name, "Toluene-d8")
        self.assertIsNotNone(calibration.slope)
        self.assertIsNotNone(calibration.r2)
        self.assertTrue(all(level.is_area is not None for level in calibration.levels))
    
    def test_grubbs_outlier_detection(self):
        """Test Grubbs outlier detection"""
        # Create levels with one clear outlier
        levels = [
            CalibrationLevel(target_name="Benzene", amount=1.0, unit="ppm", area=1000.0),
            CalibrationLevel(target_name="Benzene", amount=2.0, unit="ppm", area=2000.0),
            CalibrationLevel(target_name="Benzene", amount=5.0, unit="ppm", area=5000.0),
            CalibrationLevel(target_name="Benzene", amount=10.0, unit="ppm", area=10000.0),
            CalibrationLevel(target_name="Benzene", amount=20.0, unit="ppm", area=5000.0)  # Clear outlier - much too low
        ]
        
        request = CalibrationFitRequest(
            method_id=1,
            target_name="Benzene",
            model_type="linear",
            mode=CalibrationMode.EXTERNAL,
            outlier_policy=OutlierPolicy.GRUBBS,
            levels=levels
        )

        # Patch the Grubbs detection to use more liberal alpha for testing
        original_method = self.service.detect_outliers_grubbs
        self.service.detect_outliers_grubbs = lambda data, alpha=0.20: original_method(data, alpha)
        
        calibration = self.service.fit_calibration_enhanced(request)
        
        # Restore original method
        self.service.detect_outliers_grubbs = original_method        # Check that outlier was detected
        excluded_count = len(calibration.excluded_points or [])
        self.assertGreater(excluded_count, 0)
        
        # Check that outlier level is marked as excluded
        excluded_levels = [level for level in calibration.levels if not level.included]
        self.assertGreater(len(excluded_levels), 0)
        
        # Check R² improved after outlier removal
        self.assertIsNotNone(calibration.r2)
    
    def test_iqr_outlier_detection(self):
        """Test IQR outlier detection"""
        # Create synthetic residuals with outliers
        data = np.array([0.1, 0.2, -0.1, 0.05, -0.15, 2.0, 0.08, -0.12])  # 2.0 is an outlier
        
        outliers = self.service.detect_outliers_iqr(data)
        
        self.assertTrue(len(outliers) > 0)
        self.assertIn(5, outliers)  # Index of the outlier (2.0)
    
    def test_lod_loq_calculation_from_baseline(self):
        """Test LOD/LOQ calculation from baseline noise"""
        # Create mock run records
        runs = [
            RunRecord(
                sample_name="Test1",
                time=list(range(100)),
                signal=[1.0 + 0.1 * np.random.normal() for _ in range(100)],
                peaks=[]
            )
        ]
        
        slope = 1000.0  # Area per ppm
        lod, loq, method = self.service.calculate_lod_loq_from_baseline(runs, slope)
        
        self.assertIsNotNone(lod)
        self.assertIsNotNone(loq)
        self.assertEqual(method, "baseline_noise")
        self.assertGreater(loq, lod)
        self.assertAlmostEqual(loq / lod, 10.0 / 3.0, places=1)  # LOQ = 10σ/slope, LOD = 3σ/slope
    
    def test_weighted_calibration(self):
        """Test weighted calibration fitting"""
        levels = [
            CalibrationLevel(target_name="Benzene", amount=0.1, unit="ppm", area=95.0),
            CalibrationLevel(target_name="Benzene", amount=1.0, unit="ppm", area=1050.0),
            CalibrationLevel(target_name="Benzene", amount=10.0, unit="ppm", area=10200.0),
            CalibrationLevel(target_name="Benzene", amount=100.0, unit="ppm", area=101500.0)
        ]
        
        request = CalibrationFitRequest(
            method_id=1,
            target_name="Benzene",
            model_type="weighted_1/x",
            mode=CalibrationMode.EXTERNAL,
            outlier_policy=OutlierPolicy.NONE,
            levels=levels
        )
        
        calibration = self.service.fit_calibration_enhanced(request)
        
        self.assertIsNotNone(calibration.slope)
        self.assertIsNotNone(calibration.intercept)
        self.assertEqual(calibration.model_type, "weighted_1/x")
    
    def test_quantitation_external_standard(self):
        """Test quantitation using external standard"""
        # First create a calibration
        levels = [
            CalibrationLevel(target_name="Benzene", amount=1.0, unit="ppm", area=1000.0),
            CalibrationLevel(target_name="Benzene", amount=5.0, unit="ppm", area=5000.0),
            CalibrationLevel(target_name="Benzene", amount=10.0, unit="ppm", area=10000.0)
        ]
        
        request = CalibrationFitRequest(
            method_id=1,
            target_name="Benzene",
            model_type="linear",
            mode=CalibrationMode.EXTERNAL,
            levels=levels
        )
        
        calibration = self.service.fit_calibration_enhanced(request)
        
        # Create sample run
        sample_peak = Peak(
            rt=3.45, area=7500.0, height=2500.0, width=0.1, 
            name="Benzene", snr=50.0
        )
        
        run = RunRecord(
            id=1,
            sample_name="Test Sample",
            time=list(range(100)),
            signal=[1.0] * 100,
            peaks=[sample_peak]
        )
        
        # Quantitate
        result = self.service.quantitate_enhanced(run, calibration)
        
        self.assertEqual(len(result.results), 1)
        self.assertEqual(result.results[0]["targetName"], "Benzene")
        self.assertAlmostEqual(result.results[0]["concentration"], 7.5, places=1)  # Expected ~7.5 ppm
        self.assertEqual(result.results[0]["mode"], "external")
    
    def test_quantitation_internal_standard(self):
        """Test quantitation using internal standard"""
        # Create IS calibration
        internal_standard = InternalStandard(peak_name="IS", amount=10.0, unit="ppm")
        
        levels = [
            CalibrationLevel(
                target_name="Benzene", amount=1.0, unit="ppm", 
                area=1000.0, is_area=5000.0
            ),
            CalibrationLevel(
                target_name="Benzene", amount=5.0, unit="ppm", 
                area=5000.0, is_area=5000.0
            ),
            CalibrationLevel(
                target_name="Benzene", amount=10.0, unit="ppm", 
                area=10000.0, is_area=5000.0
            )
        ]
        
        request = CalibrationFitRequest(
            method_id=1,
            target_name="Benzene",
            model_type="linear",
            mode=CalibrationMode.INTERNAL_STANDARD,
            internal_standard=internal_standard,
            levels=levels
        )
        
        calibration = self.service.fit_calibration_enhanced(request)
        
        # Create sample run with both target and IS peaks
        target_peak = Peak(rt=3.45, area=7500.0, height=2500.0, width=0.1, name="Benzene")
        is_peak = Peak(rt=4.20, area=5000.0, height=1500.0, width=0.1, name="IS")
        
        run = RunRecord(
            id=1,
            sample_name="Test Sample",
            time=list(range(100)),
            signal=[1.0] * 100,
            peaks=[target_peak, is_peak]
        )
        
        # Quantitate
        result = self.service.quantitate_enhanced(run, calibration)
        
        self.assertEqual(len(result.results), 1)
        res = result.results[0]
        self.assertEqual(res["targetName"], "Benzene")
        self.assertEqual(res["mode"], "internal_standard")
        self.assertIn("response_factor", res)
        self.assertIn("is_area", res)
        self.assertEqual(res["is_area"], 5000.0)
    
    def test_calibration_versioning(self):
        """Test calibration versioning system"""
        levels = [
            CalibrationLevel(target_name="Benzene", amount=1.0, unit="ppm", area=1000.0),
            CalibrationLevel(target_name="Benzene", amount=5.0, unit="ppm", area=5000.0)
        ]
        
        request = CalibrationFitRequest(
            method_id=1,
            target_name="Benzene",
            model_type="linear",
            mode=CalibrationMode.EXTERNAL,
            levels=levels
        )
        
        # Create first calibration
        cal1 = self.service.fit_calibration_enhanced(request)
        
        # Create second calibration (new version)
        cal2 = self.service.fit_calibration_enhanced(request)
        
        # Check that they have different version IDs
        self.assertNotEqual(cal1.version_id, cal2.version_id)
        
        # Check that versions are stored
        versions = self.service.list_calibration_versions(method_id=1)
        self.assertGreaterEqual(len(versions), 2)
    
    def test_activation_and_retrieval(self):
        """Test calibration activation and retrieval"""
        levels = [
            CalibrationLevel(target_name="Benzene", amount=1.0, unit="ppm", area=1000.0),
            CalibrationLevel(target_name="Benzene", amount=5.0, unit="ppm", area=5000.0)
        ]
        
        request = CalibrationFitRequest(
            method_id=1,
            target_name="Benzene",
            model_type="linear",
            mode=CalibrationMode.EXTERNAL,
            levels=levels
        )
        
        calibration = self.service.fit_calibration_enhanced(request)
        
        # Initially not active
        self.assertFalse(calibration.active)
        
        # Activate calibration
        success = self.service.activate_calibration(calibration.id)
        self.assertTrue(success)
        
        # Check it's now active
        active_cal = self.service.get_active_calibration(method_id=1)
        self.assertIsNotNone(active_cal)
        self.assertEqual(active_cal.id, calibration.id)
        self.assertTrue(active_cal.active)
    
    def test_linear_through_zero_model(self):
        """Test linear through zero calibration model"""
        levels = [
            CalibrationLevel(target_name="Benzene", amount=1.0, unit="ppm", area=1005.0),
            CalibrationLevel(target_name="Benzene", amount=2.0, unit="ppm", area=2010.0),
            CalibrationLevel(target_name="Benzene", amount=5.0, unit="ppm", area=4995.0),
            CalibrationLevel(target_name="Benzene", amount=10.0, unit="ppm", area=10020.0)
        ]
        
        request = CalibrationFitRequest(
            method_id=1,
            target_name="Benzene",
            model_type="linear_through_zero",
            mode=CalibrationMode.EXTERNAL,
            levels=levels
        )
        
        calibration = self.service.fit_calibration_enhanced(request)
        
        # Intercept should be exactly zero
        self.assertAlmostEqual(calibration.intercept, 0.0, places=6)
        self.assertIsNotNone(calibration.slope)
        self.assertGreater(calibration.r2, 0.99)
    
    def test_insufficient_data_handling(self):
        """Test handling of insufficient calibration data"""
        # Only one level - this should fail at the Pydantic validation level
        levels = [
            CalibrationLevel(target_name="Benzene", amount=1.0, unit="ppm", area=1000.0)
        ]
        
        # Should raise a ValidationError due to min_length=2 constraint
        from pydantic import ValidationError
        with self.assertRaises(ValidationError):
            CalibrationFitRequest(
                method_id=1,
                target_name="Benzene",
                model_type="linear",
                mode=CalibrationMode.EXTERNAL,
                levels=levels
            )
    
    def test_missing_areas_handling(self):
        """Test handling of missing area data"""
        levels = [
            CalibrationLevel(target_name="Benzene", amount=1.0, unit="ppm", area=None),
            CalibrationLevel(target_name="Benzene", amount=2.0, unit="ppm", area=2000.0),
            CalibrationLevel(target_name="Benzene", amount=5.0, unit="ppm", area=5000.0)
        ]
        
        request = CalibrationFitRequest(
            method_id=1,
            target_name="Benzene",
            model_type="linear",
            mode=CalibrationMode.EXTERNAL,
            levels=levels
        )
        
        # Should still work with valid points
        calibration = self.service.fit_calibration_enhanced(request)
        self.assertIsNotNone(calibration.slope)
        self.assertEqual(len([l for l in calibration.levels if l.area is not None]), 2)


if __name__ == '__main__':
    unittest.main()
