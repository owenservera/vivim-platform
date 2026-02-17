import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { conversationService } from '../lib/service/conversation-service';
import { FullScreenConversation, IOSTopBar, IOSErrorState } from '../components/ios';
import { logger } from '../lib/logger';
import type { Conversation } from '../types/conversation';
import type { AIAction } from '../types/features';

export const ConversationView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);

  useEffect(() => {
    const loadConversation = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await conversationService.getConversation(id);
        if (data) {
          setConversation(data);
        } else {
          setError('Conversation not found');
        }
      } catch (err) {
        logger.error('Failed to load conversation', { error: err });
        setError('Failed to load conversation details');
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [id]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!conversation || !id) return;
    
    try {
      setIsAILoading(true);
      const updatedMessages = [
        ...conversation.messages,
        {
          id: `temp-${Date.now()}`,
          role: 'user' as const,
          content: message,
          createdAt: new Date().toISOString(),
        }
      ];
      
      setConversation(prev => prev ? { ...prev, messages: updatedMessages } : null);
      
      logger.info('ConversationView', 'Sending message to AI', { conversationId: id, message });
      
    } catch (err) {
      logger.error('Failed to send message', { error: err });
      setError('Failed to send message');
    } finally {
      setIsAILoading(false);
    }
  }, [conversation, id]);

  const handleAIClick = useCallback((action: AIAction) => {
    logger.info('ConversationView', 'AI action clicked', { action, conversationId: id });
    
    switch (action) {
      case 'continue_chat':
        break;
      case 'share':
        navigate(`/share/${id}`);
        break;
      case 'fork':
        logger.info('ConversationView', 'Fork action not yet implemented');
        break;
      case 'export':
        logger.info('ConversationView', 'Export action not yet implemented');
        break;
      default:
        logger.warn('ConversationView', 'Unknown AI action', { action });
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white dark:bg-gray-950">
        <IOSTopBar showBackButton onBack={handleBack} />
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">Loading intelligence...</p>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col bg-white dark:bg-gray-950">
        <IOSTopBar showBackButton onBack={handleBack} />
        <div className="flex-1 flex items-center justify-center">
          <IOSErrorState 
            type={error?.includes('not found') ? 'not-found' : 'generic'}
            title={error || 'Unavailable'}
            action={{ label: 'Go Back', onClick: handleBack }}
          />
        </div>
      </div>
    );
  }

  return (
    <FullScreenConversation
      conversation={conversation}
      onBack={handleBack}
      onSendMessage={handleSendMessage}
      onAIClick={handleAIClick}
      isLoading={isAILoading}
    />
  );
};

export default ConversationView;
