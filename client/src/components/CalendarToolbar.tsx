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
    <div className="bg-background border-b border-border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center justify-between sm:justify-start">
        <button 
          className="p-2 rounded-md hover:bg-muted"
          onClick={onPrevious}
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <h2 className="text-lg font-medium px-2">
          {currentDate}
        </h2>
        <button 
          className="p-2 rounded-md hover:bg-muted"
          onClick={onNext}
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
      <div className="mt-3 sm:mt-0 flex items-center space-x-2">
        <button className="px-3 py-1 text-sm rounded-md border border-border hover:bg-muted">Today</button>
        <div className="bg-muted rounded-md p-1 flex">
          <button 
            className={`px-3 py-1 text-sm ${viewMode === 'day' ? 'bg-background rounded shadow-sm' : 'hover:bg-background/50'}`}
            onClick={() => onViewModeChange('day')}
          >
            Day
          </button>
          <button 
            className={`px-3 py-1 text-sm ${viewMode === 'week' ? 'bg-background rounded shadow-sm' : 'hover:bg-background/50'}`}
            onClick={() => onViewModeChange('week')}
          >
            Week
          </button>
          <button 
            className={`px-3 py-1 text-sm ${viewMode === 'month' ? 'bg-background rounded shadow-sm' : 'hover:bg-background/50'}`}
            onClick={() => onViewModeChange('month')}
          >
            Month
          </button>
        </div>
      </div>
    </div>
  );
}
