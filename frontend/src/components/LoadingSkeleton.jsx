import React from 'react';

export const LoadingSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-3 w-full animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-20 bg-gray-200/80 rounded-2xl w-full" />
      ))}
    </div>
  );
};
