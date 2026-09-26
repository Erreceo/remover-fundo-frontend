/**
 * Data contracts and API models for Photo Background Replacement.
 * Corresponds to OpenAPI 3.0 contract specification.
 */

export interface BackgroundMetadata {
  id: string;
  filename: string;
  content_type: string;
  width: number;
  height: number;
  file_size_bytes: number;
  is_active: boolean;
  updated_at: string;
}

export interface SingleProcessJsonResponse {
  status: 'SUCCESS' | 'FAILED';
  original_filename: string;
  output_filename: string;
  width: number;
  height: number;
  processing_time_ms: number;
  image_base64: string;
}

export interface BatchItemResult {
  item_id: string;
  original_filename: string;
  status: 'SUCCESS' | 'FAILED';
  output_filename: string | null;
  error_message: string | null;
  processing_time_ms: number;
}

export interface BatchJobSummary {
  batch_id: string;
  total_photos: number;
  processed_count: number;
  failed_count: number;
  status: 'COMPLETED' | 'FAILED';
  download_url: string;
  zip_filename?: string;
  zip_size_bytes?: number;
  items: BatchItemResult[];
}

export interface ErrorResponse {
  detail: string;
}
