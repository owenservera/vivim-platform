import React, { useState } from 'react';
import { 
  Sparkles, 
  Text, 
  Maximize2, 
  Minimize2, 
  Languages, 
  Lightbulb,
  Type,
  HelpCircle,
  GitBranch,
  ShieldCheck,
  MessageSquarePlus,
  Zap,
  Columns,
  X,
  Loader2,
  Check
} from 'lucide-react';
import { IOSCard, IOSButton } from './index';
import { useIOSToast, toast } from './Toast';
import { cn } from '../../lib/utils';
import type { AIAction, AIResult } from '../../types/features';

interface AIActionsPanelProps {
  conversationId: string;
  conversationTitle: string;
  conversationContent: string;
  open: boolean;
  onClose: () => void;
  onResult?: (result: AIResult) => void;
}

export const AIActionsPanel: React.FC<AIActionsPanelProps> = ({
  conversationId,
  conversationTitle,
  conversationContent,
  open,
  onClose,
  onResult,
}) => {
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const { toast: showToast } = useIOSToast();

  const actions: { id: AIAction; label: string; icon: React.ReactNode; description: string }[] = [
    {
      id: 'summarize',
      label: 'Summarize',
      icon: <Text className="w-5 h-5" />,
      description: 'Generate a concise summary',
    },
    {
      id: 'expand',
      label: 'Expand',
      icon: <Maximize2 className="w-5 h-5" />,
      description: 'Elaborate on key points',
    },
    {
      id: 'simplify',
      label: 'Simplify',
      icon: <Minimize2 className="w-5 h-5" />,
      description: 'Make it easier to understand',
    },
    {
      id: 'translate',
      label: 'Translate',
      icon: <Languages className="w-5 h-5" />,
      description: 'Convert to another language',
    },
    {
      id: 'extract_insights',
      label: 'Extract Insights',
      icon: <Lightbulb className="w-5 h-5" />,
      description: 'Pull out key takeaways',
    },
    {
      id: 'generate_title',
      label: 'Generate Title',
      icon: <Type className="w-5 h-5" />,
      description: 'Auto-generate a better title',
    },
    {
      id: 'generate_questions',
      label: 'Study Questions',
      icon: <HelpCircle className="w-5 h-5" />,
      description: 'Create questions for review',
    },
    {
      id: 'find_related',
      label: 'Find Related',
      icon: <GitBranch className="w-5 h-5" />,
      description: 'Discover similar conversations',
    },
    {
      id: 'check_contradictions',
      label: 'Check Facts',
      icon: <ShieldCheck className="w-5 h-5" />,
      description: 'Validate claims',
    },
    {
      id: 'continue_chat',
      label: 'Continue Chat',
      icon: <MessageSquarePlus className="w-5 h-5" />,
      description: 'Resume the conversation',
    },
    {
      id: 'switch_model',
      label: 'Switch Model',
      icon: <Zap className="w-5 h-5" />,
      description: 'Continue with different AI',
    },
    {
      id: 'compare_models',
      label: 'Compare Models',
      icon: <Columns className="w-5 h-5" />,
      description: 'Run across multiple AIs',
    },
  ];

  const handleAction = async (action: AIAction) => {
    setActiveAction(action);
    setIsProcessing(true);
    setResult(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockResult: AIResult = {
        action,
        content: generateMockResult(action, conversationTitle),
        metadata: {
          model: 'gpt-4',
          tokens: Math.floor(Math.random() * 500) + 100,
          confidence: 0.92,
        },
        createdAt: new Date().toISOString(),
      };

      setResult(mockResult);
      onResult?.(mockResult);
      showToast(toast.success(`${action.replace('_', ' ')} completed`));
    } catch (error) {
      showToast(toast.error('AI action failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const generateMockResult = (action: AIAction, title: string): string => {
    const results: Record<AIAction, string> = {
      summarize: `This conversation explores key concepts related to "${title}". The main points covered include fundamental principles, practical applications, and potential implications for future development.`,
      expand: `Building on "${title}", we can explore several related dimensions:\n\n1. Historical context and evolution\n2. Current state-of-the-art approaches\n3. Emerging trends and future directions\n4. Practical implementation strategies`,
      simplify: `In simple terms, "${title}" can be understood as:\n\n- A foundational concept in the field\n- Something that builds on established principles\n- Relevant to both beginners and experts`,
      translate: `[Translation would appear here based on selected target language]`,
      extract_insights: `Key Insights from "${title}":\n\n• Critical factor: Understanding core concepts\n• Opportunity: Applying knowledge practically\n• Challenge: Balancing theory with implementation`,
      generate_title: `Suggested titles:\n1. "${title}: A Comprehensive Analysis"\n2. "Understanding ${title.split(' ').slice(0, 3).join(' ')}"\n3. "The Essential Guide to ${title.split(' ').slice(0, 2).join(' ')}"`,
      generate_questions: `Study Questions:\n\n1. What are the core principles discussed?\n2. How can these concepts be applied?\n3. What are the potential limitations?`,
      find_related: `Found 3 related conversations:\n• Similar topic from last week\n• Complementary perspective\n• Follow-up discussion`,
      check_contradictions: `Fact Check Results:\n✓ Claims appear consistent\n✓ Sources align with established knowledge\n⚠ One statement may need verification`,
      continue_chat: `The conversation has been prepared for continuation. Click "Start Chat" to resume.`,
      switch_model: `Model switching options:\n• GPT-4 (current)\n• Claude 3\n• Gemini Pro`,
      compare_models: `Comparison setup ready. Select models to compare responses.`,
    };
    return results[action] || 'Action completed successfully';
  };

  const handleCopy = async () => {
    if (result?.content) {
      await navigator.clipboard.writeText(result.content);
      showToast(toast.success('Copied to clipboard'));
    }
  };

  const handleUseResult = () => {
    showToast(toast.success('Applied to conversation'));
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <IOSCard 
        variant="elevated" 
        padding="lg" 
        className="relative w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Actions
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                {conversationTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {result ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-5 h-5 text-green-500" />
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {activeAction?.replace('_', ' ')}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans">
                {result.content}
              </pre>
            </div>

            {result.metadata && (
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                <span>Model: {result.metadata.model}</span>
                <span>Tokens: {result.metadata.tokens}</span>
                <span>Confidence: {Math.round((result.metadata.confidence || 0) * 100)}%</span>
              </div>
            )}

            <div className="flex gap-3 shrink-0">
              <IOSButton variant="secondary" onClick={() => setResult(null)} fullWidth>
                Back
              </IOSButton>
              <IOSButton variant="secondary" onClick={handleCopy} fullWidth icon={<Text className="w-4 h-4" />}>
                Copy
              </IOSButton>
              <IOSButton variant="primary" onClick={handleUseResult} fullWidth>
                Apply
              </IOSButton>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto -mx-4 px-4">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
                  <p className="text-gray-600 dark:text-gray-300 font-medium capitalize">
                    {activeAction?.replace('_', ' ')}...
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Processing with AI
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleAction(action.id)}
                      className={cn(
                        'flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left',
                        'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700',
                        'hover:bg-purple-50 dark:hover:bg-purple-900/10'
                      )}
                    >
                      <div className="text-purple-600 dark:text-purple-400">
                        {action.icon}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {action.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {action.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </IOSCard>
    </div>
  );
};

export default AIActionsPanel;
