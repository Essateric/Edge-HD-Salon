import { Stylist } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface StylistHeaderProps {
  stylists: Stylist[];
}

export default function StylistHeader({ stylists }: StylistHeaderProps) {
  // Each column should have a fixed minimum width
  const minColumnWidth = '250px';
  
  return (
    <div className="flex border-b border-border sticky top-0 bg-background z-10" style={{ minWidth: 'fit-content', width: '100%' }}>
      <div className="w-20 md:w-28 flex-shrink-0 border-r border-border"></div>
      {stylists.map((stylist) => (
        <div 
          key={stylist.id} 
          className="stylist-column flex-1 border-r border-border"
          style={{ minWidth: minColumnWidth }}
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
