import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface RampSegment {
  id: string;
  startTemp: number;
  rate: number;
  hold: number;
}

interface RampEditorProps {
  segments: RampSegment[];
  onSegmentsChange: (segments: RampSegment[]) => void;
  className?: string;
}

export const RampEditor: React.FC<RampEditorProps> = ({
  segments,
  onSegmentsChange,
  className
}) => {
  const addSegment = () => {
    const newSegment: RampSegment = {
      id: Date.now().toString(),
      startTemp: segments.length > 0 ? segments[segments.length - 1].startTemp + 50 : 50,
      rate: 10,
      hold: 1
    };
    onSegmentsChange([...segments, newSegment]);
  };

  const removeSegment = (id: string) => {
    onSegmentsChange(segments.filter(segment => segment.id !== id));
  };

  const updateSegment = (id: string, field: keyof RampSegment, value: number) => {
    onSegmentsChange(segments.map(segment => 
      segment.id === id ? { ...segment, [field]: value } : segment
    ));
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Oven Ramp Program</CardTitle>
          <Button onClick={addSegment} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Segment
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {segments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No ramp segments defined</p>
              <p className="text-sm">Click "Add Segment" to create your first ramp</p>
            </div>
          ) : (
            segments.map((segment, index) => (
              <div key={segment.id} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Segment {index + 1}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`start-temp-${segment.id}`} className="text-xs">
                    Start Temp (°C)
                  </Label>
                  <Input
                    id={`start-temp-${segment.id}`}
                    type="number"
                    value={segment.startTemp}
                    onChange={(e) => updateSegment(segment.id, 'startTemp', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`rate-${segment.id}`} className="text-xs">
                    Rate (°C/min)
                  </Label>
                  <Input
                    id={`rate-${segment.id}`}
                    type="number"
                    value={segment.rate}
                    onChange={(e) => updateSegment(segment.id, 'rate', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`hold-${segment.id}`} className="text-xs">
                    Hold (min)
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id={`hold-${segment.id}`}
                      type="number"
                      value={segment.hold}
                      onChange={(e) => updateSegment(segment.id, 'hold', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                    <Button
                      onClick={() => removeSegment(segment.id)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
