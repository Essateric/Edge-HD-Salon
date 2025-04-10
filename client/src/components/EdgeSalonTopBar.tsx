import React from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays, Printer, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { format } from "date-fns";

interface EdgeSalonTopBarProps {
  currentDate?: Date;
  onPrevious?: () => void;
  onNext?: () => void;
  onToday?: () => void;
}

export default function EdgeSalonTopBar({
  currentDate = new Date(),
  onPrevious,
  onNext,
  onToday
}: EdgeSalonTopBarProps) {
  // Format the current date in the format "Today, 2 Apr"
  const formattedDate = format(currentDate, "'Today,' d MMM");
  
  return (
    <div className="w-full bg-white shadow flex items-center justify-between px-4 py-2 border-b">
      {/* Left-side: Hamburger */}
      <div className="flex items-center">
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Center Controls */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" onClick={onPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="default" onClick={onToday}>
            {formattedDate}
          </Button>
          <Button variant="ghost" size="icon" onClick={onNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right side: Reserved for actions */}
      <div className="flex items-center space-x-2">
        {/* Placeholder for future buttons */}
      </div>
    </div>
  );
}