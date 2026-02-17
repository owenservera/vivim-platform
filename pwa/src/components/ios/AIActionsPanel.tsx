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
      description: 'Generate concise summary',
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
      description: 'Make easier to understand',
    },
    {
      id: 'translate',
      label: 'Translate',
      icon: <Languages className="w-5 h-5" />,
      description: 'Convert language',
    },
    {
      id: 'extract_insights',
      label: 'Insights',
      icon: <Lightbulb className="w-5 h-5" />,
      description: 'Pull key takeaways',
    },
    {
      id: 'generate_title',
      label: 'Title',
      icon: <Type className="w-5 h-5" />,
      description: 'Better auto-title',
    },
    {
      id: 'generate_questions',
      label: 'Questions',
      icon: <HelpCircle className="w-5 h-5" />,
      description: 'Study questions',
    },
    {
      id: 'find_related',
      label: 'Related',
      icon: <GitBranch className="w-5 h-5" />,
      description: 'Similar chats',
    },
    {
      id: 'check_contradictions',
      label: 'Fact Check',
      icon: <ShieldCheck className="w-5 h-5" />,
      description: 'Validate claims',
    },
    {
      id: 'continue_chat',
      label: 'Resume',
      icon: <MessageSquarePlus className="w-5 h-5" />,
      description: 'Keep chatting',
    },
    {
      id: 'switch_model',
      label: 'Model',
      icon: <Zap className="w-5 h-5" />,
      description: 'Change AI',
    },
    {
      id: 'compare_models',
      label: 'Compare',
      icon: <Columns className="w-5 h-5" />,
      description: 'Multiple AIs',
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
    <div className="fixed inset-0 z-[1060] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />
      
      <IOSCard 
        variant="elevated" 
        padding="none" 
        className="relative w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col rounded-3xl shadow-2xl border border-white/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                AI Intelligence
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {conversationTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {result ? (
          <div className="flex-1 overflow-hidden flex flex-col p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-green-500" />
              </div>
              <span className="font-semibold text-sm text-gray-900 dark:text-white capitalize">
                {activeAction?.replace('_', ' ')} Result
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black/40 rounded-2xl p-4 mb-5 border border-gray-100 dark:border-gray-800 ios-scrollbar-thin">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                {result.content}
              </pre>
            </div>

            {result.metadata && (
              <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-5 px-1">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {result.metadata.model}</span>
                <span>{result.metadata.tokens} Tokens</span>
                <span>{Math.round((result.metadata.confidence || 0) * 100)}% Match</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 shrink-0">
              <IOSButton variant="secondary" onClick={() => setResult(null)} fullWidth>
                Back
              </IOSButton>
              <IOSButton variant="primary" onClick={handleUseResult} fullWidth>
                Apply
              </IOSButton>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 ios-scrollbar-hide">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
                  <Loader2 className="w-12 h-12 text-purple-500 animate-spin relative" />
                </div>
                <p className="text-gray-900 dark:text-white font-bold mt-6 capitalize text-lg">
                  {activeAction?.replace('_', ' ')}...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Synchronizing with neural engine
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-2">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    className={cn(
                      'flex flex-col items-start gap-2 p-4 rounded-2xl border-2 transition-all text-left group',
                      'border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-900/50',
                      'hover:bg-purple-50/50 dark:hover:bg-purple-900/10 active:scale-[0.98]'
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:bg-white dark:group-hover:bg-gray-700 transition-colors">
                      {action.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                        {action.label}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                        {action.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </IOSCard>
    </div>
  );
};

export default AIActionsPanel;
