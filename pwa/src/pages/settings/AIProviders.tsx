import React from 'react';
import { AISettings } from '../../components/AISettings';
import { useNavigate } from 'react-router-dom';

const AIProvidersPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-background">
      <AISettings onClose={() => navigate('/settings')} />
    </div>
  );
};

export default AIProvidersPage;
