// ============================================================================
// Authentication Types
// ============================================================================

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  userId: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

// ============================================================================
// Document Generation Types
// ============================================================================

export interface Form1099DivData {
  // Required fields
  calendarYear: string;
  payerName: string;
  payerTIN: string;
  recipientName: string;
  recipientTIN: string;
  totalOrdinaryDividends: string;
  
  // Optional payer address fields
  payerAddress?: string;
  payerCity?: string;
  payerState?: string;
  payerZip?: string;
  
  // Optional recipient address fields
  recipientAddress?: string;
  recipientCity?: string;
  recipientState?: string;
  recipientZip?: string;
  
  // Optional dividend fields
  qualifiedDividends?: string;
  totalCapitalGain?: string;
  unrecaptured1250Gain?: string;
  section1202Gain?: string;
  collectiblesGain?: string;
  section897OrdinaryDividends?: string;
  section897CapitalGain?: string;
  nondividendDistributions?: string;
  
  // Optional tax fields
  federalIncomeTaxWithheld?: string;
  section199ADividends?: string;
  investmentExpenses?: string;
  foreignTaxPaid?: string;
  foreignCountry?: string;
  
  // Optional distribution fields
  cashLiquidationDistributions?: string;
  noncashLiquidationDistributions?: string;
  exemptInterestDividends?: string;
  specifiedPABInterestDividends?: string;
  
  // Optional state tax fields
  stateTaxWithheld?: string;
  stateId?: string;
}

export interface GenerateDocumentRequest {
  documentType: '1099-DIV';
  formData: Form1099DivData;
}

export interface GenerateDocumentResponse {
  jobId: string;
  status: string;
  documentType: string;
  templateKey: string;
  outputKey: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: ValidationError[];
  retryAfter?: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  headers?: Record<string, string>;
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

// ============================================================================
// Health Check Types
// ============================================================================

export interface HealthCheckResponse {
  message: string;
}
