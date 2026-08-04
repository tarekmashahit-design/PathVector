export type DemoDeviceType = 'Router' | 'Switch' | 'AP' | 'PC' | 'Server' | 'Firewall';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Category = 'switching' | 'routing' | 'security' | 'infrastructure';

export interface DemoInterface {
  name: string;
  status: 'up' | 'down';
  config_lines: string[];
}

export interface DemoDevice {
  id: string;
  name: string;
  type: DemoDeviceType;
  model: string;
  position: { x: number; y: number };
  config: string;
  interfaces: DemoInterface[];
}

export interface DemoLink {
  source_device: string;
  source_interface: string;
  target_device: string;
  target_interface: string;
  status: 'healthy' | 'degraded' | 'down';
}

export interface DemoTopology {
  devices: DemoDevice[];
  links: DemoLink[];
  warnings: string[];
}

export interface DemoFinding {
  rule_id: string;
  severity: Severity;
  category: Category;
  title: string;
  affected_devices: string[];
  affected_interfaces: string[];
  description: string;
  evidence: string[];
  fix_commands: Record<string, string[]>;
  ai_diagnosis: string | null;
  confidence: number | null;
}

export interface DemoScores {
  overall: number;
  switching: number;
  routing: number;
  security: number;
  infrastructure: number;
}
