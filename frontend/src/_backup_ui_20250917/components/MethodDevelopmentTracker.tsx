// Method Development Tracker - OCR-Based Systematic Method Optimization
// Track method development progress through multiple iterations with AI recommendations

import React, { useState, useCallback, useRef } from 'react';
import { FileImage, Activity, Download, Plus, Play, CheckCircle, AlertTriangle, XCircle, TrendingUp, TrendingDown, BookOpen, Target, Lightbulb, BarChart3 } from 'lucide-react';

interface MethodIteration {
  id: string;
  version: string;
  file: File;
  preview: string;
  analysis?: any;
  timestamp: Date;
  description: string;
  parameters: {
    temperature?: string;
    flowRate?: string;
    injectionVolume?: string;
    column?: string;
    detector?: string;
    notes?: string;
  };
  status: 'pending' | 'analyzing' | 'complete' | 'error';
}

interface MethodDevelopmentProject {
  id: string;
  name: string;
  objective: string;
  compound: string;
  iterations: MethodIteration[];
  createdDate: Date;
  lastModified: Date;
}

interface DevelopmentInsights {
  trendAnalysis: {
    qualityTrend: 'improving' | 'declining' | 'stable';
    peakTrend: 'increasing' | 'decreasing' | 'stable';
    bestIteration: string;
    worstIteration: string;
  };
  recommendations: string[];
  nextSteps: string[];
  successMetrics: {
    targetQuality: number;
    currentBest: number;
    improvementNeeded: number;
  };
}

const MethodDevelopmentTracker: React.FC = () => {
  const [projects, setProjects] = useState<MethodDevelopmentProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<MethodDevelopmentProject | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [developmentInsights, setDevelopmentInsights] = useState<DevelopmentInsights | null>(null);
  const [selectedView, setSelectedView] = useState<'projects' | 'iterations' | 'analysis' | 'insights'>('projects');
  
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewIterationModal, setShowNewIterationModal] = useState(false);
  
  const [newProject, setNewProject] = useState({
    name: '',
    objective: '',
    compound: ''
  });
  
  const [newIteration, setNewIteration] = useState({
    version: '',
    description: '',
    parameters: {
      temperature: '',
      flowRate: '',
      injectionVolume: '',
      column: '',
      detector: '',
      notes: ''
    }
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create new project
  const createProject = () => {
    if (!newProject.name.trim()) return;
    
    const project: MethodDevelopmentProject = {
      id: `project-${Date.now()}`,
      name: newProject.name,
      objective: newProject.objective,
      compound: newProject.compound,
      iterations: [],
      createdDate: new Date(),
      lastModified: new Date()
    };
    
    setProjects(prev => [...prev, project]);
    setSelectedProject(project);
    setNewProject({ name: '', objective: '', compound: '' });
    setShowNewProjectModal(false);
    setSelectedView('iterations');
  };

  // Handle file upload for new iteration
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (selectedProject && newIteration.version.trim()) {
          const iteration: MethodIteration = {
            id: `iteration-${Date.now()}`,
            version: newIteration.version,
            file,
            preview: e.target?.result as string,
            timestamp: new Date(),
            description: newIteration.description,
            parameters: { ...newIteration.parameters },
            status: 'pending'
          };
          
          // Update project with new iteration
          const updatedProject = {
            ...selectedProject,
            iterations: [...selectedProject.iterations, iteration],
            lastModified: new Date()
          };
          
          setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
          setSelectedProject(updatedProject);
          
          // Reset form
          setNewIteration({
            version: '',
            description: '',
            parameters: {
              temperature: '',
              flowRate: '',
              injectionVolume: '',
              column: '',
              detector: '',
              notes: ''
            }
          });
          setShowNewIterationModal(false);
        }
      };
      reader.readAsDataURL(file);
    }
    
    // Clear input
    if (event.target) {
      event.target.value = '';
    }
  }, [selectedProject, newIteration]);

  // Analyze single iteration
  const analyzeIteration = async (iteration: MethodIteration): Promise<any> => {
    try {
      const response = await fetch('/api/chromatogram/analyze-base64', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: iteration.preview
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Failed to analyze ${iteration.version}: ${error.message}`);
    }
  };

  // Run analysis on all iterations
  const runProjectAnalysis = async () => {
    if (!selectedProject || selectedProject.iterations.length === 0) return;

    setIsAnalyzing(true);
    setSelectedView('analysis');

    try {
      const updatedIterations = [...selectedProject.iterations];
      
      // Update all to analyzing status
      for (let i = 0; i < updatedIterations.length; i++) {
        updatedIterations[i] = { ...updatedIterations[i], status: 'analyzing' as const };
      }
      
      updateProjectIterations(updatedIterations);

      // Analyze each iteration
      for (let i = 0; i < updatedIterations.length; i++) {
        const iteration = updatedIterations[i];
        
        try {
          const analysis = await analyzeIteration(iteration);
          updatedIterations[i] = { ...iteration, status: 'complete', analysis };
          updateProjectIterations(updatedIterations);
          
        } catch (error: any) {
          console.error(`Analysis failed for ${iteration.version}:`, error);
          updatedIterations[i] = { ...iteration, status: 'error', analysis: { error: error.message } };
          updateProjectIterations(updatedIterations);
        }
        
        // Small delay between analyses
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Generate development insights
      const insights = generateDevelopmentInsights(updatedIterations);
      setDevelopmentInsights(insights);
      setSelectedView('insights');
      
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Update project iterations
  const updateProjectIterations = (iterations: MethodIteration[]) => {
    if (!selectedProject) return;
    
    const updatedProject = {
      ...selectedProject,
      iterations,
      lastModified: new Date()
    };
    
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
    setSelectedProject(updatedProject);
  };

  // Generate development insights
  const generateDevelopmentInsights = (iterations: MethodIteration[]): DevelopmentInsights => {
    const completedIterations = iterations.filter(iter => iter.status === 'complete' && iter.analysis);
    
    if (completedIterations.length < 2) {
      return {
        trendAnalysis: {
          qualityTrend: 'stable',
          peakTrend: 'stable',
          bestIteration: completedIterations[0]?.version || 'N/A',
          worstIteration: 'N/A'
        },
        recommendations: ['Need more iterations for trend analysis'],
        nextSteps: ['Continue method development with systematic parameter changes'],
        successMetrics: {
          targetQuality: 85,
          currentBest: completedIterations[0]?.analysis?.analysis?.overall_quality_score || 0,
          improvementNeeded: 0
        }
      };
    }
    
    // Quality trend analysis
    const qualityScores = completedIterations.map(iter => iter.analysis.analysis.overall_quality_score);
    const firstHalf = qualityScores.slice(0, Math.floor(qualityScores.length / 2));
    const secondHalf = qualityScores.slice(Math.floor(qualityScores.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    let qualityTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondAvg > firstAvg + 2) qualityTrend = 'improving';
    else if (secondAvg < firstAvg - 2) qualityTrend = 'declining';
    
    // Peak count trend analysis
    const peakCounts = completedIterations.map(iter => iter.analysis.analysis.peaks?.length || 0);
    const firstPeakAvg = peakCounts.slice(0, Math.floor(peakCounts.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(peakCounts.length / 2);
    const secondPeakAvg = peakCounts.slice(Math.floor(peakCounts.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(peakCounts.length / 2);
    
    let peakTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (secondPeakAvg > firstPeakAvg + 5) peakTrend = 'increasing';
    else if (secondPeakAvg < firstPeakAvg - 5) peakTrend = 'decreasing';
    
    // Best and worst iterations
    const bestIteration = completedIterations.reduce((best, current) => 
      (current.analysis.analysis.overall_quality_score > best.analysis.analysis.overall_quality_score) ? current : best
    );
    const worstIteration = completedIterations.reduce((worst, current) => 
      (current.analysis.analysis.overall_quality_score < worst.analysis.analysis.overall_quality_score) ? current : worst
    );
    
    // Generate recommendations
    const recommendations = generateRecommendations(qualityTrend, peakTrend, completedIterations);
    const nextSteps = generateNextSteps(qualityTrend, bestIteration, completedIterations);
    
    // Success metrics
    const targetQuality = 85;
    const currentBest = bestIteration.analysis.analysis.overall_quality_score;
    const improvementNeeded = Math.max(0, targetQuality - currentBest);
    
    return {
      trendAnalysis: {
        qualityTrend,
        peakTrend,
        bestIteration: bestIteration.version,
        worstIteration: worstIteration.version
      },
      recommendations,
      nextSteps,
      successMetrics: {
        targetQuality,
        currentBest,
        improvementNeeded
      }
    };
  };

  // Generate recommendations based on trends
  const generateRecommendations = (qualityTrend: string, peakTrend: string, iterations: MethodIteration[]): string[] => {
    const recommendations: string[] = [];
    
    if (qualityTrend === 'improving') {
      recommendations.push("Method is improving - continue with current optimization strategy");
      recommendations.push("Consider fine-tuning successful parameters for further improvement");
    } else if (qualityTrend === 'declining') {
      recommendations.push("Quality declining - revert to previous successful conditions");
      recommendations.push("Analyze what changed between good and poor iterations");
    } else {
      recommendations.push("Quality stable - try more significant parameter changes");
    }
    
    if (peakTrend === 'increasing') {
      recommendations.push("Peak detection improving - method sensitivity is increasing");
    } else if (peakTrend === 'decreasing') {
      recommendations.push("Peak loss detected - check for method sensitivity issues");
    }
    
    // Analysis of common issues across iterations
    const allIssues = iterations.flatMap(iter => iter.analysis?.analysis?.troubleshooting_suggestions || []);
    const issueFrequency: Record<string, number> = {};
    
    allIssues.forEach(issue => {
      issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
    });
    
    // Most common issues
    const commonIssues = Object.entries(issueFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([issue]) => issue);
    
    if (commonIssues.length > 0) {
      recommendations.push(`Address recurring issue: ${commonIssues[0]}`);
    }
    
    return recommendations.slice(0, 5);
  };

  // Generate next steps
  const generateNextSteps = (qualityTrend: string, bestIteration: MethodIteration, _iterations: MethodIteration[]): string[] => {
    const steps: string[] = [];
    
    if (qualityTrend === 'improving') {
      steps.push(`Build on success of ${bestIteration.version} with minor parameter adjustments`);
      steps.push("Test robustness by running multiple replicates of best conditions");
    } else {
      steps.push("Systematic parameter optimization needed");
      steps.push("Consider Design of Experiments (DoE) approach");
    }
    
    steps.push("Validate method with different sample matrices");
    steps.push("Document successful conditions for method transfer");
    steps.push("Establish method validation parameters and acceptance criteria");
    
    return steps.slice(0, 4);
  };

  // Delete project
  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (selectedProject?.id === projectId) {
      setSelectedProject(null);
      setSelectedView('projects');
    }
  };

  // Delete iteration
  const deleteIteration = (iterationId: string) => {
    if (!selectedProject) return;
    
    const updatedProject = {
      ...selectedProject,
      iterations: selectedProject.iterations.filter(iter => iter.id !== iterationId),
      lastModified: new Date()
    };
    
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
    setSelectedProject(updatedProject);
  };

  // Generate development report
  const generateDevelopmentReport = () => {
    if (!selectedProject || !developmentInsights) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const reportContent = `# Method Development Tracker Report

**Project:** ${selectedProject.name}  
**Objective:** ${selectedProject.objective}  
**Target Compound:** ${selectedProject.compound}  
**Report Date:** ${new Date().toLocaleString()}  
**Development Period:** ${selectedProject.createdDate.toLocaleDateString()} - ${selectedProject.lastModified.toLocaleDateString()}  

## Development Summary

**Total Iterations:** ${selectedProject.iterations.length}  
**Successful Analyses:** ${selectedProject.iterations.filter(iter => iter.status === 'complete').length}  
**Best Quality Score:** ${developmentInsights.successMetrics.currentBest.toFixed(1)}%  
**Target Quality:** ${developmentInsights.successMetrics.targetQuality}%  
**Improvement Needed:** ${developmentInsights.successMetrics.improvementNeeded.toFixed(1)}%  

## Trend Analysis

### Quality Trend
**Status:** ${developmentInsights.trendAnalysis.qualityTrend.toUpperCase()}  
**Best Iteration:** ${developmentInsights.trendAnalysis.bestIteration}  
**Worst Iteration:** ${developmentInsights.trendAnalysis.worstIteration}  

### Peak Detection Trend  
**Status:** ${developmentInsights.trendAnalysis.peakTrend.toUpperCase()}  

## Iteration History

${selectedProject.iterations.map((iteration, index) => `
### Iteration ${index + 1}: ${iteration.version}
- **Date:** ${iteration.timestamp.toLocaleString()}
- **Description:** ${iteration.description || 'No description provided'}
- **Status:** ${iteration.status === 'complete' ? '✅ Complete' : iteration.status === 'error' ? '❌ Failed' : '⏳ Pending'}
${iteration.analysis ? `- **Quality Score:** ${iteration.analysis.analysis?.overall_quality_score?.toFixed(1)}%
- **Peak Count:** ${iteration.analysis.analysis?.peaks?.length}
- **Primary Issue:** ${iteration.analysis.ai_insights?.primary_issue}` : ''}

**Method Parameters:**
${Object.entries(iteration.parameters).filter(([_key, value]) => value).map(([key, value]) => 
  `- **${key.charAt(0).toUpperCase() + key.slice(1)}:** ${value}`
).join('\n')}
`).join('\n')}

## AI Recommendations

### Development Strategy
${developmentInsights.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

### Next Steps
${developmentInsights.nextSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

## Method Development Insights

### Success Factors
- Systematic parameter tracking enables effective optimization
- OCR-driven analysis provides objective quality assessment
- Trend analysis identifies successful optimization directions
- AI recommendations guide efficient method development

### Field Utility Confirmation
✅ **No LIMS Required** - Pure OCR-based workflow  
✅ **Progress Tracking** - Visual development timeline  
✅ **AI Guidance** - Automated optimization recommendations  
✅ **Professional Documentation** - Client-ready development reports  

---
*Generated by ChromaVision Method Development Tracker*  
*Report Date: ${new Date().toLocaleString()}*
`;

    // Create and download the report
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Method_Development_Report_${selectedProject.name.replace(/\s+/g, '_')}_${timestamp}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get status icon
  const getStatusIcon = (status: MethodIteration['status']) => {
    switch (status) {
      case 'complete': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'analyzing': return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default: return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
      case 'increasing':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'declining':
      case 'decreasing':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <BarChart3 className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Method Development Tracker</h1>
                <p className="text-gray-600">OCR-based systematic method optimization with AI guidance</p>
              </div>
            </div>
            
            {selectedProject && (
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{selectedProject.iterations.length}</div>
                <div className="text-sm text-gray-500">Iterations</div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="flex border-b">
            <button
              onClick={() => setSelectedView('projects')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                selectedView === 'projects'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="w-5 h-5 inline-block mr-2" />
              Projects
            </button>
            <button
              onClick={() => setSelectedView('iterations')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                selectedView === 'iterations'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              disabled={!selectedProject}
            >
              <Activity className="w-5 h-5 inline-block mr-2" />
              Iterations
            </button>
            <button
              onClick={() => setSelectedView('analysis')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                selectedView === 'analysis'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              disabled={!selectedProject || selectedProject.iterations.length === 0}
            >
              <Play className="w-5 h-5 inline-block mr-2" />
              Analysis
            </button>
            <button
              onClick={() => setSelectedView('insights')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                selectedView === 'insights'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              disabled={!developmentInsights}
            >
              <Lightbulb className="w-5 h-5 inline-block mr-2" />
              Insights
            </button>
          </div>
        </div>

        {/* Projects View */}
        {selectedView === 'projects' && (
          <div className="space-y-6">
            
            {/* Create New Project Button */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Method Development Projects</h3>
                  <p className="text-gray-600">Create and manage systematic method optimization projects</p>
                </div>
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span>New Project</span>
                </button>
              </div>
            </div>

            {/* Projects List */}
            {projects.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Projects Yet</h3>
                <p className="text-gray-500 mb-6">Create your first method development project to get started</p>
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Create First Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-800 mb-1">{project.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{project.compound}</p>
                        <p className="text-xs text-gray-500">{project.objective}</p>
                      </div>
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-500">
                        {project.iterations.length} iterations
                      </div>
                      <div className="text-xs text-gray-400">
                        {project.lastModified.toLocaleDateString()}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedProject(project);
                        setSelectedView('iterations');
                      }}
                      className="w-full py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      Open Project
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Iterations View */}
        {selectedView === 'iterations' && selectedProject && (
          <div className="space-y-6">
            
            {/* Project Header */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{selectedProject.name}</h3>
                  <p className="text-gray-600">{selectedProject.compound} - {selectedProject.objective}</p>
                </div>
                <div className="flex space-x-3">
                  {selectedProject.iterations.length > 0 && (
                    <button
                      onClick={runProjectAnalysis}
                      disabled={isAnalyzing}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Play className="w-5 h-5" />
                      <span>{isAnalyzing ? 'Analyzing...' : 'Run Analysis'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowNewIterationModal(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Iteration</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Iterations Timeline */}
            {selectedProject.iterations.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <FileImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Iterations Yet</h3>
                <p className="text-gray-500 mb-6">Add your first method iteration to start tracking development progress</p>
                <button
                  onClick={() => setShowNewIterationModal(true)}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Add First Iteration
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-6">Development Timeline</h4>
                
                <div className="space-y-4">
                  {selectedProject.iterations.map((iteration, index) => (
                    <div key={iteration.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
                          {index + 1}
                        </div>
                      </div>
                      
                      <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden">
                        <img
                          src={iteration.preview}
                          alt={iteration.version}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h5 className="font-semibold text-gray-800">{iteration.version}</h5>
                          {getStatusIcon(iteration.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{iteration.description}</p>
                        <p className="text-xs text-gray-500">{iteration.timestamp.toLocaleString()}</p>
                        
                        {iteration.analysis && (
                          <div className="mt-2 text-sm">
                            <span className="text-green-600">Quality: {iteration.analysis.analysis?.overall_quality_score?.toFixed(1)}%</span>
                            {' • '}
                            <span className="text-blue-600">Peaks: {iteration.analysis.analysis?.peaks?.length}</span>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => deleteIteration(iteration.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analysis Progress View */}
        {selectedView === 'analysis' && selectedProject && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Analysis Progress</h3>
            
            <div className="space-y-4">
              {selectedProject.iterations.map((iteration, index) => (
                <div key={iteration.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-600 w-8">
                    {index + 1}
                  </div>
                  
                  <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden">
                    <img
                      src={iteration.preview}
                      alt={iteration.version}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{iteration.version}</div>
                    <div className="text-sm text-gray-500">
                      {iteration.status === 'complete' && iteration.analysis && (
                        <>
                          Quality: {iteration.analysis.analysis?.overall_quality_score?.toFixed(1)}% • 
                          Peaks: {iteration.analysis.analysis?.peaks?.length} • 
                          Grade: {iteration.analysis.ai_insights?.quality_grade}
                        </>
                      )}
                      {iteration.status === 'error' && (
                        <span className="text-red-500">Analysis failed</span>
                      )}
                      {iteration.status === 'analyzing' && (
                        <span className="text-blue-500">Analyzing...</span>
                      )}
                      {iteration.status === 'pending' && (
                        <span className="text-yellow-500">Waiting...</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-8">
                    {getStatusIcon(iteration.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights View */}
        {selectedView === 'insights' && developmentInsights && selectedProject && (
          <div className="space-y-6">
            
            {/* Overall Progress */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">Development Insights</h3>
                <button
                  onClick={generateDevelopmentReport}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
                >
                  <Download className="w-5 h-5" />
                  <span>Export Report</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{developmentInsights.successMetrics.currentBest.toFixed(1)}%</div>
                  <div className="text-blue-700 font-medium">Best Quality</div>
                  <div className="text-sm text-blue-600 mt-1">
                    Target: {developmentInsights.successMetrics.targetQuality}%
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600 flex items-center justify-center">
                    {getTrendIcon(developmentInsights.trendAnalysis.qualityTrend)}
                  </div>
                  <div className="text-green-700 font-medium">Quality Trend</div>
                  <div className="text-sm text-green-600 mt-1 capitalize">
                    {developmentInsights.trendAnalysis.qualityTrend}
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">{selectedProject.iterations.filter(iter => iter.status === 'complete').length}</div>
                  <div className="text-purple-700 font-medium">Completed</div>
                  <div className="text-sm text-purple-600 mt-1">
                    of {selectedProject.iterations.length} iterations
                  </div>
                </div>
              </div>
            </div>

            {/* Trend Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Best vs Worst */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Target className="w-5 h-5 text-green-500 mr-2" />
                  Performance Comparison
                </h4>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">Best Iteration</div>
                      <div className="text-sm text-gray-600">{developmentInsights.trendAnalysis.bestIteration}</div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {developmentInsights.successMetrics.currentBest.toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">Worst Iteration</div>
                      <div className="text-sm text-gray-600">{developmentInsights.trendAnalysis.worstIteration}</div>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {selectedProject.iterations.find(iter => iter.version === developmentInsights.trendAnalysis.worstIteration)?.analysis?.analysis?.overall_quality_score?.toFixed(1) || 'N/A'}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Metrics */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 text-blue-500 mr-2" />
                  Progress Metrics
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Quality Progress</span>
                      <span className="text-sm text-gray-600">{developmentInsights.successMetrics.currentBest.toFixed(1)}% of {developmentInsights.successMetrics.targetQuality}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all"
                        style={{ width: `${(developmentInsights.successMetrics.currentBest / developmentInsights.successMetrics.targetQuality) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-semibold text-blue-600 flex items-center justify-center">
                        {getTrendIcon(developmentInsights.trendAnalysis.qualityTrend)}
                      </div>
                      <div className="text-sm text-blue-700 capitalize">{developmentInsights.trendAnalysis.qualityTrend}</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-semibold text-purple-600 flex items-center justify-center">
                        {getTrendIcon(developmentInsights.trendAnalysis.peakTrend)}
                      </div>
                      <div className="text-sm text-purple-700 capitalize">{developmentInsights.trendAnalysis.peakTrend}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* AI Recommendations */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
                  AI Recommendations
                </h4>
                
                <div className="space-y-3">
                  {developmentInsights.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-sm font-semibold mt-0.5">
                        {index + 1}
                      </div>
                      <div className="text-gray-700">{recommendation}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                  Suggested Next Steps
                </h4>
                
                <div className="space-y-3">
                  {developmentInsights.nextSteps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-semibold mt-0.5">
                        {index + 1}
                      </div>
                      <div className="text-gray-700">{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Project Modal */}
        {showNewProjectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Create New Project</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Pharmaceutical Impurity Analysis"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Compound</label>
                  <input
                    type="text"
                    value={newProject.compound}
                    onChange={(e) => setNewProject(prev => ({ ...prev, compound: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Acetaminophen and impurities"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Development Objective</label>
                  <textarea
                    value={newProject.objective}
                    onChange={(e) => setNewProject(prev => ({ ...prev, objective: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="e.g., Achieve baseline separation of all impurities with <2% RSD"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={createProject}
                  disabled={!newProject.name.trim()}
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Project
                </button>
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Iteration Modal */}
        {showNewIterationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Add Method Iteration</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Version</label>
                    <input
                      type="text"
                      value={newIteration.version}
                      onChange={(e) => setNewIteration(prev => ({ ...prev, version: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., v1.0, v2.1, Initial"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chromatogram Upload</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newIteration.description}
                    onChange={(e) => setNewIteration(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={2}
                    placeholder="e.g., Increased oven temp to improve resolution"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Temperature Program</label>
                    <input
                      type="text"
                      value={newIteration.parameters.temperature}
                      onChange={(e) => setNewIteration(prev => ({ 
                        ...prev, 
                        parameters: { ...prev.parameters, temperature: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., 50°C (2min) to 280°C at 10°C/min"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Flow Rate</label>
                    <input
                      type="text"
                      value={newIteration.parameters.flowRate}
                      onChange={(e) => setNewIteration(prev => ({ 
                        ...prev, 
                        parameters: { ...prev.parameters, flowRate: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., 1.0 mL/min"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Injection Volume</label>
                    <input
                      type="text"
                      value={newIteration.parameters.injectionVolume}
                      onChange={(e) => setNewIteration(prev => ({ 
                        ...prev, 
                        parameters: { ...prev.parameters, injectionVolume: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., 1.0 μL"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Column</label>
                    <input
                      type="text"
                      value={newIteration.parameters.column}
                      onChange={(e) => setNewIteration(prev => ({ 
                        ...prev, 
                        parameters: { ...prev.parameters, column: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., DB-5ms 30m x 0.25mm x 0.25μm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Detector</label>
                    <input
                      type="text"
                      value={newIteration.parameters.detector}
                      onChange={(e) => setNewIteration(prev => ({ 
                        ...prev, 
                        parameters: { ...prev.parameters, detector: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., FID 280°C"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                    <input
                      type="text"
                      value={newIteration.parameters.notes}
                      onChange={(e) => setNewIteration(prev => ({ 
                        ...prev, 
                        parameters: { ...prev.parameters, notes: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., New liner installed"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!newIteration.version.trim()}
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Iteration
                </button>
                <button
                  onClick={() => setShowNewIterationModal(false)}
                  className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MethodDevelopmentTracker;