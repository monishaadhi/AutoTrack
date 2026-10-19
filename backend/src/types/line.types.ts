export type LineStatus = 'RUNNING' | 'STOPPED' | 'MAINTENANCE';

export interface ProductionLineRow {
  line_id: number;
  factory_id: number;
  factory_name: string;
  factory_location: string;
  name: string;
  status: LineStatus;
  created_at: string;
}

export interface LineFilterParams {
  factoryId?: number;
  status?: LineStatus;
}
