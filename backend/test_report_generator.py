#!/usr/bin/env python3
"""
Test Report Generator for IntelliLab GC
Creates comprehensive HTML reports with visualizations
"""

from datetime import datetime
import json
from typing import Dict, List, Any
import pandas as pd
from pathlib import Path
import base64
import io
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from jinja2 import Template


class TestReportGenerator:
    """Generate comprehensive HTML test reports with charts and analysis"""
    
    def __init__(self):
        self.report_dir = Path("test_reports")
        self.report_dir.mkdir(exist_ok=True)
        
        # Set up plotting style
        plt.style.use('default')
        sns.set_palette("husl")
        
    def generate_performance_charts(self, performance_data: Dict) -> Dict[str, str]:
        """Generate performance charts as base64 encoded images"""
        charts = {}
        
        # Response time distribution chart
        if 'endpoint_breakdown' in performance_data:
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
            
            # Response time by endpoint
            endpoints = []
            avg_times = []
            p95_times = []
            
            for endpoint, stats in performance_data['endpoint_breakdown'].items():
                endpoints.append(endpoint.split('/')[-1])  # Just the endpoint name
                avg_times.append(stats['avg_response_time'])
                p95_times.append(stats['p95_response_time'])
            
            x = np.arange(len(endpoints))
            width = 0.35
            
            ax1.bar(x - width/2, avg_times, width, label='Average', alpha=0.8)
            ax1.bar(x + width/2, p95_times, width, label='95th Percentile', alpha=0.8)
            ax1.set_xlabel('Endpoint')
            ax1.set_ylabel('Response Time (seconds)')
            ax1.set_title('Response Time by Endpoint')
            ax1.set_xticks(x)
            ax1.set_xticklabels(endpoints, rotation=45, ha='right')
            ax1.legend()
            ax1.grid(True, alpha=0.3)
            
            # Success rate by endpoint
            success_rates = [stats['success_rate'] for stats in performance_data['endpoint_breakdown'].values()]
            colors = ['green' if rate >= 95 else 'orange' if rate >= 90 else 'red' for rate in success_rates]
            
            bars = ax2.bar(endpoints, success_rates, color=colors, alpha=0.7)
            ax2.set_xlabel('Endpoint')
            ax2.set_ylabel('Success Rate (%)')
            ax2.set_title('Success Rate by Endpoint')
            ax2.set_xticklabels(endpoints, rotation=45, ha='right')
            ax2.grid(True, alpha=0.3)
            ax2.set_ylim(0, 100)
            
            # Add value labels on bars
            for bar, rate in zip(bars, success_rates):
                height = bar.get_height()
                ax2.text(bar.get_x() + bar.get_width()/2., height + 1,
                        f'{rate:.1f}%', ha='center', va='bottom')
            
            plt.tight_layout()
            
            # Save to base64
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
            buffer.seek(0)
            charts['performance_overview'] = base64.b64encode(buffer.read()).decode()
            plt.close()
        
        return charts
    
    def generate_test_results_chart(self, test_results: List[Dict]) -> str:
        """Generate test results summary chart"""
        if not test_results:
            return ""
        
        # Count test results by status
        status_counts = {}
        for result in test_results:
            status = result.get('status', 'UNKNOWN')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Create pie chart
        fig, ax = plt.subplots(figsize=(8, 6))
        
        labels = list(status_counts.keys())
        sizes = list(status_counts.values())
        colors = {'PASSED': 'green', 'FAILED': 'red', 'ERROR': 'orange', 'UNKNOWN': 'gray'}
        chart_colors = [colors.get(label, 'gray') for label in labels]
        
        wedges, texts, autotexts = ax.pie(sizes, labels=labels, colors=chart_colors, 
                                         autopct='%1.1f%%', startangle=90)
        ax.set_title('Test Results Distribution', fontsize=14, fontweight='bold')
        
        # Enhance text
        for autotext in autotexts:
            autotext.set_color('white')
            autotext.set_fontweight('bold')
        
        plt.tight_layout()
        
        # Save to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
        buffer.seek(0)
        chart_data = base64.b64encode(buffer.read()).decode()
        plt.close()
        
        return chart_data
    
    def generate_edge_case_analysis(self, edge_case_results: List[Dict]) -> Dict[str, Any]:
        """Analyze edge case test results"""
        if not edge_case_results:
            return {}
        
        analysis = {
            'total_tests': len(edge_case_results),
            'passed': sum(1 for r in edge_case_results if r.get('passed', False)),
            'failed': sum(1 for r in edge_case_results if not r.get('passed', False)),
            'by_endpoint': {},
            'response_time_stats': {},
            'critical_failures': []
        }
        
        # Group by endpoint
        for result in edge_case_results:
            endpoint = result.get('endpoint', 'unknown')
            if endpoint not in analysis['by_endpoint']:
                analysis['by_endpoint'][endpoint] = {'total': 0, 'passed': 0}
            
            analysis['by_endpoint'][endpoint]['total'] += 1
            if result.get('passed', False):
                analysis['by_endpoint'][endpoint]['passed'] += 1
        
        # Calculate pass rates
        for endpoint_data in analysis['by_endpoint'].values():
            endpoint_data['pass_rate'] = (endpoint_data['passed'] / endpoint_data['total'] * 100) if endpoint_data['total'] > 0 else 0
        
        # Response time analysis
        response_times = [r.get('response_time_s', 0) for r in edge_case_results if 'response_time_s' in r]
        if response_times:
            analysis['response_time_stats'] = {
                'avg': np.mean(response_times),
                'median': np.median(response_times),
                'p95': np.percentile(response_times, 95),
                'max': np.max(response_times),
                'min': np.min(response_times)
            }
        
        # Identify critical failures
        for result in edge_case_results:
            if not result.get('passed', False) and result.get('expected_success', True):
                analysis['critical_failures'].append({
                    'test': result.get('test', 'Unknown'),
                    'endpoint': result.get('endpoint', 'Unknown'),
                    'error': result.get('error', result.get('response_preview', 'Unknown error'))
                })
        
        return analysis
    
    def generate_recommendations(self, test_data: Dict) -> List[str]:
        """Generate actionable recommendations based on test results"""
        recommendations = []
        
        # Analyze calculation test results
        calc_results = test_data.get('calculation_tests', [])
        failed_calcs = [t for t in calc_results if t.get('status') != 'PASSED']
        
        if failed_calcs:
            recommendations.append(f"🔧 Fix {len(failed_calcs)} calculation accuracy issues:")
            for calc in failed_calcs[:3]:  # Show top 3
                test_name = calc.get('test', 'Unknown')
                error = calc.get('error', calc.get('mismatches', ['Unknown error'])[0] if calc.get('mismatches') else 'Check tolerance')
                recommendations.append(f"   • {test_name}: {error}")
            if len(failed_calcs) > 3:
                recommendations.append(f"   • ... and {len(failed_calcs) - 3} more calculation issues")
        
        # Analyze edge case results
        edge_results = test_data.get('edge_case_results', [])
        failed_edge = [t for t in edge_results if not t.get('passed', False)]
        
        if failed_edge:
            recommendations.append(f"⚠️ Improve input validation for {len(failed_edge)} edge cases:")
            critical_failures = [f for f in failed_edge if f.get('expected_success', True)]
            if critical_failures:
                recommendations.append(f"   • {len(critical_failures)} critical failures that should have succeeded")
            
            validation_failures = [f for f in failed_edge if not f.get('expected_success', True)]
            if validation_failures:
                recommendations.append(f"   • {len(validation_failures)} validation errors (expected)")
        
        # Analyze performance
        perf_data = test_data.get('load_test_results', {})
        if perf_data:
            success_rate = perf_data.get('overall_success_rate', 100)
            p95_time = perf_data.get('p95_response_time', 0)
            
            if success_rate < 95:
                recommendations.append(f"🚨 System reliability issue: {success_rate:.1f}% success rate under load (target: >95%)")
            
            if p95_time > 2.0:
                recommendations.append(f"⚡ Performance optimization needed: P95 response time {p95_time:.2f}s exceeds 2s target")
            
            if perf_data.get('requests_per_second', 0) < 10:
                recommendations.append("📈 Throughput optimization: System handling <10 requests/second")
        
        # Memory usage analysis
        memory_results = test_data.get('memory_test_results', [])
        failed_memory = [t for t in memory_results if not t.get('passed', False)]
        if failed_memory:
            recommendations.append(f"🧠 Memory handling issues: {len(failed_memory)} large payload tests failed")
        
        # Frontend test analysis
        frontend_results = test_data.get('frontend_tests', {})
        if frontend_results and frontend_results.get('failed', 0) > 0:
            recommendations.append(f"🖥️ Frontend issues: {frontend_results['failed']} UI tests failed")
        
        # Security recommendations
        if any('unicode' in str(r).lower() or 'special' in str(r).lower() for r in edge_results):
            recommendations.append("🔒 Review input sanitization for Unicode and special characters")
        
        # If no issues found
        if not recommendations:
            recommendations.extend([
                "🎉 All tests passing - system ready for production use!",
                "✅ Consider adding more edge cases as the system evolves",
                "📊 Monitor these metrics in production for early issue detection"
            ])
        
        return recommendations
    
    def generate_report(self, test_data: Dict) -> str:
        """Generate comprehensive HTML test report"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = self.report_dir / f"test_report_{timestamp}.html"
        
        # Generate charts
        performance_charts = {}
        test_results_chart = ""
        
        if 'load_test_results' in test_data:
            performance_charts = self.generate_performance_charts(test_data['load_test_results'])
        
        if 'calculation_tests' in test_data:
            test_results_chart = self.generate_test_results_chart(test_data['calculation_tests'])
        
        # Analyze edge cases
        edge_analysis = {}
        if 'edge_case_results' in test_data:
            edge_analysis = self.generate_edge_case_analysis(test_data['edge_case_results'])
        
        # Generate recommendations
        recommendations = self.generate_recommendations(test_data)
        
        # Calculate overall summary
        calc_results = test_data.get('calculation_tests', [])
        edge_results = test_data.get('edge_case_results', [])
        memory_results = test_data.get('memory_test_results', [])
        
        total_tests = len(calc_results) + len(edge_results) + len(memory_results)
        passed_tests = (
            sum(1 for t in calc_results if t.get('status') == 'PASSED') +
            sum(1 for t in edge_results if t.get('passed', False)) +
            sum(1 for t in memory_results if t.get('passed', False))
        )
        
        summary = {
            'total': total_tests,
            'passed': passed_tests,
            'failed': total_tests - passed_tests,
            'pass_rate': (passed_tests / total_tests * 100) if total_tests > 0 else 0,
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # HTML template
        html_template = Template("""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IntelliLab GC Test Report - {{ summary.timestamp }}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            line-height: 1.6;
        }
        .header {
            background: linear-gradient(135deg, #1976d2, #42a5f5);
            color: white;
            padding: 30px 20px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
            margin-top: 10px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .summary {
            background: white;
            padding: 30px;
            margin: 20px 0;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        .metric {
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            background: #f8f9fa;
        }
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .metric-label {
            color: #666;
            text-transform: uppercase;
            font-size: 0.9em;
            letter-spacing: 1px;
        }
        .passed { color: #4caf50; }
        .failed { color: #f44336; }
        .warning { color: #ff9800; }
        
        .section {
            background: white;
            margin: 20px 0;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .section-header {
            background: #f8f9fa;
            padding: 20px 30px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 1.3em;
            font-weight: 600;
            color: #333;
        }
        .section-content {
            padding: 30px;
        }
        
        .chart-container {
            text-align: center;
            margin: 20px 0;
        }
        .chart-container img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #333;
        }
        .test-pass {
            background: rgba(76, 175, 80, 0.1);
        }
        .test-fail {
            background: rgba(244, 67, 54, 0.1);
        }
        .test-error {
            background: rgba(255, 152, 0, 0.1);
        }
        
        .recommendations {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .recommendations h3 {
            margin-top: 0;
            color: #1976d2;
        }
        .recommendations ul {
            margin: 0;
            padding-left: 20px;
        }
        .recommendations li {
            margin: 8px 0;
            line-height: 1.5;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .card h3 {
            margin-top: 0;
            color: #333;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-passed {
            background: #4caf50;
            color: white;
        }
        .status-failed {
            background: #f44336;
            color: white;
        }
        .status-error {
            background: #ff9800;
            color: white;
        }
        
        .footer {
            text-align: center;
            padding: 40px 20px;
            color: #666;
            border-top: 1px solid #e0e0e0;
            margin-top: 40px;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            .summary {
                grid-template-columns: 1fr;
            }
            .section-content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔬 IntelliLab GC Test Report</h1>
        <div class="subtitle">Comprehensive Testing Results - {{ summary.timestamp }}</div>
    </div>
    
    <div class="container">
        <!-- Summary Section -->
        <div class="summary">
            <div class="metric">
                <div class="metric-value">{{ summary.total }}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value passed">{{ summary.passed }}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value failed">{{ summary.failed }}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value {% if summary.pass_rate >= 95 %}passed{% elif summary.pass_rate >= 80 %}warning{% else %}failed{% endif %}">{{ "%.1f"|format(summary.pass_rate) }}%</div>
                <div class="metric-label">Pass Rate</div>
            </div>
        </div>
        
        <!-- Test Results Overview -->
        {% if test_results_chart %}
        <div class="section">
            <div class="section-header">📊 Test Results Overview</div>
            <div class="section-content">
                <div class="chart-container">
                    <img src="data:image/png;base64,{{ test_results_chart }}" alt="Test Results Distribution">
                </div>
            </div>
        </div>
        {% endif %}
        
        <!-- Performance Analysis -->
        {% if performance_charts.performance_overview %}
        <div class="section">
            <div class="section-header">⚡ Performance Analysis</div>
            <div class="section-content">
                <div class="chart-container">
                    <img src="data:image/png;base64,{{ performance_charts.performance_overview }}" alt="Performance Overview">
                </div>
                
                {% if load_test_results %}
                <div class="grid">
                    <div class="card">
                        <h3>Load Test Summary</h3>
                        <p><strong>Total Requests:</strong> {{ load_test_results.total_requests }}</p>
                        <p><strong>Success Rate:</strong> <span class="{% if load_test_results.overall_success_rate >= 95 %}passed{% else %}failed{% endif %}">{{ "%.1f"|format(load_test_results.overall_success_rate) }}%</span></p>
                        <p><strong>Requests/Second:</strong> {{ "%.1f"|format(load_test_results.requests_per_second) }}</p>
                    </div>
                    <div class="card">
                        <h3>Response Times</h3>
                        <p><strong>Average:</strong> {{ "%.3f"|format(load_test_results.avg_response_time) }}s</p>
                        <p><strong>95th Percentile:</strong> {{ "%.3f"|format(load_test_results.p95_response_time) }}s</p>
                        <p><strong>Maximum:</strong> {{ "%.3f"|format(load_test_results.max_response_time) }}s</p>
                    </div>
                </div>
                {% endif %}
            </div>
        </div>
        {% endif %}
        
        <!-- Calculation Tests -->
        {% if calculation_tests %}
        <div class="section">
            <div class="section-header">🧮 Calculation Validation Results</div>
            <div class="section-content">
                <table>
                    <thead>
                        <tr>
                            <th>Test Name</th>
                            <th>Status</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for test in calculation_tests %}
                        <tr class="{% if test.status == 'PASSED' %}test-pass{% elif test.status == 'FAILED' %}test-fail{% else %}test-error{% endif %}">
                            <td>{{ test.test }}</td>
                            <td>
                                <span class="status-badge status-{{ test.status.lower() }}">{{ test.status }}</span>
                            </td>
                            <td>
                                {% if test.status == 'PASSED' %}
                                    ✅ All calculations within tolerance
                                {% elif test.error %}
                                    {{ test.error[:100] }}{% if test.error|length > 100 %}...{% endif %}
                                {% elif test.mismatches %}
                                    {{ test.mismatches[0][:100] }}{% if test.mismatches[0]|length > 100 %}...{% endif %}
                                {% else %}
                                    Check test details
                                {% endif %}
                            </td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
        </div>
        {% endif %}
        
        <!-- Edge Case Analysis -->
        {% if edge_analysis %}
        <div class="section">
            <div class="section-header">⚠️ Edge Case Testing</div>
            <div class="section-content">
                <div class="grid">
                    <div class="card">
                        <h3>Summary</h3>
                        <p><strong>Total Tests:</strong> {{ edge_analysis.total_tests }}</p>
                        <p><strong>Passed:</strong> <span class="passed">{{ edge_analysis.passed }}</span></p>
                        <p><strong>Failed:</strong> <span class="failed">{{ edge_analysis.failed }}</span></p>
                    </div>
                    {% if edge_analysis.response_time_stats %}
                    <div class="card">
                        <h3>Response Times</h3>
                        <p><strong>Average:</strong> {{ "%.3f"|format(edge_analysis.response_time_stats.avg) }}s</p>
                        <p><strong>95th Percentile:</strong> {{ "%.3f"|format(edge_analysis.response_time_stats.p95) }}s</p>
                        <p><strong>Maximum:</strong> {{ "%.3f"|format(edge_analysis.response_time_stats.max) }}s</p>
                    </div>
                    {% endif %}
                </div>
                
                {% if edge_analysis.critical_failures %}
                <h3>Critical Failures</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Test</th>
                            <th>Endpoint</th>
                            <th>Error</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for failure in edge_analysis.critical_failures[:10] %}
                        <tr class="test-fail">
                            <td>{{ failure.test }}</td>
                            <td>{{ failure.endpoint.split('/')[-1] }}</td>
                            <td>{{ failure.error[:100] }}{% if failure.error|length > 100 %}...{% endif %}</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
                {% endif %}
            </div>
        </div>
        {% endif %}
        
        <!-- Recommendations -->
        <div class="recommendations">
            <h3>🎯 Recommendations & Next Steps</h3>
            <ul>
                {% for recommendation in recommendations %}
                <li>{{ recommendation }}</li>
                {% endfor %}
            </ul>
        </div>
        
        <!-- System Information -->
        <div class="section">
            <div class="section-header">💻 Test Environment</div>
            <div class="section-content">
                <div class="grid">
                    <div class="card">
                        <h3>Test Configuration</h3>
                        <p><strong>Timestamp:</strong> {{ summary.timestamp }}</p>
                        <p><strong>Report Generated:</strong> {{ datetime.now().strftime("%Y-%m-%d %H:%M:%S") }}</p>
                        <p><strong>Test Types:</strong> Calculation, Edge Case, Performance, Memory</p>
                    </div>
                    <div class="card">
                        <h3>Quality Metrics</h3>
                        <p><strong>Coverage:</strong> All major calculation endpoints</p>
                        <p><strong>Edge Cases:</strong> Boundary conditions, invalid inputs</p>
                        <p><strong>Load Testing:</strong> Concurrent requests, response times</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p>Generated by IntelliLab GC Test Suite | {{ datetime.now().strftime("%Y-%m-%d %H:%M:%S") }}</p>
        <p>🔬 Ensuring calculation accuracy and system reliability</p>
    </div>
</body>
</html>
        """)
        
        # Render template
        html_content = html_template.render(
            summary=summary,
            calculation_tests=calc_results,
            edge_case_results=test_data.get('edge_case_results', []),
            load_test_results=test_data.get('load_test_results', {}),
            memory_test_results=memory_results,
            edge_analysis=edge_analysis,
            recommendations=recommendations,
            test_results_chart=test_results_chart,
            performance_charts=performance_charts,
            datetime=datetime
        )
        
        # Write to file
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"📊 HTML report generated: {report_file}")
        return str(report_file)


def generate_sample_report():
    """Generate a sample report for testing"""
    sample_data = {
        "summary": {
            "total": 25,
            "passed": 22,
            "failed": 3,
            "pass_rate": 88.0,
            "timestamp": datetime.now().isoformat()
        },
        "calculation_tests": [
            {"test": "Split Ratio Calculation", "status": "PASSED"},
            {"test": "Detection Limit FID", "status": "PASSED"},
            {"test": "Column Optimization", "status": "FAILED", "error": "Tolerance exceeded for efficiency calculation"},
            {"test": "Pressure Drop", "status": "PASSED"},
        ],
        "edge_case_results": [
            {"test": "Maximum values", "passed": True, "response_time_s": 0.5},
            {"test": "Invalid input", "passed": False, "error": "Validation error"},
        ],
        "load_test_results": {
            "total_requests": 1000,
            "overall_success_rate": 96.5,
            "avg_response_time": 0.25,
            "p95_response_time": 0.8,
            "requests_per_second": 45.2,
            "endpoint_breakdown": {
                "/api/v1/calculations/inlet-simulator": {
                    "avg_response_time": 0.3,
                    "p95_response_time": 0.9,
                    "success_rate": 98.0
                },
                "/api/v1/calculations/detection-limit": {
                    "avg_response_time": 0.2,
                    "p95_response_time": 0.7,
                    "success_rate": 95.0
                }
            }
        }
    }
    
    generator = TestReportGenerator()
    return generator.generate_report(sample_data)


if __name__ == "__main__":
    # Generate sample report
    report_path = generate_sample_report()
    print(f"Sample report generated: {report_path}")
