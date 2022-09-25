export interface ResourceAllocation {
  resource: string;
  quantity: number;
}

export interface TaskActv {
  type: string;
  code: string;
}

export interface Predecessor {
  id: number;
  code: string;
  name: string;
  type: string;
  lag: number;
}
