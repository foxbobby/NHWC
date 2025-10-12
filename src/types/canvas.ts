export interface Point {
  x: number;
  y: number;
}

export interface DrawingStroke {
  points: Point[];
  color: string;
  width: number;
  timestamp: number;
  id: string;
}

export interface CanvasData {
  imageData: string; // Base64编码的图像数据
  width: number;
  height: number;
  strokes: DrawingStroke[];
  timestamp: Date;
}

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
  maxStrokes: number;
}

export interface BrushSettings {
  size: number;
  color: string;
  opacity: number;
  type: 'pen' | 'brush' | 'marker';
}

export interface CanvasAction {
  type: 'DRAW' | 'UNDO' | 'REDO' | 'CLEAR' | 'SET_BRUSH' | 'START_DRAWING' | 'FINISH_DRAWING';
  payload?: unknown;
  timestamp: number;
}

export interface TouchEvent {
  identifier: number;
  clientX: number;
  clientY: number;
  force?: number;
}

export interface CanvasState {
  strokes: DrawingStroke[];
  undoStack: DrawingStroke[][];
  redoStack: DrawingStroke[];
  isDrawing: boolean;
  currentStroke?: DrawingStroke;
  brushSettings: BrushSettings;
}