import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ErrorInfo } from './types';

@Injectable({
  providedIn: 'root'
})
export class ErrorBoundaryService {
  private errorSubject = new BehaviorSubject<ErrorInfo | null>(null);
  public error$ = this.errorSubject.asObservable();

  /**
   * Report an error to the error boundary
   */
  reportError(error: Error | string, context?: string): void {
    const errorInfo: ErrorInfo = {
      message: typeof error === 'string' ? error : error.message,
      code: typeof error === 'object' && 'code' in error ? (error as any).code : undefined,
      details: typeof error === 'object' ? error : { context },
      timestamp: new Date(),
      retryable: this.isRetryableError(error)
    };

    console.error('Document Viewer Error:', errorInfo);
    this.errorSubject.next(errorInfo);
  }

  /**
   * Clear the current error
   */
  clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: Error | string): boolean {
    if (typeof error === 'string') {
      return error.includes('network') || error.includes('timeout') || error.includes('CORS');
    }

    const message = error.message?.toLowerCase() || '';
    return message.includes('network') || 
           message.includes('timeout') || 
           message.includes('cors') ||
           message.includes('fetch');
  }

  /**
   * Get current error
   */
  getCurrentError(): ErrorInfo | null {
    return this.errorSubject.value;
  }
}
