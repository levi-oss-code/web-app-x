export type GenerationStatus = 'pending' | 'completed' | 'failed';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface GenerationTask {
  id: string;
  user_id: string;
  original_input: string;
  ai_result: string | null;
  status: GenerationStatus;
  created_at: string;
}
