import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { conversationService } from '../lib/service/conversation-service';
import { FullScreenConversation } from '../components/ios';
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
    if (!conversation) return;
    
    const newMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString(),
    };

    setConversation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...(prev.messages || []), newMessage],
        stats: {
          ...prev.stats,
          totalMessages: (prev.stats?.totalMessages || 0) + 1,
        }
      };
    });

    setIsAILoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const aiResponse = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: `This is a simulated AI response to: "${message}"\n\nIn the full implementation, this would connect to your AI backend and stream the response.`,
        timestamp: new Date().toISOString(),
      };

      setConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), aiResponse],
          stats: {
            ...prev.stats,
            totalMessages: (prev.stats?.totalMessages || 0) + 1,
          }
        };
      });
    } catch (err) {
      logger.error('AI response failed', { error: err });
    } finally {
      setIsAILoading(false);
    }
  }, [conversation]);

  const handleAIClick = useCallback(async (action: AIAction) => {
    if (!conversation) return;
    
    logger.info('AI action clicked', { action, conversationId: conversation.id });
    
    if (action === 'continue_chat') {
      return;
    }

    setIsAILoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const responses: Record<AIAction, string> = {
        summarize: `Summary of "${conversation.title}":\n\nThis conversation contains ${conversation.stats?.totalMessages || 0} messages discussing various topics. The main points include key insights about the subject matter.`,
        expand: `Expanded analysis of "${conversation.title}":\n\nBuilding upon the original conversation, here are additional considerations and deeper insights that expand on the core concepts discussed.`,
        simplify: `Simplified explanation:\n\nThe conversation is about understanding ${conversation.title} in simple terms. The key takeaway is that complex ideas can be broken down into manageable pieces.`,
        translate: `[Translation would appear here based on selected language]`,
        extract_insights: `Key Insights:\n• Main concept: Understanding ${conversation.title}\n• Key learning: Practical applications\n• Next steps: Implementation strategies`,
        generate_title: `Suggested titles:\n1. "Understanding ${conversation.title}"\n2. "Guide to ${conversation.title}"\n3. "Essential ${conversation.title} Concepts"`,
        generate_questions: `Study Questions:\n1. What is the main topic?\n2. How can you apply this?\n3. What are the key benefits?`,
        find_related: 'Related conversations would be listed here.',
        check_contradictions: 'No contradictions found in this conversation.',
        continue_chat: '',
        switch_model: 'Model switching options:\n• GPT-4\n• Claude 3\n• Gemini Pro',
        compare_models: 'Model comparison would show responses from multiple models.',
      };

      const aiResponse = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: responses[action] || 'Action completed.',
        timestamp: new Date().toISOString(),
      };

      setConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), aiResponse],
          stats: {
            ...prev.stats,
            totalMessages: (prev.stats?.totalMessages || 0) + 1,
          }
        };
      });
    } catch (err) {
      logger.error('AI action failed', { error: err, action });
    } finally {
      setIsAILoading(false);
    }
  }, [conversation]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white dark:bg-gray-950">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">Loading conversation...</p>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white dark:bg-gray-950 p-8">
        <div className="text-red-500 text-xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-gray-500 mb-6 text-center">{error || 'Conversation not found'}</p>
        <button
          onClick={handleBack}
          className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
        >
          Go Back
        </button>
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
