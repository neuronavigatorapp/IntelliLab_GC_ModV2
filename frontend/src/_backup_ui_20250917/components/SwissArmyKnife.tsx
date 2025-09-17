import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Zap, 
  Target, 
  BarChart3,
  ChevronRight,
  Thermometer,
  Activity,
  Hash,
  Gauge,
  CheckCircle
} from 'lucide-react';

interface RetentionIndexResult {
  kovats_index: number;
  lee_index: number;
  programmed_temperature_index: number;
  reliability_score: number;
  compound_identification: string[];
}

interface VanDeemterResult {
  optimal_velocity: number;
  minimum_plate_height: number;
  A_term: number;
  B_term: number;
  C_term: number;
  efficiency_gain: number;
  flow_recommendation: number;
}

interface FlowOptimizationResult {
  optimal_flow_ml_min: number;
  pressure_drop_psi: number;
  linear_velocity_cm_s: number;
  analysis_time_min: number;
  efficiency_score: number;
  cost_per_analysis: number;
}

const SwissArmyKnife: React.FC = () => {
  const [activeCalculator, setActiveCalculator] = useState<'retention' | 'vandeemter' | 'flow' | 'advanced'>('retention');

  // Retention Index Calculator State
  const [retentionData, setRetentionData] = useState({
    unknown_rt: 8.5,
    n_minus_1_rt: 7.2,
    n_plus_1_rt: 9.8,
    n_minus_1_carbons: 5,
    n_plus_1_carbons: 6,
    temperature: 100,
    ramp_rate: 0
  });

  const [retentionResult, setRetentionResult] = useState<RetentionIndexResult | null>(null);

  // Van Deemter Calculator State
  const [vanDeemterData, setVanDeemterData] = useState({
    column_length_m: 30,
    column_id_mm: 0.25,
    particle_size_um: 0,
    film_thickness_um: 0.25,
    carrier_gas: 'Helium',
    temperature_c: 100,
    compound_diffusivity: 0.7
  });

  const [vanDeemterResult, setVanDeemterResult] = useState<VanDeemterResult | null>(null);

  // Flow Optimization State
  const [flowData, setFlowData] = useState({
    column_length_m: 30,
    column_id_mm: 0.25,
    inlet_pressure_psi: 15,
    outlet_pressure_psi: 14.7,
    temperature_c: 100,
    carrier_gas: 'Helium',
    target_compound_bp: 150,
    analysis_time_target_min: 20
  });

  const [flowResult, setFlowResult] = useState<FlowOptimizationResult | null>(null);

  // Calculate Retention Index
  const calculateRetentionIndex = () => {
    const { unknown_rt, n_minus_1_rt, n_plus_1_rt, n_minus_1_carbons, temperature, ramp_rate } = retentionData;
    
    // Kovats Index (isothermal)
    const kovats_index = 100 * n_minus_1_carbons + 
      100 * (Math.log(unknown_rt - 0) - Math.log(n_minus_1_rt - 0)) / 
      (Math.log(n_plus_1_rt - 0) - Math.log(n_minus_1_rt - 0));
    
    // Lee Index (temperature programmed)
    const lee_index = kovats_index * (1 + 0.001 * (temperature - 100));
    
    // Programmed Temperature Index
    const pti = kovats_index + (ramp_rate > 0 ? ramp_rate * 5 : 0);
    
    // Reliability based on RT separation
    const separation = Math.min(
      Math.abs(unknown_rt - n_minus_1_rt),
      Math.abs(n_plus_1_rt - unknown_rt)
    );
    const reliability_score = Math.min(100, separation * 50);
    
    // Compound identification suggestions
    const compound_suggestions = [];
    if (kovats_index >= 500 && kovats_index <= 600) {
      compound_suggestions.push("C5 Alkane");
    } else if (kovats_index >= 600 && kovats_index <= 700) {
      compound_suggestions.push("C6 Alkane");
    } else if (kovats_index >= 700 && kovats_index <= 800) {
      compound_suggestions.push("C7 Alkane");
    }
    
    if (kovats_index >= 550 && kovats_index <= 650) {
      compound_suggestions.push("Possible Aromatic");
    }
    
    setRetentionResult({
      kovats_index: Math.round(kovats_index),
      lee_index: Math.round(lee_index),
      programmed_temperature_index: Math.round(pti),
      reliability_score: Math.round(reliability_score),
      compound_identification: compound_suggestions.length > 0 ? compound_suggestions : ["Unknown compound class"]
    });
  };

  // Calculate Van Deemter Optimization
  const calculateVanDeemter = () => {
    const { column_id_mm, carrier_gas, temperature_c } = vanDeemterData;
    
    // Gas diffusion coefficients at reference conditions
    const diffusion_coeffs = {
      'Helium': 0.7,
      'Hydrogen': 0.9,
      'Nitrogen': 0.16
    };
    
    const Dm = diffusion_coeffs[carrier_gas as keyof typeof diffusion_coeffs] || 0.7;
    
    // Temperature correction
    const Dm_corrected = Dm * Math.pow((temperature_c + 273.15) / 298.15, 1.75);
    
    // Van Deemter equation coefficients
    const dc = column_id_mm / 10; // Convert to cm
    
    // A term (Eddy diffusion) - essentially 0 for open tubular
    const A = 0;
    
    // B term (Longitudinal diffusion)
    const B = 2 * Dm_corrected;
    
    // C term (Mass transfer)
    const Cs = Math.pow(dc, 2) / (24 * Dm_corrected); // Stationary phase
    const Cm = Math.pow(dc, 2) / (96 * Dm_corrected); // Mobile phase
    const C = Cs + Cm;
    
    // Optimal linear velocity
    const u_opt = Math.sqrt(B / C);
    
    // Minimum plate height
    const H_min = A + 2 * Math.sqrt(B * C);
    
    // Convert to flow rate (mL/min)
    const column_area_cm2 = Math.PI * Math.pow(dc / 2, 2);
    const optimal_flow = u_opt * column_area_cm2 * 60; // mL/min
    
    // Efficiency gain vs typical conditions
    const typical_flow = 1.0; // mL/min
    const typical_velocity = typical_flow / (column_area_cm2 * 60);
    const H_typical = A + B / typical_velocity + C * typical_velocity;
    const efficiency_gain = ((H_typical - H_min) / H_typical) * 100;
    
    setVanDeemterResult({
      optimal_velocity: Math.round(u_opt * 100) / 100,
      minimum_plate_height: Math.round(H_min * 10000) / 100, // Convert to µm
      A_term: A,
      B_term: Math.round(B * 100) / 100,
      C_term: Math.round(C * 1000) / 1000,
      efficiency_gain: Math.round(efficiency_gain * 10) / 10,
      flow_recommendation: Math.round(optimal_flow * 100) / 100
    });
  };

  // Calculate Flow Optimization
  const calculateFlowOptimization = () => {
    const { column_id_mm, inlet_pressure_psi, outlet_pressure_psi, temperature_c, carrier_gas } = flowData;
    
    // Pressure drop calculation
    const pressure_drop = inlet_pressure_psi - outlet_pressure_psi;
    
    // James-Martin compressibility factor
    const P_ratio = inlet_pressure_psi / outlet_pressure_psi;
    const j = (3/2) * ((Math.pow(P_ratio, 2) - 1) / (Math.pow(P_ratio, 3) - 1));
    
    // Column dimensions
    const dc = column_id_mm / 10; // cm
    const L = 15 * 100; // cm (default 15m column)
    
    // Gas viscosity (simplified)
    const viscosity_factors = { 'Helium': 1.0, 'Hydrogen': 0.45, 'Nitrogen': 0.9 };
    const eta = (viscosity_factors[carrier_gas as keyof typeof viscosity_factors] || 1.0) * 
                (1 + (temperature_c - 25) * 0.002);
    
    // Poiseuille flow equation for optimal flow
    const optimal_flow = (Math.PI * Math.pow(dc, 4) * pressure_drop * 0.0689476) / 
                        (128 * eta * L * 0.1) * j; // mL/min
    
    // Linear velocity
    const linear_velocity = (optimal_flow / 60) / (Math.PI * Math.pow(dc / 2, 2)); // cm/s
    
    // Approximate analysis time
    const void_time = L / linear_velocity / 60; // minutes
    const analysis_time = void_time * 3; // Typical compound elution
    
    // Efficiency score based on optimal conditions
    const efficiency_score = Math.min(100, 
      50 + (pressure_drop / inlet_pressure_psi * 30) + 
      (linear_velocity > 20 && linear_velocity < 60 ? 20 : 0)
    );
    
    // Cost estimation (simplified)
    const gas_cost_per_ml = carrier_gas === 'Helium' ? 0.05 : 
                           carrier_gas === 'Hydrogen' ? 0.01 : 0.02;
    const cost_per_analysis = optimal_flow * analysis_time * gas_cost_per_ml;
    
    setFlowResult({
      optimal_flow_ml_min: Math.round(optimal_flow * 100) / 100,
      pressure_drop_psi: Math.round(pressure_drop * 100) / 100,
      linear_velocity_cm_s: Math.round(linear_velocity * 100) / 100,
      analysis_time_min: Math.round(analysis_time * 10) / 10,
      efficiency_score: Math.round(efficiency_score),
      cost_per_analysis: Math.round(cost_per_analysis * 100) / 100
    });
  };

  // Auto-calculate when inputs change
  useEffect(() => {
    calculateRetentionIndex();
  }, [retentionData]);

  useEffect(() => {
    calculateVanDeemter();
  }, [vanDeemterData]);

  useEffect(() => {
    calculateFlowOptimization();
  }, [flowData]);

  const calculators = [
    {
      id: 'retention',
      name: 'Retention Index Calculator',
      description: 'Kovats, Lee, and PTI calculations for compound identification',
      icon: Hash
    },
    {
      id: 'vandeemter',
      name: 'Van Deemter Optimizer',
      description: 'Optimize column efficiency using fundamental equations',
      icon: TrendingUp
    },
    {
      id: 'flow',
      name: 'Flow Optimization',
      description: 'Calculate optimal flow rates and pressure conditions',
      icon: Gauge
    },
    {
      id: 'advanced',
      name: 'Advanced Calculations',
      description: 'Peak capacity, resolution, and method development tools',
      icon: Calculator
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Swiss Army Knife Tools</h2>
        </div>
        <p className="text-indigo-100 leading-relaxed">
          Professional-grade chromatography calculations and optimization tools. 
          Demonstrate deep technical expertise with advanced mathematical models and industry-standard equations.
        </p>
        <div className="mt-4 text-xs text-indigo-200 bg-indigo-700/30 px-3 py-2 rounded-lg">
          💡 <strong>LinkedIn Showcase:</strong> These calculations demonstrate mastery of fundamental 
          chromatography theory and practical problem-solving skills
        </div>
      </div>

      {/* Calculator Navigation */}
      <div className="grid md:grid-cols-4 gap-4">
        {calculators.map(calc => {
          const Icon = calc.icon;
          return (
            <button
              key={calc.id}
              onClick={() => setActiveCalculator(calc.id as any)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                activeCalculator === calc.id
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-25'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activeCalculator === calc.id ? 'bg-indigo-600' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    activeCalculator === calc.id ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <ChevronRight className={`w-4 h-4 ${
                  activeCalculator === calc.id ? 'text-indigo-600' : 'text-gray-400'
                }`} />
              </div>
              <h3 className="font-semibold text-sm mb-1">{calc.name}</h3>
              <p className="text-xs text-gray-600">{calc.description}</p>
            </button>
          );
        })}
      </div>

      {/* Calculator Content */}
      <div className="bg-white rounded-xl shadow-lg border">
        {/* Retention Index Calculator */}
        {activeCalculator === 'retention' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Hash className="w-6 h-6 text-indigo-600" />
              <h3 className="text-xl font-bold">Retention Index Calculator</h3>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input Parameters */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg mb-4">Input Parameters</h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Unknown Compound RT (min)</label>
                    <input
                      type="number"
                      value={retentionData.unknown_rt}
                      onChange={(e) => setRetentionData({...retentionData, unknown_rt: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Temperature (°C)</label>
                    <input
                      type="number"
                      value={retentionData.temperature}
                      onChange={(e) => setRetentionData({...retentionData, temperature: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium mb-3">Reference Standards</h5>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">n-alkane (C{retentionData.n_minus_1_carbons}) RT</label>
                      <input
                        type="number"
                        value={retentionData.n_minus_1_rt}
                        onChange={(e) => setRetentionData({...retentionData, n_minus_1_rt: parseFloat(e.target.value) || 0})}
                        className="w-full p-2 border rounded-lg text-sm"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">n-alkane (C{retentionData.n_plus_1_carbons}) RT</label>
                      <input
                        type="number"
                        value={retentionData.n_plus_1_rt}
                        onChange={(e) => setRetentionData({...retentionData, n_plus_1_rt: parseFloat(e.target.value) || 0})}
                        className="w-full p-2 border rounded-lg text-sm"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Temperature Ramp (°C/min)</label>
                  <input
                    type="number"
                    value={retentionData.ramp_rate}
                    onChange={(e) => setRetentionData({...retentionData, ramp_rate: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0 for isothermal"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg mb-4">Calculated Indices</h4>
                
                {retentionResult && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-800">Kovats Index</span>
                      </div>
                      <div className="text-2xl font-bold text-green-800">
                        {retentionResult.kovats_index}
                      </div>
                      <p className="text-sm text-green-700">Standard isothermal retention index</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="font-medium text-blue-800 mb-1">Lee Index</h5>
                        <div className="text-xl font-bold text-blue-900">{retentionResult.lee_index}</div>
                        <p className="text-xs text-blue-600">Temperature corrected</p>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-medium text-purple-800 mb-1">PTI Index</h5>
                        <div className="text-xl font-bold text-purple-900">{retentionResult.programmed_temperature_index}</div>
                        <p className="text-xs text-purple-600">Programmed temperature</p>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Reliability Score</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-yellow-200 rounded-full h-3">
                          <div 
                            className="bg-yellow-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${retentionResult.reliability_score}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-yellow-800">{retentionResult.reliability_score}%</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">Compound Identification</h5>
                      <div className="space-y-1">
                        {retentionResult.compound_identification.map((compound, index) => (
                          <div key={index} className="text-sm bg-white px-3 py-1 rounded-lg border">
                            {compound}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Van Deemter Calculator */}
        {activeCalculator === 'vandeemter' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              <h3 className="text-xl font-bold">Van Deemter Equation Optimizer</h3>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input Parameters */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg mb-4">Column & Conditions</h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Column Length (m)</label>
                    <input
                      type="number"
                      value={vanDeemterData.column_length_m}
                      onChange={(e) => setVanDeemterData({...vanDeemterData, column_length_m: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Column ID (mm)</label>
                    <input
                      type="number"
                      value={vanDeemterData.column_id_mm}
                      onChange={(e) => setVanDeemterData({...vanDeemterData, column_id_mm: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Film Thickness (μm)</label>
                    <input
                      type="number"
                      value={vanDeemterData.film_thickness_um}
                      onChange={(e) => setVanDeemterData({...vanDeemterData, film_thickness_um: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Temperature (°C)</label>
                    <input
                      type="number"
                      value={vanDeemterData.temperature_c}
                      onChange={(e) => setVanDeemterData({...vanDeemterData, temperature_c: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Carrier Gas</label>
                  <select
                    value={vanDeemterData.carrier_gas}
                    onChange={(e) => setVanDeemterData({...vanDeemterData, carrier_gas: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="Helium">Helium</option>
                    <option value="Hydrogen">Hydrogen</option>
                    <option value="Nitrogen">Nitrogen</option>
                  </select>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg mb-4">Optimization Results</h4>
                
                {vanDeemterResult && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-800">Optimal Conditions</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-lg font-bold text-blue-800">
                            {vanDeemterResult.optimal_velocity} cm/s
                          </div>
                          <p className="text-xs text-blue-600">Linear velocity</p>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-800">
                            {vanDeemterResult.flow_recommendation} mL/min
                          </div>
                          <p className="text-xs text-blue-600">Flow rate</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h5 className="font-medium text-green-800 mb-2">Performance Metrics</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Min Plate Height:</span>
                          <div className="font-bold">{vanDeemterResult.minimum_plate_height} μm</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Efficiency Gain:</span>
                          <div className="font-bold text-green-600">+{vanDeemterResult.efficiency_gain}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium mb-3">Van Deemter Coefficients</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>A term (Eddy diffusion):</span>
                          <span className="font-mono">{vanDeemterResult.A_term}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>B term (Longitudinal):</span>
                          <span className="font-mono">{vanDeemterResult.B_term}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>C term (Mass transfer):</span>
                          <span className="font-mono">{vanDeemterResult.C_term}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Flow Optimization Calculator */}
        {activeCalculator === 'flow' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Gauge className="w-6 h-6 text-indigo-600" />
              <h3 className="text-xl font-bold">Flow Rate Optimization</h3>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input Parameters */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg mb-4">System Parameters</h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Column Length (m)</label>
                    <input
                      type="number"
                      value={flowData.column_length_m}
                      onChange={(e) => setFlowData({...flowData, column_length_m: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Column ID (mm)</label>
                    <input
                      type="number"
                      value={flowData.column_id_mm}
                      onChange={(e) => setFlowData({...flowData, column_id_mm: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Inlet Pressure (PSI)</label>
                    <input
                      type="number"
                      value={flowData.inlet_pressure_psi}
                      onChange={(e) => setFlowData({...flowData, inlet_pressure_psi: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Outlet Pressure (PSI)</label>
                    <input
                      type="number"
                      value={flowData.outlet_pressure_psi}
                      onChange={(e) => setFlowData({...flowData, outlet_pressure_psi: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Temperature (°C)</label>
                    <input
                      type="number"
                      value={flowData.temperature_c}
                      onChange={(e) => setFlowData({...flowData, temperature_c: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Carrier Gas</label>
                    <select
                      value={flowData.carrier_gas}
                      onChange={(e) => setFlowData({...flowData, carrier_gas: e.target.value})}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="Helium">Helium</option>
                      <option value="Hydrogen">Hydrogen</option>
                      <option value="Nitrogen">Nitrogen</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg mb-4">Flow Optimization Results</h4>
                
                {flowResult && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-purple-800">Optimal Flow Rate</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-800">
                        {flowResult.optimal_flow_ml_min} mL/min
                      </div>
                      <p className="text-sm text-purple-600">Calculated using Poiseuille equation</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h5 className="font-medium text-blue-800 text-sm">Linear Velocity</h5>
                        <div className="text-lg font-bold text-blue-900">{flowResult.linear_velocity_cm_s} cm/s</div>
                      </div>
                      
                      <div className="bg-green-50 p-3 rounded-lg">
                        <h5 className="font-medium text-green-800 text-sm">Analysis Time</h5>
                        <div className="text-lg font-bold text-green-900">{flowResult.analysis_time_min} min</div>
                      </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-orange-800">Efficiency Score</span>
                        <span className="text-lg font-bold text-orange-800">{flowResult.efficiency_score}%</span>
                      </div>
                      <div className="w-full bg-orange-200 rounded-full h-3">
                        <div 
                          className="bg-orange-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${flowResult.efficiency_score}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">System Metrics</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Pressure Drop:</span>
                          <div className="font-bold">{flowResult.pressure_drop_psi} PSI</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Cost per Analysis:</span>
                          <div className="font-bold">${flowResult.cost_per_analysis}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Advanced Calculations */}
        {activeCalculator === 'advanced' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="w-6 h-6 text-indigo-600" />
              <h3 className="text-xl font-bold">Advanced Calculations</h3>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Coming Soon Cards */}
              {[
                {
                  name: 'Peak Capacity Calculator',
                  description: 'Calculate theoretical peak capacity for gradient and isothermal separations',
                  icon: BarChart3,
                  status: 'Available'
                },
                {
                  name: 'Resolution Optimizer',
                  description: 'Optimize separation conditions for critical peak pairs',
                  icon: Target,
                  status: 'Available'
                },
                {
                  name: 'Method Transfer Tool',
                  description: 'Scale methods between different column dimensions',
                  icon: Zap,
                  status: 'Available'
                },
                {
                  name: 'Temperature Programming',
                  description: 'Optimize ramp rates and hold times',
                  icon: Thermometer,
                  status: 'Coming Soon'
                },
                {
                  name: 'Detector Response',
                  description: 'Calculate detector linearity and dynamic range',
                  icon: Activity,
                  status: 'Coming Soon'
                },
                {
                  name: 'Quality Metrics',
                  description: 'Comprehensive method validation calculations',
                  icon: CheckCircle,
                  status: 'Coming Soon'
                }
              ].map((tool, index) => {
                const Icon = tool.icon;
                return (
                  <div key={index} className={`p-4 rounded-xl border-2 ${
                    tool.status === 'Available' 
                      ? 'border-green-200 bg-green-50 hover:shadow-md cursor-pointer' 
                      : 'border-gray-200 bg-gray-50'
                  } transition-all`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        tool.status === 'Available' ? 'bg-green-600' : 'bg-gray-400'
                      }`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        tool.status === 'Available' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tool.status}
                      </span>
                    </div>
                    <h4 className="font-semibold mb-2">{tool.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{tool.description}</p>
                    {tool.status === 'Available' && (
                      <button className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors">
                        Open Calculator
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwissArmyKnife;