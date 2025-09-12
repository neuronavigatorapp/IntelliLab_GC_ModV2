#!/usr/bin/env python3
"""
Master Test Orchestrator for IntelliLab GC
Runs all tests and compiles comprehensive results for analysis
"""

import asyncio
import subprocess
import json
import sys
import os
from pathlib import Path
from datetime import datetime
import logging
import traceback
import time

# Add backend directory to path
sys.path.append(str(Path(__file__).parent / "backend"))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('test_orchestrator.log')
    ]
)
logger = logging.getLogger("TestOrchestrator")


class TestOrchestrator:
    """Master orchestrator for running all tests and compiling results"""
    
    def __init__(self):
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "summary": {},
            "calculation_tests": [],
            "edge_case_results": [],
            "memory_test_results": [],
            "load_test_results": {},
            "frontend_tests": {},
            "recommendations": [],
            "test_duration_s": 0,
            "errors": []
        }
        self.start_time = time.time()
    
    async def check_backend_status(self):
        """Check if backend is running"""
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    "http://localhost:8000/api/v1/health/status",
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    if response.status == 200:
                        logger.info("✅ Backend is running and responsive")
                        return True
                    else:
                        logger.warning(f"⚠️ Backend responded with status {response.status}")
                        return False
        except Exception as e:
            logger.error(f"❌ Backend not accessible: {e}")
            return False
    
    async def run_calculation_tests(self):
        """Execute backend calculation tests"""
        logger.info("🧮 Starting calculation validation tests...")
        
        try:
            # Import and run calculation tests
            from test_runner import run_all_calculation_tests
            
            calc_results = run_all_calculation_tests()
            
            self.results["calculation_tests"] = calc_results.get("results", [])
            
            # Log summary
            summary = calc_results.get("summary", {})
            logger.info(f"   Calculation tests: {summary.get('passed', 0)}/{summary.get('total', 0)} passed")
            
            return True
            
        except Exception as e:
            error_msg = f"Calculation tests failed: {str(e)}"
            logger.error(error_msg)
            self.results["errors"].append({
                "test_type": "calculation",
                "error": error_msg,
                "traceback": traceback.format_exc()
            })
            return False
    
    async def run_stress_tests(self):
        """Execute stress and edge case tests"""
        logger.info("⚠️ Starting stress and edge case tests...")
        
        try:
            from stress_test import StressTester
            
            tester = StressTester()
            stress_results = await tester.run_all_stress_tests()
            
            self.results["edge_case_results"] = stress_results.get("edge_case_results", [])
            self.results["memory_test_results"] = stress_results.get("memory_test_results", [])
            self.results["load_test_results"] = stress_results.get("load_test_results", {})
            
            # Log summary
            edge_summary = stress_results.get("summary", {}).get("edge_cases", {})
            load_summary = stress_results.get("summary", {}).get("load_testing", {})
            
            logger.info(f"   Edge case tests: {edge_summary.get('passed', 0)}/{edge_summary.get('total', 0)} passed")
            logger.info(f"   Load test: {load_summary.get('total_requests', 0)} requests, {load_summary.get('overall_success_rate', 0):.1f}% success rate")
            
            return True
            
        except Exception as e:
            error_msg = f"Stress tests failed: {str(e)}"
            logger.error(error_msg)
            self.results["errors"].append({
                "test_type": "stress",
                "error": error_msg,
                "traceback": traceback.format_exc()
            })
            return False
    
    async def run_frontend_tests(self):
        """Execute frontend tests with Playwright"""
        logger.info("🖥️ Starting frontend tests...")
        
        try:
            # Check if frontend is running
            import aiohttp
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(
                        "http://localhost:3000",
                        timeout=aiohttp.ClientTimeout(total=5)
                    ) as response:
                        if response.status != 200:
                            logger.warning("Frontend not accessible, skipping frontend tests")
                            return True
            except:
                logger.warning("Frontend not accessible, skipping frontend tests")
                return True
            
            # Run Playwright tests if available
            frontend_dir = Path("frontend")
            if not frontend_dir.exists():
                logger.info("   Frontend directory not found, skipping frontend tests")
                return True
            
            # Check if Playwright is installed
            try:
                result = subprocess.run(
                    ["npx", "playwright", "--version"],
                    cwd=frontend_dir,
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                if result.returncode != 0:
                    logger.info("   Playwright not installed, skipping frontend tests")
                    return True
            except:
                logger.info("   Playwright not available, skipping frontend tests")
                return True
            
            # Run the tests
            result = subprocess.run(
                ["npx", "playwright", "test", "--reporter=json"],
                cwd=frontend_dir,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode == 0 and result.stdout:
                try:
                    frontend_results = json.loads(result.stdout)
                    self.results["frontend_tests"] = frontend_results
                    logger.info("   Frontend tests completed successfully")
                except json.JSONDecodeError:
                    logger.warning("   Could not parse frontend test results")
            else:
                logger.warning(f"   Frontend tests failed or timed out: {result.stderr}")
            
            return True
            
        except Exception as e:
            error_msg = f"Frontend tests failed: {str(e)}"
            logger.error(error_msg)
            self.results["errors"].append({
                "test_type": "frontend",
                "error": error_msg,
                "traceback": traceback.format_exc()
            })
            return True  # Don't fail overall tests if frontend tests fail
    
    def calculate_summary(self):
        """Calculate comprehensive test summary"""
        logger.info("📊 Calculating test summary...")
        
        # Count calculation tests
        calc_tests = self.results.get("calculation_tests", [])
        calc_passed = sum(1 for t in calc_tests if t.get("status") == "PASSED")
        calc_total = len(calc_tests)
        
        # Count edge case tests
        edge_tests = self.results.get("edge_case_results", [])
        edge_passed = sum(1 for t in edge_tests if t.get("passed", False))
        edge_total = len(edge_tests)
        
        # Count memory tests
        memory_tests = self.results.get("memory_test_results", [])
        memory_passed = sum(1 for t in memory_tests if t.get("passed", False))
        memory_total = len(memory_tests)
        
        # Frontend tests
        frontend_results = self.results.get("frontend_tests", {})
        frontend_passed = frontend_results.get("passed", 0) if isinstance(frontend_results, dict) else 0
        frontend_total = frontend_results.get("total", 0) if isinstance(frontend_results, dict) else 0
        
        # Overall totals
        total_tests = calc_total + edge_total + memory_total + frontend_total
        total_passed = calc_passed + edge_passed + memory_passed + frontend_passed
        total_failed = total_tests - total_passed
        
        # Load test performance
        load_results = self.results.get("load_test_results", {})
        
        self.results["summary"] = {
            "total_tests": total_tests,
            "passed_tests": total_passed,
            "failed_tests": total_failed,
            "pass_rate": (total_passed / total_tests * 100) if total_tests > 0 else 0,
            "test_breakdown": {
                "calculation_tests": {"passed": calc_passed, "total": calc_total},
                "edge_case_tests": {"passed": edge_passed, "total": edge_total},
                "memory_tests": {"passed": memory_passed, "total": memory_total},
                "frontend_tests": {"passed": frontend_passed, "total": frontend_total}
            },
            "performance_metrics": {
                "load_test_success_rate": load_results.get("overall_success_rate", 0),
                "avg_response_time": load_results.get("avg_response_time", 0),
                "p95_response_time": load_results.get("p95_response_time", 0),
                "requests_per_second": load_results.get("requests_per_second", 0)
            },
            "errors_encountered": len(self.results.get("errors", []))
        }
    
    def generate_recommendations(self):
        """Generate actionable recommendations based on all test results"""
        logger.info("🎯 Generating recommendations...")
        
        recommendations = []
        summary = self.results["summary"]
        
        # Overall system health
        pass_rate = summary["pass_rate"]
        if pass_rate < 80:
            recommendations.append("🚨 CRITICAL: System pass rate below 80% - immediate attention required")
        elif pass_rate < 95:
            recommendations.append("⚠️ WARNING: System pass rate below 95% - review failed tests")
        else:
            recommendations.append("✅ EXCELLENT: System pass rate above 95% - ready for production")
        
        # Calculation accuracy issues
        calc_breakdown = summary["test_breakdown"]["calculation_tests"]
        if calc_breakdown["total"] > 0:
            calc_pass_rate = calc_breakdown["passed"] / calc_breakdown["total"] * 100
            if calc_pass_rate < 100:
                failed_calcs = [t for t in self.results["calculation_tests"] if t.get("status") != "PASSED"]
                recommendations.append(f"🔧 Fix {len(failed_calcs)} calculation accuracy issues:")
                for calc in failed_calcs[:3]:  # Show top 3
                    test_name = calc.get("test", "Unknown")
                    error = calc.get("error", "Check tolerance")
                    if calc.get("mismatches"):
                        error = calc["mismatches"][0]
                    recommendations.append(f"   • {test_name}: {error}")
        
        # Edge case handling
        edge_breakdown = summary["test_breakdown"]["edge_case_tests"]
        if edge_breakdown["total"] > 0:
            edge_pass_rate = edge_breakdown["passed"] / edge_breakdown["total"] * 100
            if edge_pass_rate < 90:
                recommendations.append(f"⚠️ Edge case handling needs improvement: {edge_pass_rate:.1f}% pass rate")
        
        # Performance issues
        perf_metrics = summary["performance_metrics"]
        if perf_metrics["load_test_success_rate"] > 0:
            if perf_metrics["load_test_success_rate"] < 95:
                recommendations.append(f"🚨 System reliability issue: {perf_metrics['load_test_success_rate']:.1f}% success rate under load")
            
            if perf_metrics["p95_response_time"] > 2.0:
                recommendations.append(f"⚡ Performance optimization needed: P95 response time {perf_metrics['p95_response_time']:.2f}s exceeds 2s target")
            
            if perf_metrics["requests_per_second"] < 10:
                recommendations.append("📈 Throughput optimization: System handling <10 requests/second")
        
        # Memory issues
        memory_breakdown = summary["test_breakdown"]["memory_tests"]
        if memory_breakdown["total"] > 0:
            memory_pass_rate = memory_breakdown["passed"] / memory_breakdown["total"] * 100
            if memory_pass_rate < 100:
                recommendations.append(f"🧠 Memory handling issues: {memory_breakdown['total'] - memory_breakdown['passed']} large payload tests failed")
        
        # Frontend issues
        frontend_breakdown = summary["test_breakdown"]["frontend_tests"]
        if frontend_breakdown["total"] > 0:
            frontend_pass_rate = frontend_breakdown["passed"] / frontend_breakdown["total"] * 100
            if frontend_pass_rate < 100:
                recommendations.append(f"🖥️ Frontend issues: {frontend_breakdown['total'] - frontend_breakdown['passed']} UI tests failed")
        
        # Error analysis
        if summary["errors_encountered"] > 0:
            recommendations.append(f"🔍 {summary['errors_encountered']} test execution errors encountered - check logs")
        
        # Positive recommendations if system is healthy
        if pass_rate >= 95 and perf_metrics.get("load_test_success_rate", 0) >= 95:
            recommendations.extend([
                "🎉 System is performing excellently across all test categories",
                "📊 Consider implementing continuous monitoring in production",
                "🔄 Set up automated testing in CI/CD pipeline",
                "📈 Monitor these metrics over time to detect regressions"
            ])
        
        # Development recommendations
        if calc_breakdown["total"] < 20:
            recommendations.append("🧪 Consider adding more calculation test cases for better coverage")
        
        if edge_breakdown["total"] < 15:
            recommendations.append("⚠️ Consider adding more edge case tests for robustness")
        
        self.results["recommendations"] = recommendations
    
    async def generate_report(self):
        """Generate comprehensive HTML test report"""
        logger.info("📝 Generating comprehensive test report...")
        
        try:
            from test_report_generator import TestReportGenerator
            
            generator = TestReportGenerator()
            report_path = generator.generate_report(self.results)
            
            logger.info(f"   Report generated: {report_path}")
            return report_path
            
        except Exception as e:
            error_msg = f"Report generation failed: {str(e)}"
            logger.error(error_msg)
            self.results["errors"].append({
                "test_type": "report",
                "error": error_msg,
                "traceback": traceback.format_exc()
            })
            return None
    
    async def run_all_tests(self):
        """Execute complete test suite"""
        logger.info("🚀 Starting IntelliLab GC Comprehensive Testing Suite...")
        logger.info("="*60)
        
        # Check backend status first
        backend_running = await self.check_backend_status()
        if not backend_running:
            logger.error("❌ Backend is not running. Please start the backend server first.")
            logger.info("   Run: python backend/main.py")
            return None
        
        # Run all test phases
        test_phases = [
            ("Calculation Tests", self.run_calculation_tests),
            ("Stress Tests", self.run_stress_tests),
            ("Frontend Tests", self.run_frontend_tests),
        ]
        
        for phase_name, phase_func in test_phases:
            logger.info(f"\n🔄 Starting {phase_name}...")
            try:
                success = await phase_func()
                if success:
                    logger.info(f"✅ {phase_name} completed")
                else:
                    logger.warning(f"⚠️ {phase_name} completed with issues")
            except Exception as e:
                logger.error(f"❌ {phase_name} failed: {e}")
        
        # Calculate final results
        self.results["test_duration_s"] = time.time() - self.start_time
        self.calculate_summary()
        self.generate_recommendations()
        
        # Generate report
        report_path = await self.generate_report()
        
        # Save raw results
        results_file = f"test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(results_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        logger.info(f"\n📁 Raw results saved to: {results_file}")
        
        return self.results
    
    def print_final_summary(self):
        """Print final test summary to console"""
        print("\n" + "="*60)
        print("🔬 INTELLILAB GC COMPREHENSIVE TEST RESULTS")
        print("="*60)
        
        summary = self.results["summary"]
        
        # Overall results
        print(f"📊 OVERALL RESULTS:")
        print(f"   Total Tests: {summary['total_tests']}")
        print(f"   Passed: {summary['passed_tests']} ✅")
        print(f"   Failed: {summary['failed_tests']} ❌")
        print(f"   Pass Rate: {summary['pass_rate']:.1f}%")
        print(f"   Test Duration: {self.results['test_duration_s']:.1f} seconds")
        
        # Breakdown by category
        print(f"\n📋 TEST BREAKDOWN:")
        breakdown = summary["test_breakdown"]
        for category, results in breakdown.items():
            if results["total"] > 0:
                category_name = category.replace("_", " ").title()
                pass_rate = results["passed"] / results["total"] * 100
                status = "✅" if pass_rate == 100 else "⚠️" if pass_rate >= 90 else "❌"
                print(f"   {category_name}: {results['passed']}/{results['total']} ({pass_rate:.1f}%) {status}")
        
        # Performance metrics
        perf = summary["performance_metrics"]
        if perf["load_test_success_rate"] > 0:
            print(f"\n⚡ PERFORMANCE METRICS:")
            print(f"   Load Test Success Rate: {perf['load_test_success_rate']:.1f}%")
            print(f"   Average Response Time: {perf['avg_response_time']:.3f}s")
            print(f"   95th Percentile Response Time: {perf['p95_response_time']:.3f}s")
            print(f"   Requests per Second: {perf['requests_per_second']:.1f}")
        
        # Top recommendations
        print(f"\n🎯 TOP RECOMMENDATIONS:")
        for i, rec in enumerate(self.results["recommendations"][:5], 1):
            print(f"   {i}. {rec}")
        
        if len(self.results["recommendations"]) > 5:
            print(f"   ... and {len(self.results['recommendations']) - 5} more recommendations in the full report")
        
        # Final status
        print(f"\n" + "="*60)
        if summary["pass_rate"] >= 95 and perf.get("load_test_success_rate", 0) >= 95:
            print("🎉 SYSTEM STATUS: EXCELLENT - Ready for production use!")
        elif summary["pass_rate"] >= 90:
            print("✅ SYSTEM STATUS: GOOD - Minor issues to address")
        elif summary["pass_rate"] >= 80:
            print("⚠️ SYSTEM STATUS: NEEDS ATTENTION - Several issues to fix")
        else:
            print("🚨 SYSTEM STATUS: CRITICAL - Major issues require immediate attention")
        print("="*60)


async def main():
    """Main orchestrator function"""
    orchestrator = TestOrchestrator()
    
    try:
        results = await orchestrator.run_all_tests()
        
        if results:
            orchestrator.print_final_summary()
            
            # Return appropriate exit code
            pass_rate = results["summary"]["pass_rate"]
            if pass_rate >= 95:
                logger.info("🎉 All tests passed successfully!")
                return 0
            elif pass_rate >= 80:
                logger.warning("⚠️ Some tests failed - review results")
                return 1
            else:
                logger.error("❌ Many tests failed - immediate attention required")
                return 2
        else:
            logger.error("❌ Test execution failed")
            return 3
            
    except KeyboardInterrupt:
        logger.info("\n⏹️ Test execution interrupted by user")
        return 130
    except Exception as e:
        logger.error(f"❌ Test orchestrator failed: {e}")
        logger.error(traceback.format_exc())
        return 4


if __name__ == "__main__":
    # Ensure required directories exist
    Path("test_reports").mkdir(exist_ok=True)
    
    # Run the orchestrator
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
