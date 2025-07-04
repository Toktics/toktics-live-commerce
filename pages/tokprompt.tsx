import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../components/Layout';
import { TokPromptProvider } from '../lib/context/TokPromptContext';
import { useAuthContext } from '../lib/context/AuthContext';
import { ErrorLogger } from '../lib/monitoring/errorLoggerWrapper';
import { trackTokPrompt, ActivityTracker } from '../lib/tracking/activityTracker';
import { MultiUserTokPromptManager } from '../components/tokprompt/multi-user/MultiUserTokPromptManager';
import { TeleprompterSession } from '../components/tokprompt/multi-user/TeleprompterSession';
import { TeleprompterAccessControl } from '../components/tokprompt/multi-user/TeleprompterAccessControl';
import { StreamPermissionManager } from '../components/tokprompt/multi-user/StreamPermissionManager';
import { 
  Monitor, 
  Users, 
  Settings, 
  ArrowLeft,
  Shield,
  Zap,
  Eye,
  Play
} from 'lucide-react';

export default function MultiUserTokPromptPage() {
  const router = useRouter();
  const { user, profile } = useAuthContext();
  const [currentView, setCurrentView] = useState('manager');
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [userRole, setUserRole] = useState('viewer');
  const [streamId, setStreamId] = useState(null);
  const [error, setError] = useState(null);
  const [sessionStreamId, setSessionStreamId] = useState(null);

  // Better URL parameter detection using Next.js router
  useEffect(() => {
    const { access, session, stream } = router.query;
    
    console.log('🔍 Router query changed:', { access, session, stream, query: router.query });
    
    if (access) {
      console.log('📝 Router: Setting view to access');
      setCurrentView('access');
    } else if (session) {
      console.log('📝 Router: Setting session and view:', session);
      setActiveSessionId(session as string);
      setCurrentView('session');
      
      // If stream ID is provided in URL, use it
      if (stream) {
        console.log('📝 Router: Setting stream ID from URL:', stream);
        setStreamId(stream as string);
      }
    } else {
      console.log('📝 Router: Setting view to manager');
      setCurrentView('manager');
    }
  }, [router.query]);

  // LEGACY: Check URL parameters on load for direct session access
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionParam = urlParams.get('session');
    const accessParam = urlParams.get('access');
    
    console.log('🔍 TokPrompt URL params:', { sessionParam, accessParam, search: window.location.search });
    
    if (accessParam) {
      console.log('📝 Setting view to access');
      setCurrentView('access');
    } else if (sessionParam) {
      console.log('📝 Setting session and view:', sessionParam);
      setActiveSessionId(sessionParam);
      setCurrentView('session');
    } else {
      console.log('📝 Setting view to manager');
      setCurrentView('manager');
    }
  }, []);

  // ALSO listen for URL changes after initial load
  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionParam = urlParams.get('session');
      const accessParam = urlParams.get('access');
      
      console.log('🔄 URL changed, new params:', { sessionParam, accessParam });
      
      if (accessParam) {
        setCurrentView('access');
      } else if (sessionParam) {
        setActiveSessionId(sessionParam);
        setCurrentView('session');
      } else {
        setCurrentView('manager');
      }
    };

    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', handleUrlChange);
    
    // Also check on any navigation change
    const checkUrl = () => {
      const currentParams = new URLSearchParams(window.location.search);
      const currentAccess = currentParams.get('access');
      const currentSession = currentParams.get('session');
      
      if (currentAccess && currentView !== 'access') {
        setCurrentView('access');
      } else if (currentSession && currentView !== 'session') {
        setActiveSessionId(currentSession);
        setCurrentView('session');
      } else if (!currentAccess && !currentSession && currentView !== 'manager') {
        setCurrentView('manager');
      }
    };
    
    // Check URL periodically (fallback)
    const interval = setInterval(checkUrl, 1000);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      clearInterval(interval);
    };
  }, [currentView]);

  // Log page access with enhanced tracking
  useEffect(() => {
    if (profile?.uid && profile?.email) {
      // 🔥 ENHANCED TRACKING: TokPrompt page access
      trackTokPrompt(
        'create_session',
        'tokprompt-page-' + Date.now(),
        ActivityTracker.createContext({ user, profile }),
        {
          userRole: 'controller', // Default as controller when accessing main page
          participantCount: 0,
          sessionDuration: 0,
          feature: 'tokprompt_teleprompter'
        }
      );
    }
    
    // Keep existing error logging
    ErrorLogger.logSuccess('Multi-user TokPrompt page accessed', {
      feature: 'MultiUser_TokPrompt',
      action: 'page_access',
      userId: user?.uid,
      companyId: profile?.companyId,
      userRole: profile?.role,
      currentView
    });
  }, [user?.uid, profile?.companyId, profile?.role, currentView]);

  const handleJoinSession = async (sessionId, role, streamIdParam) => {
    setActiveSessionId(sessionId);
    setUserRole(role);
    setStreamId(streamIdParam);
    setCurrentView('session');
    
    // 🔥 ENHANCED TRACKING: TokPrompt session join
    if (profile?.uid && profile?.email) {
      await trackTokPrompt(
        'join_session',
        sessionId,
        ActivityTracker.createContext({ user, profile }),
        {
          streamId: streamIdParam,
          userRole: role,
          participantCount: 1, // Will be updated by the actual session component
          sessionDuration: 0
        }
      );
    }
  };

  const handleExitSession = async () => {
    // 🔥 ENHANCED TRACKING: TokPrompt session exit
    if (profile?.uid && profile?.email && activeSessionId) {
      await trackTokPrompt(
        'leave_session',
        activeSessionId,
        ActivityTracker.createContext({ user, profile }),
        {
          streamId: streamId,
          userRole: userRole,
          participantCount: 0, // Will be updated by actual session data
          sessionDuration: 0 // Would need to track actual duration
        }
      );
    }
    
    setActiveSessionId(null);
    setUserRole('viewer');
    setStreamId(null);
    setCurrentView('manager');
  };

  const handleAccessGranted = async (role, sessionId, sessionStreamId) => {
    console.log('🎉 handleAccessGranted called with:', {
      role,
      sessionId,
      sessionStreamId,
      currentView
    });
    
    setUserRole(role);
    setActiveSessionId(sessionId);
    setStreamId(sessionStreamId);
    setCurrentView('session');
    
    // Update URL to reflect session state (remove access=true)
    const newUrl = `/tokprompt?session=${sessionId}`;
    router.replace(newUrl, undefined, { shallow: true });
    
    console.log('🎯 After setting state and URL:', {
      userRole: role,
      activeSessionId: sessionId,
      streamId: sessionStreamId,
      currentView: 'session',
      newUrl
    });
    
    // 🔥 ENHANCED TRACKING: TokPrompt access granted
    if (profile?.uid && profile?.email) {
      await trackTokPrompt(
        'accept_invite',
        sessionId || 'access-granted-' + Date.now(),
        ActivityTracker.createContext({ user, profile }),
        {
          streamId: sessionStreamId,
          userRole: role,
          participantCount: 1,
          sessionDuration: 0
        }
      );
    }
  };

  const handleAccessDenied = (reason) => {
    setError(`Access denied: ${reason}`);
  };

  // Navigation component
  const Navigation = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        {currentView !== 'manager' && (
          <button
            onClick={() => {
              // Use router to navigate back cleanly
              router.push('/tokprompt', undefined, { shallow: true });
              setCurrentView('manager');
              setActiveSessionId(null);
              setStreamId(null);
            }}
            className="flex items-center gap-2 text-[#00FFE0] hover:text-[#00FFE0]/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Manager
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-[#00FFE0]">
            {currentView === 'manager' && 'Multi-User TokPrompt'}
            {currentView === 'session' && 'Live Session'}
            {currentView === 'access' && 'Session Access'}
            {currentView === 'permissions' && 'Stream Permissions'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {currentView === 'manager' && 'Manage teleprompter sessions for your team'}
            {currentView === 'session' && `${userRole === 'controller' ? 'Controlling' : 'Viewing'} teleprompter session`}
            {currentView === 'access' && 'Enter your access code to join a session'}
            {currentView === 'permissions' && 'Configure stream access permissions'}
          </p>
        </div>
      </div>
      
      {/* View Switcher */}
      {profile?.role === 'super_admin' && currentView === 'manager' && (
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView('permissions')}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            <Shield className="w-4 h-4" />
            Permissions
          </button>
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <TokPromptProvider>
        <div className="min-h-screen bg-black text-white p-6">
          <div className="max-w-7xl mx-auto">
            <Navigation />
            
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-300 hover:text-red-200"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Main Content */}
            {currentView === 'manager' && (
              <div className="space-y-8">
                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#0B0F19] border border-[#00FFE0]/30 rounded-lg p-6 text-center">
                    <Monitor className="w-8 h-8 mx-auto mb-3 text-[#00FFE0]" />
                    <h3 className="font-semibold text-white mb-2">Active Sessions</h3>
                    <p className="text-2xl font-bold text-[#00FFE0]">0</p>
                    <p className="text-sm text-gray-400">Currently running</p>
                  </div>
                  <div className="bg-[#0B0F19] border border-[#00FFE0]/30 rounded-lg p-6 text-center">
                    <Users className="w-8 h-8 mx-auto mb-3 text-blue-400" />
                    <h3 className="font-semibold text-white mb-2">Connected Users</h3>
                    <p className="text-2xl font-bold text-blue-400">0</p>
                    <p className="text-sm text-gray-400">Across all sessions</p>
                  </div>
                  <div className="bg-[#0B0F19] border border-[#00FFE0]/30 rounded-lg p-6 text-center">
                    <Zap className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
                    <h3 className="font-semibold text-white mb-2">Ready Streams</h3>
                    <p className="text-2xl font-bold text-yellow-400">0</p>
                    <p className="text-sm text-gray-400">With scripts prepared</p>
                  </div>
                </div>

                {/* Main Manager Component */}
                <MultiUserTokPromptManager />

                {/* Usage Instructions */}
                <div className="bg-[#0B0F19] border border-[#00FFE0]/30 rounded-lg p-6">
                  <h3 className="text-[#00FFE0] font-semibold mb-4">How Multi-User TokPrompt Works</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-white font-medium">For Session Controllers:</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Create a new teleprompter session from any prepared stream</li>
                        <li>• Control playback, speed, and visual settings</li>
                        <li>• Invite team members to view or co-control</li>
                        <li>• Monitor who's connected and their activity</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-white font-medium">For Session Viewers:</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Join sessions using access codes</li>
                        <li>• View synchronised teleprompter content</li>
                        <li>• Settings controlled by session owner</li>
                        <li>• Perfect for remote talent or team members</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'session' && activeSessionId && profile?.companyId && (
              <TeleprompterSession
                sessionId={activeSessionId}
                streamId={streamId || sessionStreamId || ''}
                userRole={userRole}
                companyId={profile.companyId}
                onSessionEnd={handleExitSession}
                onStreamIdLoaded={(loadedStreamId) => {
                  console.log('📊 Stream ID loaded from session:', loadedStreamId);
                  setSessionStreamId(loadedStreamId);
                }}
              />
            )}

            {currentView === 'access' && profile?.companyId && (
              <div className="max-w-md mx-auto">
                <TeleprompterAccessControl
                  companyId={profile.companyId}
                  onAccessGranted={handleAccessGranted}
                  onAccessDenied={handleAccessDenied}
                />
              </div>
            )}

            {currentView === 'permissions' && profile?.companyId && (
              <StreamPermissionManager
                companyId={profile.companyId}
                onPermissionChange={(streamId, permissions) => {
                  console.log('Permissions updated for stream:', streamId, permissions);
                }}
              />
            )}
          </div>
        </div>
      </TokPromptProvider>
    </Layout>
  );
}