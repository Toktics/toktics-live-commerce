// Error Logger Wrapper - Provides consistent error logging across the application
// This is a simplified version for the teleprompter components

export const ErrorLogger = {
  logError: async (error, context = {}) => {
    console.error('🔴 Error logged:', {
      message: error.message || error,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
    
    // In production, this would send to your error tracking service
    // (Sentry, LogRocket, etc.)
    try {
      // Example: Send to monitoring service
      // await sendToMonitoringService({ error, context });
    } catch (loggingError) {
      console.error('Failed to log error to monitoring service:', loggingError);
    }
  },
  
  logSuccess: async (message, context = {}) => {
    console.log('✅ Success logged:', {
      message,
      context,
      timestamp: new Date().toISOString()
    });
    
    // Optional: Send success metrics to analytics
    try {
      // Example: Send to analytics service
      // await sendToAnalytics({ event: 'success', message, context });
    } catch (analyticsError) {
      console.warn('Failed to log success to analytics:', analyticsError);
    }
  },
  
  logInfo: async (message, context = {}) => {
    console.info('ℹ️ Info logged:', {
      message,
      context,
      timestamp: new Date().toISOString()
    });
    
    // Optional: Send info logs to service
  },
  
  logWarning: async (message, context = {}) => {
    console.warn('⚠️ Warning logged:', {
      message,
      context,
      timestamp: new Date().toISOString()
    });
  }
};

// Export default for backward compatibility
export default ErrorLogger;