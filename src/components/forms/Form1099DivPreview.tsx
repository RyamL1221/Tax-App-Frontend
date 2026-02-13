/**
 * Form1099DivPreview Component
 * 
 * Displays the generated 1099-DIV document information with options to edit or approve.
 * 
 * Features:
 * - Displays job ID, status, and document type
 * - In-page PDF preview with authenticated fetch
 * - Download button for generated PDF
 * - "Edit" button to return to form for modifications
 * - "Approve" button with automatic download, success message, and error handling
 * - Comprehensive error handling for PDF loading and download failures
 * - Loading states for async operations (PDF fetch, approve download)
 * - Full accessibility support (ARIA labels, keyboard navigation)
 * - Responsive design (mobile and desktop)
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.3
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { documentService } from '@/lib/api';

/**
 * Document response structure from the backend API
 */
export interface DocumentResponse {
  jobId: string;
  status: string;
  documentType: string;
  templateKey: string;
  outputKey: string;
}

export interface Form1099DivPreviewProps {
  /**
   * The generated document information from the API
   */
  document: DocumentResponse;
  
  /**
   * Callback fired when the user clicks the "Edit" button
   */
  onEdit: () => void;
  
  /**
   * Callback fired when the user clicks the "Approve" button
   */
  onApprove: () => void;
  
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Form1099DivPreview Component
 * 
 * Displays generated document information and provides edit/approve actions.
 */
export function Form1099DivPreview({ 
  document, 
  onEdit, 
  onApprove,
  className 
}: Form1099DivPreviewProps) {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  // Fetch PDF when component mounts or document changes
  useEffect(() => {
    let isMounted = true;
    let currentBlobUrl: string | null = null;

    const fetchPdf = async () => {
      console.log('[Form1099DivPreview] Fetching PDF', {
        jobId: document.jobId,
        outputKey: document.outputKey,
        timestamp: new Date().toISOString()
      });
      
      setPdfLoading(true);
      setPdfError(null);

      try {
        const blobUrl = await documentService.downloadDocument(document.jobId);
        
        if (isMounted) {
          console.log('[Form1099DivPreview] PDF loaded successfully', {
            blobUrl,
            jobId: document.jobId
          });
          currentBlobUrl = blobUrl;
          setPdfUrl(blobUrl);
          setPdfLoading(false);
        } else {
          console.log('[Form1099DivPreview] Component unmounted, discarding PDF');
        }
      } catch (error: any) {
        console.error('[Form1099DivPreview] Error fetching PDF', {
          error: error.message || error,
          status: error.status,
          jobId: document.jobId,
          stack: error.stack
        });
        
        if (isMounted) {
          // Map error status to user-friendly message
          let errorMessage = 'Failed to load PDF document';
          
          if (error.status === 404) {
            errorMessage = 'Document not found or not ready yet. Please try again.';
          } else if (error.status === 401) {
            errorMessage = 'Authentication failed. Please log in again.';
          } else if (error.status === 403) {
            errorMessage = "You don't have permission to access this document.";
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (error.status === 504) {
            errorMessage = 'Request timeout. The PDF download took too long. Please try again.';
          } else if (error.status === 0) {
            errorMessage = 'Network error. Please check your connection and try again.';
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          console.log('[Form1099DivPreview] Setting error message', { errorMessage });
          setPdfError(errorMessage);
          setPdfLoading(false);
        }
      }
    };

    fetchPdf();

    // Cleanup: revoke blob URL when component unmounts or document changes
    return () => {
      isMounted = false;
      if (currentBlobUrl) {
        console.log('[Form1099DivPreview] Revoking blob URL', { blobUrl: currentBlobUrl });
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [document.outputKey]);

  // Handle approve button click
  const handleApprove = async () => {
    setIsApproving(true);
    setApproveError(null);
    
    try {
      console.log('[Form1099DivPreview] Starting approve with automatic download', {
        jobId: document.jobId,
        timestamp: new Date().toISOString()
      });
      
      // Download PDF
      const blobUrl = await documentService.downloadDocument(document.jobId);
      
      console.log('[Form1099DivPreview] Download successful, triggering browser download', {
        blobUrl,
        jobId: document.jobId
      });
      
      // Trigger browser download
      triggerDownload(blobUrl);
      
      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);
      
      console.log('[Form1099DivPreview] Download complete, showing success message');
      
      // Show success message with countdown
      setShowSuccess(true);
      setCountdown(5);
    } catch (error: any) {
      console.error('[Form1099DivPreview] Error during approve download:', error);
      
      // Set user-friendly error message
      let errorMessage = 'Failed to download PDF. Please use the download button to save your document.';
      
      if (error.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.status === 404) {
        errorMessage = 'Document not found. Please try again.';
      } else if (error.status === 403) {
        errorMessage = "You don't have permission to access this document.";
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status === 504) {
        errorMessage = 'Request timeout. The PDF download took too long. Please try again.';
      } else if (error.status === 0) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setApproveError(errorMessage);
    } finally {
      setIsApproving(false);
    }
  };

  // Helper function to trigger browser download
  const triggerDownload = (blobUrl: string) => {
    console.log('[Form1099DivPreview] Creating download link', {
      blobUrl,
      filename: `1099-DIV-${document.jobId}.pdf`
    });
    
    // Create temporary download link
    // Note: Using window.document to avoid collision with the 'document' prop
    const link = window.document.createElement('a');
    link.href = blobUrl;
    link.download = `1099-DIV-${document.jobId}.pdf`;
    
    // Append to body (required for Firefox)
    window.document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    window.document.body.removeChild(link);
    
    console.log('[Form1099DivPreview] Download link clicked and cleaned up');
  };

  // Reset success state if document changes
  useEffect(() => {
    setShowSuccess(false);
    setCountdown(5);
  }, [document.jobId]);

  // Countdown timer for redirect after approval
  useEffect(() => {
    if (!showSuccess) return;
    
    // If countdown reaches 0, navigate to dashboard
    if (countdown === 0) {
      console.log('[Form1099DivPreview] Countdown complete, navigating to dashboard');
      onApprove();
      router.push('/dashboard');
      return;
    }
    
    // Decrement countdown every second
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [showSuccess, countdown, onApprove, router]);

  // If showing success message, display it
  if (showSuccess) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'flex flex-col items-center justify-center p-8 md:p-12',
          className
        )}
      >
        <div className="flex flex-col items-center space-y-6 max-w-md text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          
          {/* Success Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Form Approved Successfully!
            </h2>
            <p className="text-gray-600">
              Your 1099-DIV form has been finalized.
            </p>
          </div>
          
          {/* Download Notification */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
            <div className="flex items-center justify-center space-x-2">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm font-medium text-blue-800">
                Your PDF is downloading automatically
              </p>
            </div>
          </div>
          
          {/* Countdown and Redirect Info */}
          <div className="space-y-3">
            <p className="text-gray-500 text-sm">
              Redirecting to dashboard in...
            </p>
            <div className="flex items-center justify-center">
              <span 
                className="text-4xl font-bold text-blue-600"
                aria-live="polite"
                aria-atomic="true"
              >
                {countdown}
              </span>
            </div>
            <p className="text-gray-400 text-xs">
              seconds
            </p>
          </div>
          
          {/* Manual Navigation Button */}
          <Button
            onClick={() => {
              onApprove();
              router.push('/dashboard');
            }}
            variant="secondary"
            size="lg"
            className="mt-2"
          >
            Go to Dashboard Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Preview Generated Document
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Review your document and download the PDF
        </p>
      </div>

      {/* Document Information Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-5 space-y-4">
          {/* Job ID */}
          <div className="flex flex-col sm:flex-row sm:items-center">
            <dt className="text-sm font-medium text-gray-500 sm:w-40 sm:flex-shrink-0">
              Job ID
            </dt>
            <dd className="mt-1 sm:mt-0 text-sm text-gray-900 font-mono break-all">
              {document.jobId}
            </dd>
          </div>

          {/* Status */}
          <div className="flex flex-col sm:flex-row sm:items-center">
            <dt className="text-sm font-medium text-gray-500 sm:w-40 sm:flex-shrink-0">
              Status
            </dt>
            <dd className="mt-1 sm:mt-0">
              <StatusBadge status={document.status} />
            </dd>
          </div>

          {/* Document Type */}
          <div className="flex flex-col sm:flex-row sm:items-center">
            <dt className="text-sm font-medium text-gray-500 sm:w-40 sm:flex-shrink-0">
              Document Type
            </dt>
            <dd className="mt-1 sm:mt-0 text-sm text-gray-900 font-medium">
              {document.documentType}
            </dd>
          </div>
        </div>
      </div>

      {/* PDF Preview Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg
              className="w-8 h-8 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Form 1099-DIV PDF
              </p>
              <p className="text-xs text-gray-500">
                {pdfLoading ? 'Loading...' : pdfError ? 'Error loading PDF' : 'Ready to view'}
              </p>
            </div>
          </div>
          {pdfUrl && (
            <a
              href={pdfUrl}
              download={`1099-DIV-${document.jobId}.pdf`}
              className={cn(
                'inline-flex items-center px-4 py-2 rounded-md',
                'text-sm font-medium text-blue-600 bg-blue-50',
                'hover:bg-blue-100 active:bg-blue-200',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'transition-colors duration-200',
                'min-h-[44px]'
              )}
              aria-label="Download PDF document"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download
            </a>
          )}
        </div>

        {/* PDF Viewer */}
        <div className="relative bg-gray-100" style={{ minHeight: '600px' }}>
          {pdfLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600">Loading PDF...</p>
              </div>
            </div>
          )}

          {pdfError && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-red-600 mr-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800 mb-1">
                      Failed to Load PDF
                    </h3>
                    <p className="text-sm text-red-700">
                      {pdfError}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {pdfUrl && !pdfLoading && !pdfError && (
            <iframe
              src={pdfUrl}
              className="w-full border-0"
              style={{ height: '600px' }}
              title="1099-DIV Form Preview"
              aria-label="PDF preview of generated 1099-DIV form"
            />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          onClick={onEdit}
          variant="secondary"
          size="lg"
          className="w-full sm:w-auto sm:flex-1"
          aria-label="Edit form data"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit Form
        </Button>
        <Button
          onClick={handleApprove}
          variant="primary"
          size="lg"
          className="w-full sm:w-auto sm:flex-1"
          disabled={isApproving}
          aria-label="Approve and finalize form"
        >
          {isApproving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Downloading...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Approve
            </>
          )}
        </Button>
      </div>

      {/* Approve Error Message */}
      {approveError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-red-800">
              <p className="font-medium mb-1">Download Failed</p>
              <p className="text-red-700">{approveError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Next Steps</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Review the PDF preview above</li>
              <li>Click &quot;Download&quot; to save a copy to your device</li>
              <li>Click &quot;Edit Form&quot; if you need to make changes</li>
              <li>Click &quot;Approve&quot; to finalize your submission</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * StatusBadge Component
 * 
 * Displays a colored badge based on the document generation status
 */
interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toUpperCase();
  
  const statusConfig = {
    COMPLETED: {
      label: 'Completed',
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    PENDING: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    RUNNING: {
      label: 'Running',
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    FAILED: {
      label: 'Failed',
      className: 'bg-red-100 text-red-800 border-red-200'
    }
  };

  const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || {
    label: status,
    className: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className
      )}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
