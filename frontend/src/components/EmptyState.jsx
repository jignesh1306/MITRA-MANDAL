import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({ title = 'No Data Available', message = 'There are no records to show at this moment.' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
      <div className="p-3 bg-white rounded-full shadow-xs mb-3 text-gray-400">
        <Inbox className="w-8 h-8" />
      </div>
      <h4 className="text-sm font-bold text-gray-900 mb-1">{title}</h4>
      <p className="text-xs text-gray-500 max-w-xs">{message}</p>
    </div>
  );
};
