// Activity Tracker - Simplified version for teleprompter tracking
// This provides consistent activity tracking across TokPrompt features

export const ActivityTracker = {
  createContext: ({ user, profile }) => {
    return {
      userId: user?.uid,
      userEmail: user?.email,
      userName: profile?.name || user?.email?.split('@')[0] || 'Unknown',
      companyId: profile?.companyId,
      role: profile?.role,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
      url: typeof window !== 'undefined' ? window.location.href : null
    };
  },
  
  trackEvent: async (eventName, properties = {}, context = {}) => {
    const trackingData = {
      event: eventName,
      properties,
      context,
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Activity tracked:', trackingData);
    
    // In production, send to your analytics service
    try {
      // Example: Send to analytics service (Mixpanel, Amplitude, etc.)
      // await sendToAnalytics(trackingData);
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  }
};

// TokPrompt-specific tracking functions
export const trackTokPrompt = async (action, sessionId, context, metadata = {}) => {
  return ActivityTracker.trackEvent('tokprompt_action', {
    action,
    sessionId,
    feature: 'tokprompt_teleprompter',
    ...metadata
  }, context);
};

export const trackTeleprompterSession = async (action, sessionData, context) => {
  return ActivityTracker.trackEvent('teleprompter_session', {
    action,
    sessionId: sessionData.sessionId,
    streamId: sessionData.streamId,
    userRole: sessionData.userRole,
    participantCount: sessionData.participantCount || 0,
    sessionDuration: sessionData.sessionDuration || 0,
    feature: 'multi_user_teleprompter'
  }, context);
};

// Export default for backward compatibility
export default ActivityTracker;