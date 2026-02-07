/**
 * ApiClient - Core HTTP client for communicating with the Tax App Backend API
 * 
 * This class provides a centralized HTTP client with:
 * - Configurable base URL and timeout
 * - Support for GET, POST, PUT, DELETE operations
 * - Automatic JSON parsing
 * - Request/response interceptor pipeline
 * - CORS support with credentials
 * - Custom headers per request
 * - Timeout handling
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { ApiClientConfig, RequestConfig, HealthCheckResponse } from './types';
import { ErrorHandler } from './errorHandler';

/**
 * Type definition for request interceptors
 * Interceptors can modify the request config before the request is sent
 */
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;

/**
 * Type definition for response interceptors
 * Interceptors can process responses after they are received
 */
export type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

/**
 * ApiClient class - Core HTTP client for backend communication
 */
export class ApiClient {
  private config: ApiClientConfig;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  /**
   * Creates a new ApiClient instance
   * 
   * @param config - Configuration object with baseURL, timeout, and optional headers
   * 
   * Requirements: 1.1, 1.2, 12.1, 12.3
   */
  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  /**
   * Registers a request interceptor
   * Interceptors are executed in the order they are registered
   * 
   * @param interceptor - Function that processes request config before sending
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Registers a response interceptor
   * Interceptors are executed in the order they are registered
   * 
   * @param interceptor - Function that processes responses after receiving
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Performs a GET request
   * 
   * @param url - The endpoint URL (relative to baseURL)
   * @param config - Optional request configuration
   * @returns Promise resolving to the parsed response data
   * 
   * Requirements: 1.3
   */
  async get<T>(url: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      method: 'GET',
      url,
      ...config
    });
  }

  /**
   * Performs a POST request
   * 
   * @param url - The endpoint URL (relative to baseURL)
   * @param data - The request body data
   * @param config - Optional request configuration
   * @returns Promise resolving to the parsed response data
   * 
   * Requirements: 1.3
   */
  async post<T>(url: string, data?: unknown, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...config
    });
  }

  /**
   * Performs a PUT request
   * 
   * @param url - The endpoint URL (relative to baseURL)
   * @param data - The request body data
   * @param config - Optional request configuration
   * @returns Promise resolving to the parsed response data
   * 
   * Requirements: 1.3
   */
  async put<T>(url: string, data?: unknown, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...config
    });
  }

  /**
   * Performs a DELETE request
   * 
   * @param url - The endpoint URL (relative to baseURL)
   * @param config - Optional request configuration
   * @returns Promise resolving to the parsed response data
   * 
   * Requirements: 1.3
   */
  async delete<T>(url: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      method: 'DELETE',
      url,
      ...config
    });
  }

  /**
   * Performs a health check request to verify backend connectivity
   * 
   * This method sends a GET request to the /hello endpoint without authentication.
   * It can be used to verify that the backend is reachable and responding.
   * 
   * @returns Promise resolving to the health check response with status message
   * 
   * Requirements: 5.1, 5.2, 5.3, 5.4
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    return this.get<HealthCheckResponse>('/hello', {
      requiresAuth: false
    });
  }

  /**
   * Core request method that handles all HTTP operations
   * 
   * This method:
   * 1. Applies request interceptors
   * 2. Builds the fetch request with proper headers and options
   * 3. Handles timeouts
   * 4. Applies response interceptors
   * 5. Parses JSON responses
   * 6. Handles errors
   * 
   * @param requestConfig - The request configuration
   * @returns Promise resolving to the parsed response data
   * 
   * Requirements: 1.2, 1.4, 1.5, 12.2, 12.4
   */
  private async request<T>(requestConfig: RequestConfig): Promise<T> {
    try {
      // Apply request interceptors
      let config = requestConfig;
      for (const interceptor of this.requestInterceptors) {
        config = await interceptor(config);
      }

      // Build the full URL
      const fullUrl = `${this.config.baseURL}${config.url}`;

      // Build headers with defaults
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...config.headers
      };

      // Build fetch options
      const fetchOptions: RequestInit = {
        method: config.method,
        headers,
        mode: 'cors'
        // Note: credentials: 'include' is not needed for JWT auth with localStorage
        // Only use credentials: 'include' if using cookie-based authentication
      };

      // Add body for POST, PUT requests
      if (config.data && (config.method === 'POST' || config.method === 'PUT')) {
        fetchOptions.body = JSON.stringify(config.data);
      }

      // Create abort controller for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      try {
        // Make the fetch request
        let response = await fetch(fullUrl, {
          ...fetchOptions,
          signal: controller.signal
        });

        // Clear the timeout
        clearTimeout(timeoutId);

        // Apply response interceptors
        for (const interceptor of this.responseInterceptors) {
          response = await interceptor(response);
        }

        // Handle error responses
        if (!response.ok) {
          const apiError = await ErrorHandler.handleError(response);
          throw apiError;
        }

        // Parse and return JSON response
        const data = await response.json();
        return data as T;

      } catch (error) {
        // Clear the timeout
        clearTimeout(timeoutId);

        // Handle abort/timeout errors
        if (error instanceof Error && error.name === 'AbortError') {
          throw {
            status: 0,
            message: 'Request timeout. Please try again.'
          };
        }

        // Re-throw API errors
        throw error;
      }

    } catch (error) {
      // Handle network errors
      if (error instanceof Error && !('status' in error)) {
        throw ErrorHandler.handleNetworkError(error);
      }

      // Re-throw API errors
      throw error;
    }
  }
}

