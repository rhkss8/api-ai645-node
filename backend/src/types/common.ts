export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface HealthCheckResponse {
  status: 'OK' | 'ERROR';
  timestamp: string;
  database: 'connected' | 'disconnected';
  dbTime?: string;
  environment: string;
  version: string;
}

export interface ErrorResponse extends ApiResponse {
  success: false;
  error: string;
  details?: any;
} 