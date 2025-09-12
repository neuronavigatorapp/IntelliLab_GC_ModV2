export type UserRole = 'admin' | 'analyst' | 'qc' | 'viewer';

export interface UserInfo {
  id: number;
  name: string;
  role: UserRole;
}

export interface AuthContext {
  user: UserInfo;
  token?: string;
}

export type ESignObjectType = 'calibration' | 'sequence' | 'run' | 'qcRecord';

export interface ESignRequest {
  objectType: ESignObjectType;
  objectId: string;
  reason: string;
  objectData?: Record<string, any>;
}

export interface ESignRecord {
  id: number;
  userId: number;
  timestamp: string;
  objectType: ESignObjectType;
  objectId: string;
  reason: string;
  objectHash: string;
  signature: string;
}


