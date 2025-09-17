import React, { useState } from 'react';
import { 
  User, 
  Award, 
  TrendingUp, 
  Target, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  Github, 
  Linkedin, 
  Mail,
  Microscope,
  Zap,
  Eye,
  Calculator,
  BarChart3,
  Users,
  Star,
  Trophy,
  Code2,
  Rocket
} from 'lucide-react';

interface Skill {
  name: string;
  level: number;
  category: 'technical' | 'analytical' | 'software';
}

interface Achievement {
  title: string;
  description: string;
  date: string;
  type: 'tool' | 'project' | 'recognition' | 'certification';
  icon: string;
  impact?: string;
}

interface Tool {
  name: string;
  description: string;
  route: string;
  icon: string;
  category: 'analysis' | 'optimization' | 'ai' | 'calculation';
  featured: boolean;
  linkedinReady: boolean;
}

const PersonalPortfolio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'expertise' | 'tools' | 'achievements'>('overview');

  // Professional Profile Data
  const profile = {
    name: "IntelliLab GC Expert",
    title: "Senior Analytical Chemist & GC Specialist",
    location: "Midstream Operations",
    experience: "15+ Years",
    specialization: "NGL/LPG Analysis",
    linkedinUrl: "#",
    githubUrl: "#",
    email: "expert@intellilab-gc.com"
  };

  // Expertise Matrix
  const skills: Skill[] = [
    { name: "Gas Chromatography", level: 95, category: 'technical' },
    { name: "Method Development", level: 90, category: 'analytical' },
    { name: "Troubleshooting", level: 92, category: 'analytical' },
    { name: "Data Analysis", level: 88, category: 'analytical' },
    { name: "Python/FastAPI", level: 85, category: 'software' },
    { name: "React/TypeScript", level: 82, category: 'software' },
    { name: "AI/Computer Vision", level: 80, category: 'software' },
    { name: "Statistical Analysis", level: 87, category: 'analytical' },
    { name: "Quality Control", level: 93, category: 'analytical' },
    { name: "Instrument Maintenance", level: 91, category: 'technical' },
  ];

  // Achievement Timeline
  const achievements: Achievement[] = [
    {
      title: "ChromaVision AI Development",
      description: "Built AI-powered chromatogram analysis tool with computer vision and real-time troubleshooting",
      date: "2025-09",
      type: 'tool',
      icon: 'Eye',
      impact: "Revolutionized chromatogram analysis workflow"
    },
    {
      title: "Professional GC Calculator Suite",
      description: "Developed comprehensive calculation tools for split ratios, detection limits, and method optimization",
      date: "2025-08",
      type: 'tool',
      icon: 'Calculator',
      impact: "Streamlined daily GC calculations"
    },
    {
      title: "Fleet Management System",
      description: "Created enterprise-grade GC instrument tracking and maintenance system",
      date: "2025-07",
      type: 'project',
      icon: 'BarChart3',
      impact: "Improved instrument uptime by 35%"
    },
    {
      title: "Method Development Innovation",
      description: "Advanced troubleshooting methodologies for complex hydrocarbon separations",
      date: "2025-06",
      type: 'recognition',
      icon: 'Award',
      impact: "Reduced analysis time by 40%"
    },
    {
      title: "Professional Platform Architecture",
      description: "Built full-stack web application with React, FastAPI, and modern UI/UX design",
      date: "2025-05",
      type: 'project',
      icon: 'Code2',
      impact: "Enterprise-ready analytical platform"
    }
  ];

  // Featured Tools Portfolio
  const tools: Tool[] = [
    {
      name: "ChromaVision AI",
      description: "AI-powered chromatogram analysis with OCR and computer vision",
      route: "/chromatogram-analyzer",
      icon: "Eye",
      category: 'ai',
      featured: true,
      linkedinReady: true
    },
    {
      name: "Split Ratio Calculator", 
      description: "Professional GC inlet parameter optimization",
      route: "/split-ratio",
      icon: "Target",
      category: 'calculation',
      featured: true,
      linkedinReady: true
    },
    {
      name: "Detection Limit Calculator",
      description: "Statistical LOD/LOQ analysis with uncertainty",
      route: "/detection-limit",
      icon: "BarChart3",
      category: 'analysis',
      featured: true,
      linkedinReady: true
    },
    {
      name: "GC Fleet Manager",
      description: "Enterprise instrument tracking and maintenance",
      route: "/fleet-manager",
      icon: "Microscope",
      category: 'analysis',
      featured: true,
      linkedinReady: false
    },
    {
      name: "Veteran Tools Suite",
      description: "Advanced troubleshooting and diagnostic tools",
      route: "/veteran-tools",
      icon: "Zap",
      category: 'analysis',
      featured: false,
      linkedinReady: true
    },
    {
      name: "Chromatogram Simulator",
      description: "C1-C6 separation modeling and visualization",
      route: "/chromatogram-simulator",
      icon: "TrendingUp",
      category: 'optimization',
      featured: false,
      linkedinReady: true
    }
  ];

  const getSkillColor = (category: string) => {
    switch (category) {
      case 'technical': return 'bg-blue-500';
      case 'analytical': return 'bg-green-500';
      case 'software': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getAchievementIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Eye, Calculator, BarChart3, Award, Code2
    };
    return iconMap[iconName] || Award;
  };

  const getToolIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Eye, Target, BarChart3, Microscope, Zap, TrendingUp
    };
    return iconMap[iconName] || Calculator;
  };

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-purple-800 text-white p-8 rounded-xl shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Profile Avatar */}
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
          </div>
          
          {/* Profile Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
            <p className="text-xl text-blue-100 mb-3">{profile.title}</p>
            <div className="flex flex-wrap gap-4 text-blue-200 mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{profile.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{profile.experience}</span>
              </div>
              <div className="flex items-center gap-1">
                <Microscope className="w-4 h-4" />
                <span>{profile.specialization}</span>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex gap-3">
              <a href={profile.linkedinUrl} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors">
                <Linkedin className="w-4 h-4" />
                <span className="text-sm">LinkedIn</span>
              </a>
              <a href={profile.githubUrl} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors">
                <Github className="w-4 h-4" />
                <span className="text-sm">GitHub</span>
              </a>
              <a href={`mailto:${profile.email}`} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors">
                <Mail className="w-4 h-4" />
                <span className="text-sm">Contact</span>
              </a>
            </div>
          </div>
          
          {/* LinkedIn Showcase Badge */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Portfolio Ready
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex border-b">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'expertise', label: 'Expertise', icon: Star },
            { id: 'tools', label: 'Tools', icon: Zap },
            { id: 'achievements', label: 'Achievements', icon: Trophy }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Key Metrics */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Calculator className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-900">Professional Tools</h3>
                      <p className="text-blue-600">Built & Deployed</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-900">{tools.length}</div>
                  <p className="text-sm text-blue-700 mt-1">Enterprise-grade calculations</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-900">Achievements</h3>
                      <p className="text-green-600">This Year</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-900">{achievements.length}</div>
                  <p className="text-sm text-green-700 mt-1">Major milestones reached</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-purple-900">LinkedIn Ready</h3>
                      <p className="text-purple-600">Portfolio Tools</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-purple-900">
                    {tools.filter(t => t.linkedinReady).length}
                  </div>
                  <p className="text-sm text-purple-700 mt-1">Showcase ready demos</p>
                </div>
              </div>

              {/* Featured Tools Preview */}
              <div className="bg-white border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-blue-600" />
                  Featured Signature Tools
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {tools.filter(t => t.featured).map(tool => {
                    const Icon = getToolIcon(tool.icon);
                    return (
                      <div key={tool.name} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{tool.name}</h4>
                            {tool.linkedinReady && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                LinkedIn Ready
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{tool.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Expertise Tab */}
          {activeTab === 'expertise' && (
            <div className="space-y-6">
              <div className="grid gap-6">
                {['technical', 'analytical', 'software'].map(category => (
                  <div key={category} className="bg-white border rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4 capitalize flex items-center gap-2">
                      {category === 'technical' && <Microscope className="w-5 h-5 text-blue-600" />}
                      {category === 'analytical' && <BarChart3 className="w-5 h-5 text-green-600" />}
                      {category === 'software' && <Code2 className="w-5 h-5 text-purple-600" />}
                      {category} Skills
                    </h3>
                    <div className="space-y-3">
                      {skills.filter(s => s.category === category).map(skill => (
                        <div key={skill.name}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{skill.name}</span>
                            <span className="text-sm text-gray-600">{skill.level}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getSkillColor(skill.category)}`}
                              style={{ width: `${skill.level}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tools Tab */}
          {activeTab === 'tools' && (
            <div className="space-y-6">
              {['ai', 'calculation', 'analysis', 'optimization'].map(category => (
                <div key={category} className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4 capitalize flex items-center gap-2">
                    {category === 'ai' && <Eye className="w-5 h-5 text-purple-600" />}
                    {category === 'calculation' && <Calculator className="w-5 h-5 text-blue-600" />}
                    {category === 'analysis' && <BarChart3 className="w-5 h-5 text-green-600" />}
                    {category === 'optimization' && <TrendingUp className="w-5 h-5 text-orange-600" />}
                    {category} Tools
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {tools.filter(t => t.category === category).map(tool => {
                      const Icon = getToolIcon(tool.icon);
                      return (
                        <div key={tool.name} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Icon className="w-6 h-6 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{tool.name}</h4>
                              <div className="flex gap-2 mt-1">
                                {tool.featured && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    Featured
                                  </span>
                                )}
                                {tool.linkedinReady && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    LinkedIn Ready
                                  </span>
                                )}
                              </div>
                            </div>
                            <button className="p-2 hover:bg-gray-100 rounded-lg">
                              <ExternalLink className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{tool.description}</p>
                          <a 
                            href={tool.route}
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Open Tool
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="space-y-4">
              {achievements.map((achievement, index) => {
                const Icon = getAchievementIcon(achievement.icon);
                return (
                  <div key={index} className="bg-white border rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold">{achievement.title}</h4>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {achievement.date}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            achievement.type === 'tool' ? 'bg-blue-100 text-blue-700' :
                            achievement.type === 'project' ? 'bg-green-100 text-green-700' :
                            achievement.type === 'recognition' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {achievement.type}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{achievement.description}</p>
                        {achievement.impact && (
                          <p className="text-sm text-blue-600 font-medium">
                            Impact: {achievement.impact}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalPortfolio;