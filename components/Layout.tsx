"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { FirstTimePopup } from "../components/streamdash/FirstTimePopup";
import { useTutorialState } from "../hooks/useTutorialState";
import { usePageHelp } from "../hooks/usePageHelp";
import { StreamDashHelpSystem } from "../components/streamdash/StreamDashHelpSystem";
import { StreamPrepTutorial } from "../components/streamprep/StreamPrepTutorial";
import { DashboardTutorial } from "../components/dashboard/DashboardTutorial";
import { TokPromptHelpSystem } from "../components/tokprompt/TokPromptHelpSystem";
import { useAuthContext } from "../lib/context/AuthContext";
import FeedbackModal from "../components/FeedbackModal";
import UserMenu from "../components/UserMenu";
import CookieBanner from '../components/CookieBanner';
import Link from "next/link";
import {
  LayoutGrid,
  Video,
  CalendarDays,
  Boxes,
  CheckCircle2,
  UserCog,
  PenTool,
  Sparkles,
  PackageCheck,
  MessageCircle,
  Pin,
  Clapperboard,
  Layers,
  Flame,
  BarChart,
  Smartphone,
  LineChart,
  Users,
  UserPlus,
  Bell,
  HelpCircle,
  Settings,
} from "lucide-react";

// ... (keep all your existing constants and subpages objects) ...
const mainNavLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Stream Prep", href: "/stream-prep", icon: Video },
   { label: "Script Studio", href: "/scriptwriter", icon: PenTool }, // ✅ Changed from "/script-studio" to "/scriptwriter"
  { label: "TokBoost", href: "/tokboost", icon: Layers },
  { label: "TokPrompt", href: "/tokprompt", icon: Clapperboard }, // UPDATED! Changed from Users to Clapperboard
  // { label: "Live Deals", href: "/live-deals", icon: Flame }, // 🔒 Temporarily disabled - no valuable content yet
  // { label: "Live Tracker", href: "/live-tracker", icon: BarChart }, // 🔒 Temporarily disabled - no valuable content yet
  // { label: "Mobile Companion", href: "/mobile-companion", icon: Smartphone }, // 🔒 Temporarily disabled - no valuable content yet
  { label: "Analytics", href: "/analytics", icon: LineChart },
  { label: "Competitor Analytics", href: "/competitor-analytics", icon: Users },
  // { label: "Affiliate Matchmaker", href: "/affiliate-matchmaker", icon: UserPlus }, // 🔒 Temporarily disabled - no valuable content yet
];

const scriptStudioSubpages = {
  "scriptwriter": { label: "Script Writer", href: "/scriptwriter", icon: Clapperboard },
  "tokboost": { label: "TokBoost", href: "/tokboost", icon: Layers },
  "product-features": { label: "Product Features", href: "", icon: Sparkles },
  "bundles": { label: "Bundles", href: "", icon: PackageCheck },
  "closing-prompts": { label: "Closing Prompts", href: "", icon: MessageCircle },
  "pinned-products": { label: "Pinned Products", href: "", icon: Pin },
};

const streamPrepSubpages = {
  "stream-event": { label: "Stream Event", href: "/stream-prep/stream-event", icon: CheckCircle2 },  
  "product-lineup": { label: "Product Lineup", href: "/stream-prep/product-lineup", icon: Boxes },
  "stream-view": { label: "Stream View", href: "/stream-prep/stream-view", icon: Video },
  "stream-dash": { label: "Stream Dash", href: "/stream-prep/stream-dash", icon: LayoutGrid },
  "calendar": { label: "Calendar", href: "/stream-prep/calendar", icon: CalendarDays },
  "scriptwriter": { label: "Script Writer", href: "/scriptwriter", icon: Clapperboard },
  "roles": { label: "Roles", href: "", icon: UserCog },               // deactivated
};

const liveDealsSubpages = {
  "intro": { label: "Intro", href: "/live-deals/intro", icon: Sparkles },
  "bundles": { label: "Bundle Builder", href: "/live-deals/bundles", icon: Boxes },
  "discounts": { label: "Discount Settings", href: "/live-deals/discounts", icon: PackageCheck },
  "urgency": { label: "Urgency Tools", href: "", icon: Flame }, // 🔒 disabled
  "suggestions": { label: "Smart Suggestions", href: "", icon: Sparkles }, // 🔒 disabled
};

const liveTrackerSubpages = {
  "live-overview": { label: "Live Overview", href: "/live-tracker/live-overview", icon: LayoutGrid },
  "moments": { label: "Live Moment Breakdown", href: "/live-tracker/moments", icon: Clapperboard },
  "score": { label: "Live Creator Score", href: "", icon: BarChart }, // 🔒 disabled
};

const mobileCompanionSubpages = {
  "companion-setup": { label: "Companion Setup", href: "/mobile-companion/companion-setup", icon: Smartphone },
  "tokprompt": { label: "TokPrompt", href: "/tokprompt", icon: Layers },
  "feedback": { label: "Live Feedback", href: "", icon: MessageCircle }, // 🔒 disabled
};

const analyticsSubpages = {
  "analytics-overview": { label: "Analytics Overview", href: "/analytics/analytics-overview", icon: LineChart },
  "performance": { label: "Performance Metrics", href: "/analytics/performance-metrics", icon: BarChart }, 
  "audience": { label: "Audience Insights", href: "/analytics/audience-insights", icon: Users }, 
  "conversions": { label: "Conversion Funnels", href: "/analytics/conversion-funnels", icon: PackageCheck }, 
  "comments": { label: "Comments", href: "/analytics/comments", icon: MessageCircle }, // NEW!
};

const competitorTrackerSubpages = {
  "competitor-overview": { label: "Competitor Overview", href: "/competitor-tracker/competitor-overview", icon: LayoutGrid },
  "trending": { label: "Trending Products", href: "", icon: Flame }, // 🔒 disabled
  "leaderboard": { label: "Leaderboard", href: "", icon: BarChart }, // 🔒 disabled
};

const affiliateMatchmakerSubpages = {
  "affiliate-overview": { label: "Affiliate Overview", href: "/affiliate-matchmaker/affiliate-overview", icon: UserPlus },
  "matches": { label: "Recommended Matches", href: "", icon: Users }, // 🔒 disabled
  "invite": { label: "Invite & Track", href: "", icon: MessageCircle }, // 🔒 disabled
};

const inactiveSubpages = ["Checklist", "Roles", "Product Features", "Bundles", "Closing Prompts", "Pinned Products"];

type Props = {
  children: React.ReactNode;
};

export function Layout({ children }: Props) {
  const pathname = usePathname();
  const { canInviteUsers, profile } = useAuthContext();
  
  // Add error logging for profile issues - FIXED
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      import('../lib/monitoring/errorLoggerWrapper').then(({ ErrorLogger }) => {
        if (!profile) {
          ErrorLogger.logError('Profile is undefined in Layout component', {
            feature: 'Layout',
            action: 'profile_check',
            severity: 'medium',
            componentState: {
              pathname,
              hasProfile: !!profile,
              canInviteUsers: !!canInviteUsers
            }
          });
        }
      });
    }
  }, [profile, pathname, canInviteUsers]);
  const pathParts = pathname.split("/");
  const section = pathParts[1];
  const subpage = pathParts[2];

  // NEW: Check if we're on the home page
  const isHomePage = pathname === "/";

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showHelpBadge, setShowHelpBadge] = React.useState(false);

  // NEW: Add page-specific help state
  const [showPageTutorials, setShowPageTutorials] = React.useState(false);
  const [currentTutorialStep, setCurrentTutorialStep] = React.useState(0);
  const pageHelp = usePageHelp();

  // NEW: Add tutorial state management
  const tutorialState = pageHelp?.hasInteractiveTutorials 
    ? useTutorialState(pathname.replace(/\//g, '_'))
    : { showFirstTimePopup: false, shouldHighlightHelp: false, dismissFirstTimePopup: () => {}, markTutorialCompleted: () => {} };

  React.useEffect(() => {
    if (typeof window !== "undefined" && pathname === "/stream-prep") {
      const badgeState = localStorage.getItem("streamPrepHelpBadge");
      if (badgeState !== "dismissed") {
        setShowHelpBadge(true);
      }
    }
  }, [pathname]);

  const isScriptStudio = section === "script-studio" || pathname === "/scriptwriter";
  const isTokBoost = pathname === "/tokboost";
  const isTokPrompt = pathname === "/tokprompt";
  const isAnalytics = section === "analytics";
  const isDarkMode = isScriptStudio || isAnalytics || isTokBoost || isTokPrompt;

  const sidebarBg = isDarkMode ? "bg-[#0B0F19]" : "bg-white";
  const textColor = isDarkMode ? ((isScriptStudio || isTokPrompt) ? "text-[#00FFE0]" : "text-[#00D4FF]") : "text-gray-600";
  const hoverBg = isDarkMode ? ((isScriptStudio || isTokPrompt) ? "hover:bg-[#66FFF0]/20" : "hover:bg-[#00D4FF]/20") : "hover:bg-[#00D4FF]/20";
  const activeBg = isDarkMode ? ((isScriptStudio || isTokPrompt) ? "bg-[#00FFE0] text-[#0B0F19]" : "bg-[#00D4FF] text-white") : "bg-[#00D4FF] text-white";
  const iconOutline = isDarkMode ? ((isScriptStudio || isTokPrompt) ? "hover:shadow-[0_0_0_1px_#00FFE0]" : "hover:shadow-[0_0_0_1px_#00D4FF]") : "";

  let navItems = mainNavLinks;
if (isScriptStudio) {
   navItems = [
  { label: "Script Writer", href: "/scriptwriter", icon: PenTool },
  { label: "TokBoost", href: "/tokboost", icon: Layers },
  { label: "TokPrompt", href: "/tokprompt", icon: Clapperboard }
];
} else if (isTokBoost) {
  navItems = [
    { label: "TokBoost", href: "/tokboost", icon: Layers },
    { label: "Analytics", href: "/analytics", icon: LineChart }
  ];
} else if (isTokPrompt) {
  navItems = [
    { label: "TokPrompt", href: "/tokprompt", icon: Clapperboard },
    { label: "Join Session", href: "/tokprompt?access=true", icon: Users },
    { label: "TokBoost", href: "/tokboost", icon: Layers },
    { label: "Script Writer", href: "/scriptwriter", icon: PenTool }
  ];
} else if (section === "stream-prep") {
    navItems = [{ label: "Stream Prep", href: "/stream-prep", icon: Video }];
    if (!subpage) {
      navItems.push(...Object.values(streamPrepSubpages));
    } else if (streamPrepSubpages[subpage]) {
      navItems.push(streamPrepSubpages[subpage]);
    }
  }  
  else if (section === "live-deals") {
    navItems = [{ label: "Live Deals", href: "/live-deals", icon: Flame }];
    if (!subpage) {
      navItems.push(...Object.values(liveDealsSubpages));
    } else if (liveDealsSubpages[subpage]) {
      navItems.push(liveDealsSubpages[subpage]);
    }
  }
  else if (section === "live-tracker") {
    navItems = [{ label: "Live Tracker", href: "/live-tracker", icon: BarChart }];
    if (!subpage) {
      navItems.push(...Object.values(liveTrackerSubpages));
    } else if (liveTrackerSubpages[subpage]) {
      navItems.push(liveTrackerSubpages[subpage]);
    }
  }
  else if (section === "mobile-companion") {
    navItems = [{ label: "Mobile Companion", href: "/mobile-companion", icon: Smartphone }];
    if (!subpage) {
      navItems.push(...Object.values(mobileCompanionSubpages));
    } else if (mobileCompanionSubpages[subpage]) {
      navItems.push(mobileCompanionSubpages[subpage]);
    }
  }
  else if (section === "analytics") {
    navItems = [{ label: "Analytics", href: "/analytics", icon: LineChart }];
    if (!subpage) {
      navItems.push(...Object.values(analyticsSubpages));
    } else if (analyticsSubpages[subpage]) {
      navItems.push(analyticsSubpages[subpage]);
    }
  }
  else if (section === "competitor-tracker") {
    navItems = [{ label: "Competitor Tracker", href: "/competitor-tracker", icon: Users }];
    if (!subpage) {
      navItems.push(...Object.values(competitorTrackerSubpages));
    } else if (competitorTrackerSubpages[subpage]) {
      navItems.push(competitorTrackerSubpages[subpage]);
    }
  }
  else if (section === "affiliate-matchmaker") {
    navItems = [{ label: "Affiliate Matchmaker", href: "/affiliate-matchmaker", icon: UserPlus }];
    if (!subpage) {
      navItems.push(...Object.values(affiliateMatchmakerSubpages));
    } else if (affiliateMatchmakerSubpages[subpage]) {
      navItems.push(affiliateMatchmakerSubpages[subpage]);
    }
  }

  // NEW: Handle help button click based on current page
  const handleHelpClick = () => {
    if (pageHelp?.hasInteractiveTutorials) {
      // Check which page we're on and trigger the right tutorial
      if (pathname === '/dashboard') {
        setShowPageTutorials(true);
      } else if (pathname === '/stream-prep/stream-dash') {
        setShowPageTutorials(true);
      } else if (pathname === '/stream-prep') {
        // Trigger Stream Prep tutorial via custom event
        const event = new CustomEvent('openPageTutorial');
        window.dispatchEvent(event);
      } else if (pathname === '/tokprompt') {
        setShowPageTutorials(true);
      } else {
        // Other tutorial pages
        setShowPageTutorials(true);
      }
      tutorialState.markTutorialCompleted(); // Stop highlighting once they open tutorials
    } else {
      // Other pages - existing behavior (stream prep tour)
      if (typeof window !== "undefined") {
        localStorage.setItem("seenStreamPrepTour", "true");
        localStorage.setItem("streamPrepHelpBadge", "dismissed");
        setShowHelpBadge(false);
        const event = new CustomEvent("triggerStreamPrepTour");
        window.dispatchEvent(event);
      }
    }
  };
  
  const tooltipBase = "absolute left-[60px] top-1/2 -translate-y-1/2 ml-2 px-3 py-1 text-sm font-medium rounded shadow-md whitespace-nowrap transition-opacity duration-200 pointer-events-none";

  // Determine logo redirect based on authentication context - with safety check
  const logoHref = profile?.uid ? '/dashboard' : '/';

  return (
    <div className="min-h-screen overflow-hidden toktics-layout">
   <header className="fixed top-0 left-0 w-full z-[100] bg-white text-[#1e293b] px-6 h-[64px] flex items-center justify-between border-b border-gray-200 shadow-sm toktics-header">
  {/* Left: Logo */}
  <div className="flex items-center gap-3 h-full">
    <Link href={logoHref}>
      <img
        src="/logo-new.png"
        alt="Toktics Logo"
        className="h-10 w-auto object-contain"
      />
    </Link>
  </div>

  {/* Center: Strapline with specific colors - MADE BIGGER */}
  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center text-base font-semibold tracking-wide">
    <span className="text-[#1e293b]">Plan</span>
    <span className="mx-3 text-gray-400">•</span>
    <span className="text-[#00D4FF]">Stream</span>
    <span className="mx-3 text-gray-400">•</span>
    <span className="text-[#1e293b]">Convert</span>
  </div>

  {/* Right: User Menu */}
  <UserMenu />
</header>

      {/* CONDITIONAL SIDEBAR: Only show if NOT on home page */}
      {!isHomePage && (
        <aside className={`w-[60px] fixed top-0 left-0 h-screen flex flex-col justify-between py-4 z-[90] toktics-sidebar ${sidebarBg}`}>
          <div className="mt-[64px] flex flex-col items-center space-y-4">
            {navItems.map(({ href, icon: Icon, label }) => {
              const isInactive = inactiveSubpages.includes(label);
              const isActive = pathname === href || pathname.startsWith(`${href}/`);

              if (isInactive) {
                return (
                  <div
                    key={label}
                    className={`group relative w-10 h-10 flex items-center justify-center rounded-md ${textColor} opacity-50`}
                  >
                    <Icon size={20} />
                    <span className={`${tooltipBase} bg-gray-300 text-gray-700 opacity-0 group-hover:opacity-100`}>
                      {label}
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={href}
                  href={href}
                  className={`group relative w-10 h-10 flex items-center justify-center rounded-md transition-all duration-200
                    ${isActive ? activeBg : `${hoverBg} ${textColor} ${iconOutline}`}`}
                >
                  <Icon size={20} />
                  <span
                    className={`${tooltipBase} ${isDarkMode ? ((isScriptStudio || isTokPrompt) ? "bg-[#00FFE0] text-[#0B0F19]" : "bg-[#00D4FF] text-white") : "bg-[#00D4FF] text-white"} opacity-0 group-hover:opacity-100`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
            
            {/* Admin Panel Link - Only show for company super_admins */}
            {profile?.role === 'super_admin' && profile?.uid && (
              <Link
                href="/admin"
                className={`group relative w-10 h-10 flex items-center justify-center rounded-md transition-all duration-200
                  ${pathname.startsWith('/admin') ? activeBg : `${hoverBg} ${textColor} ${iconOutline}`}`}
              >
                <UserCog size={20} />
                <span
                  className={`${tooltipBase} ${isDarkMode ? ((isScriptStudio || isTokPrompt) ? "bg-[#00FFE0] text-[#0B0F19]" : "bg-[#00D4FF] text-white") : "bg-[#00D4FF] text-white"} opacity-0 group-hover:opacity-100`}
                >
                  Admin Panel
                </span>
              </Link>
            )}
          </div>
          
          <div className="flex flex-col items-center space-y-4 pb-4">
            <button className={`w-10 h-10 flex items-center justify-center rounded-md ${hoverBg} ${textColor}`}>
              <Bell size={20} />
            </button>
            
            {/* UPDATED: Smart help button with page-specific tooltips and highlighting */}
            <button
              onClick={handleHelpClick}
              className={`group relative w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300 ${hoverBg} ${textColor} ${
                tutorialState.shouldHighlightHelp ? 'animate-pulse ring-2 ring-blue-500 ring-opacity-75' : ''
              }`}
            >
              <HelpCircle size={20} className={tutorialState.shouldHighlightHelp ? 'text-blue-500' : ''} />
              {(showHelpBadge || tutorialState.shouldHighlightHelp) && (
                <span className={`absolute -top-1 -right-1 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center ${
                  tutorialState.shouldHighlightHelp ? 'bg-blue-500 animate-bounce' : 'bg-red-600'
                }`}>
                  {tutorialState.shouldHighlightHelp ? '!' : '1'}
                </span>
              )}
                        
              {/* Dynamic tooltip based on current page */}
              <span className={`absolute left-[60px] top-1/2 -translate-y-1/2 ml-2 px-3 py-1 text-sm font-medium rounded shadow-md whitespace-nowrap transition-opacity duration-200 pointer-events-none opacity-0 group-hover:opacity-100 ${isDarkMode ? ((isScriptStudio || isTokPrompt) ? "bg-[#00FFE0] text-[#0B0F19]" : "bg-[#00D4FF] text-white") : "bg-[#00D4FF] text-white"}`}>
                {pageHelp?.hasInteractiveTutorials ? "🎯 Interactive Tutorials" : "Help & Tips"}
  </span>
            </button>
            
            <button 
              onClick={() => setShowFeedbackModal(true)}
              className={`w-10 h-10 flex items-center justify-center rounded-md ${hoverBg} ${textColor} group relative`}
            >
  <Settings size={20} />
  <span className={`absolute left-[60px] top-1/2 -translate-y-1/2 ml-2 px-3 py-1 text-sm font-medium rounded shadow-md whitespace-nowrap transition-opacity duration-200 pointer-events-none opacity-0 group-hover:opacity-100 ${isDarkMode ? ((isScriptStudio || isTokPrompt) ? "bg-[#00FFE0] text-[#0B0F19]" : "bg-[#00D4FF] text-white") : "bg-[#00D4FF] text-white"}`}>
    💬 Send Feedback
  </span>
</button>
          </div>
        </aside>
      )}

      {/* CONDITIONAL MAIN CONTENT: Adjust margin based on sidebar visibility */}
     <main className={`${!isHomePage ? 'ml-[60px]' : 'ml-0'} pt-[64px] min-h-screen overflow-y-auto ${isDarkMode ? "bg-[#0B0F19] text-white" : "bg-gray-50 text-gray-900"} ${isDarkMode ? 'p-0' : 'p-6'}`}>
  {children}
</main>

      {/* NEW: Page-specific tutorial system */}
      {pageHelp?.hasInteractiveTutorials && (
        <>
          {pathname === '/dashboard' ? (
            <DashboardTutorial 
              isOpen={showPageTutorials} 
              onClose={() => setShowPageTutorials(false)} 
            />
          ) : pathname === '/stream-prep/stream-dash' ? (
            <StreamDashHelpSystem 
              isOpen={showPageTutorials} 
              onClose={() => setShowPageTutorials(false)} 
            />
          ) : pathname === '/stream-prep' ? (
            <StreamPrepTutorial 
              isOpen={showPageTutorials} 
              onClose={() => setShowPageTutorials(false)}
              onStepChange={setCurrentTutorialStep}
              currentStep={currentTutorialStep}
            />
          ) : pathname === '/tokprompt' ? (
            <TokPromptHelpSystem 
              isOpen={showPageTutorials} 
              onClose={() => setShowPageTutorials(false)} 
            />
          ) : (
            <StreamDashHelpSystem 
              isOpen={showPageTutorials} 
              onClose={() => setShowPageTutorials(false)} 
            />
          )}
          <FirstTimePopup
            isOpen={tutorialState.showFirstTimePopup}
            onClose={tutorialState.dismissFirstTimePopup}
            onOpenTutorial={() => {
              setShowPageTutorials(true);
              tutorialState.markTutorialCompleted();
            }}
            pageTitle={pageHelp.pageTitle || 'Page'}
          />
  <CookieBanner />
        </>
      )}
      
      {/* Feedback Modal - Always available */}
      <FeedbackModal 
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </div>
  );
}