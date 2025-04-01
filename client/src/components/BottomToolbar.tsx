import { Printer, Filter, LayoutGrid, Clipboard, Bell } from 'lucide-react';
import { ViewMode } from '@/lib/types';

interface BottomToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  currentUser?: any;
}

export default function BottomToolbar({ viewMode, onViewModeChange, currentUser }: BottomToolbarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border flex justify-around py-2 px-4">
      <button className="flex flex-col items-center px-3 py-1 text-muted-foreground hover:text-foreground">
        <Printer className="h-6 w-6" />
        <span className="text-xs mt-1">Print</span>
      </button>
      <button className="flex flex-col items-center px-3 py-1 text-muted-foreground hover:text-foreground">
        <Filter className="h-6 w-6" />
        <span className="text-xs mt-1">Filter</span>
      </button>
      <button 
        className={`flex flex-col items-center px-3 py-1 ${viewMode === 'week' ? 'text-[#B08D57]' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={() => onViewModeChange('week')}
      >
        <LayoutGrid className="h-6 w-6" />
        <span className="text-xs mt-1">Week View</span>
      </button>
      <button className="flex flex-col items-center px-3 py-1 text-[#B08D57] relative">
        <div className="absolute -top-1 -right-1 h-5 w-5 bg-[#B08D57] rounded-full text-white text-xs flex items-center justify-center">3</div>
        <Clipboard className="h-6 w-6" />
        <span className="text-xs mt-1">Task</span>
      </button>
    </div>
  );
}
