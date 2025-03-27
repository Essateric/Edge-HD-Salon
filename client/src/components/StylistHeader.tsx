import { Stylist } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface StylistHeaderProps {
  stylists: Stylist[];
}

export default function StylistHeader({ stylists }: StylistHeaderProps) {
  // Calculate column width - same as in TimeSlots component
  const getColumnWidth = () => {
    // Equal width for all columns
    return `calc((100% - 20px) / ${stylists.length})`;
  };
  
  return (
    <div className="flex border-b border-border sticky top-0 bg-background z-10">
      <div className="w-20 md:w-28 flex-shrink-0 border-r border-border"></div>
      {stylists.map((stylist) => (
        <div 
          key={stylist.id} 
          className="stylist-column flex-shrink-0 border-r border-border"
          style={{ width: getColumnWidth() }}
        >
          <div className="p-3 flex flex-col items-center">
            <Avatar className="w-12 h-12 mb-1">
              <AvatarImage src={stylist.imageUrl} alt={stylist.name} />
              <AvatarFallback className="bg-[#B08D57] text-white">{stylist.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{stylist.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
