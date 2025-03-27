import { Printer, Filter, LayoutGrid, Clipboard, Bell } from 'lucide-react';
import { ViewMode } from '@/lib/types';

interface BottomToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function BottomToolbar({ viewMode, onViewModeChange }: BottomToolbarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 px-4">
      <button className="flex flex-col items-center px-3 py-1 text-gray-600">
        <Printer className="h-6 w-6" />
        <span className="text-xs mt-1">Print</span>
      </button>
      <button className="flex flex-col items-center px-3 py-1 text-gray-600">
        <Filter className="h-6 w-6" />
        <span className="text-xs mt-1">Filter</span>
      </button>
      <button 
        className={`flex flex-col items-center px-3 py-1 ${viewMode === 'week' ? 'text-primary' : 'text-gray-600'}`}
        onClick={() => onViewModeChange('week')}
      >
        <LayoutGrid className="h-6 w-6" />
        <span className="text-xs mt-1">Week View</span>
      </button>
      <button className="flex flex-col items-center px-3 py-1 text-primary relative">
        <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">3</div>
        <Clipboard className="h-6 w-6" />
        <span className="text-xs mt-1">Task</span>
      </button>
    </div>
  );
}
