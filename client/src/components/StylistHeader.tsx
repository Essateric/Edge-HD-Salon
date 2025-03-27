import { Stylist } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface StylistHeaderProps {
  stylists: Stylist[];
}

export default function StylistHeader({ stylists }: StylistHeaderProps) {
  return (
    <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
      <div className="w-16 flex-shrink-0 border-r border-gray-200"></div>
      {stylists.map((stylist) => (
        <div key={stylist.id} className="stylist-column flex-shrink-0 border-r border-gray-200">
          <div className="p-3 flex flex-col items-center">
            <Avatar className="w-12 h-12 mb-1">
              <AvatarImage src={stylist.imageUrl} alt={stylist.name} />
              <AvatarFallback>{stylist.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{stylist.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
