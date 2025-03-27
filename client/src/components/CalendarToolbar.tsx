import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewMode } from '@/lib/types';

interface CalendarToolbarProps {
  currentDate: string;
  viewMode: ViewMode;
  onPrevious: () => void;
  onNext: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onNewBooking: () => void;
}

export default function CalendarToolbar({ 
  currentDate, 
  viewMode, 
  onPrevious, 
  onNext, 
  onViewModeChange,
  onNewBooking
}: CalendarToolbarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center justify-between sm:justify-start">
        <button 
          className="p-2 rounded-md hover:bg-gray-100"
          onClick={onPrevious}
        >
          <ChevronLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h2 className="text-lg font-medium px-2">
          {currentDate}
        </h2>
        <button 
          className="p-2 rounded-md hover:bg-gray-100"
          onClick={onNext}
        >
          <ChevronRight className="h-5 w-5 text-gray-500" />
        </button>
      </div>
      <div className="mt-3 sm:mt-0 flex items-center space-x-2">
        <button className="px-3 py-1 text-sm rounded-md border border-gray-300 hover:bg-gray-100">Today</button>
        <div className="bg-gray-200 rounded-md p-1 flex">
          <button 
            className={`px-3 py-1 text-sm ${viewMode === 'day' ? 'bg-white rounded shadow' : 'hover:bg-gray-100'}`}
            onClick={() => onViewModeChange('day')}
          >
            Day
          </button>
          <button 
            className={`px-3 py-1 text-sm ${viewMode === 'week' ? 'bg-white rounded shadow' : 'hover:bg-gray-100'}`}
            onClick={() => onViewModeChange('week')}
          >
            Week
          </button>
          <button 
            className={`px-3 py-1 text-sm ${viewMode === 'month' ? 'bg-white rounded shadow' : 'hover:bg-gray-100'}`}
            onClick={() => onViewModeChange('month')}
          >
            Month
          </button>
        </div>
      </div>
    </div>
  );
}
