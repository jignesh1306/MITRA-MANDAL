import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const BackButton = ({ to, fallback = '/', label = 'Back', className = '' }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // If 'to' is explicitly passed or label mentions 'Home', navigate directly to that route
    if (to) {
      return navigate(to);
    }
    if (label.toLowerCase().includes('home')) {
      return navigate('/');
    }
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 hover:text-brand-700 rounded-xl border border-gray-200 shadow-2xs transition-all hover:scale-102 active:scale-98 cursor-pointer ${className}`}
    >
      <ArrowLeft className="w-4 h-4 text-brand-600" />
      <span>{label}</span>
    </button>
  );
};
