export interface CreateJobDto {
 name: string;
 description?: string;
 schedule: string;
 command: string;
 enabled: boolean;
 timeout: number;
 retries: number;
 tags: string[];
 environment?: Record<string, string>;
 code?: string;
 language?: string;
 filename?: string;
 allowNetwork?: boolean;
 userId?: string; // Will be set by the controller
}

export interface UpdateJobDto {
 name?: string;
 description?: string;
 schedule?: string;
 command?: string;
 enabled?: boolean;
 timeout?: number;
 retries?: number;
 tags?: string[];
 environment?: Record<string, string>;
 code?: string;
 language?: string;
 filename?: string;
 allowNetwork?: boolean;
}

export interface JobQueryDto {
 search?: string;
 enabled?: boolean;
 teamId?: string;
 page?: string;
 limit?: string;
 view?: 'list' | 'grid';
}

export interface JobExecutionQueryDto {
 limit?: string;
}

export interface ExecuteJobDto {
 force?: boolean;
}
