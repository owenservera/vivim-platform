export const getProviderAccentConfig = (provider: string = 'unknown') => {
  const p = provider.toLowerCase();
  
  if (p.includes('openai') || p.includes('gpt')) {
    return {
      name: 'OpenAI',
      bgClass: 'bg-[#10a37f]',
      textClass: 'text-[#10a37f]',
      borderClass: 'border-[#10a37f]',
      shadowClass: 'shadow-[#10a37f]/20',
      hex: '#10a37f'
    };
  }
  if (p.includes('anthropic') || p.includes('claude')) {
    return {
      name: 'Anthropic',
      bgClass: 'bg-[#d97757]',
      textClass: 'text-[#d97757]',
      borderClass: 'border-[#d97757]',
      shadowClass: 'shadow-[#d97757]/20',
      hex: '#d97757'
    };
  }
  if (p.includes('google') || p.includes('gemini')) {
    return {
      name: 'Google',
      bgClass: 'bg-[#4285f4]',
      textClass: 'text-[#4285f4]',
      borderClass: 'border-[#4285f4]',
      shadowClass: 'shadow-[#4285f4]/20',
      hex: '#4285f4'
    };
  }
  if (p.includes('meta') || p.includes('llama')) {
    return {
      name: 'Meta',
      bgClass: 'bg-[#0668E1]',
      textClass: 'text-[#0668E1]',
      borderClass: 'border-[#0668E1]',
      shadowClass: 'shadow-[#0668E1]/20',
      hex: '#0668E1'
    };
  }
  if (p.includes('mistral')) {
    return {
      name: 'Mistral',
      bgClass: 'bg-[#f3a953]',
      textClass: 'text-[#f3a953]',
      borderClass: 'border-[#f3a953]',
      shadowClass: 'shadow-[#f3a953]/20',
      hex: '#f3a953'
    };
  }
  
  // Default / System / Unknown
  return {
    name: provider || 'System',
    bgClass: 'bg-indigo-500',
    textClass: 'text-indigo-500',
    borderClass: 'border-indigo-500',
    shadowClass: 'shadow-indigo-500/20',
    hex: '#6366f1' // Tailwind Indigo-500
  };
};
