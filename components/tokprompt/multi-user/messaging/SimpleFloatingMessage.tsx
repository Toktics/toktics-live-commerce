import React, { useState, useEffect } from 'react';
import { X, MessageCircle, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface FloatingMessage {
  id: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number; // milliseconds, 0 for persistent
  createdAt: Date;
  sender?: {
    userId: string;
    userName: string;
  };
}

interface SimpleFloatingMessageProps {
  messages: FloatingMessage[];
  onDismiss: (messageId: string) => void;
  userRole: 'controller' | 'viewer';
}

export const SimpleFloatingMessage: React.FC<SimpleFloatingMessageProps> = ({
  messages,
  onDismiss,
  userRole
}) => {
  if (!messages || messages.length === 0) return null;

  const getMessageIcon = (type: FloatingMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getMessageColors = (type: FloatingMessage['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-900/90 border-green-500/50 text-green-100';
      case 'warning':
        return 'bg-yellow-900/90 border-yellow-500/50 text-yellow-100';
      case 'error':
        return 'bg-red-900/90 border-red-500/50 text-red-100';
      default:
        return 'bg-blue-900/90 border-blue-500/50 text-blue-100';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`
            ${getMessageColors(message.type)}
            border rounded-lg p-3 shadow-lg backdrop-blur-sm
            animate-in slide-in-from-right-2 duration-300
          `}
        >
          <div className="flex items-start gap-3">
            {getMessageIcon(message.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium break-words">
                {message.content}
              </p>
              {message.sender && (
                <p className="text-xs opacity-75 mt-1">
                  From: {message.sender.userName}
                </p>
              )}
              <p className="text-xs opacity-60 mt-1">
                {message.createdAt.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => onDismiss(message.id)}
              className="text-white/60 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
              title="Dismiss message"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Custom hook for managing floating messages
export const useSimpleFloatingMessages = (sessionState: any) => {
  const [messages, setMessages] = useState<FloatingMessage[]>([]);

  // Listen for new messages from session state
  useEffect(() => {
    if (!sessionState?.liveMessages?.queue) return;
    
    const newMessages = sessionState.liveMessages.queue
      .filter((msg: any) => !messages.find(existing => existing.id === msg.id))
      .map((msg: any) => ({
        id: msg.id || Date.now().toString(),
        content: msg.content,
        type: msg.type || 'info',
        duration: msg.duration || 5000,
        createdAt: msg.createdAt?.toDate() || new Date(),
        sender: msg.sender
      }));
    
    if (newMessages.length > 0) {
      setMessages(prev => [...prev, ...newMessages]);
      
      // Auto-dismiss messages with duration
      newMessages.forEach(msg => {
        if (msg.duration && msg.duration > 0) {
          setTimeout(() => {
            dismissMessage(msg.id);
          }, msg.duration);
        }
      });
    }
  }, [sessionState?.liveMessages?.queue]);

  const dismissMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const addMessage = (content: string, type: FloatingMessage['type'] = 'info', duration = 5000) => {
    const newMessage: FloatingMessage = {
      id: Date.now().toString(),
      content,
      type,
      duration,
      createdAt: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    if (duration > 0) {
      setTimeout(() => dismissMessage(newMessage.id), duration);
    }
    
    return newMessage.id;
  };

  return {
    messages,
    dismissMessage,
    addMessage
  };
};