import { useState } from 'react';
import { Link } from 'wouter';
import { Calendar, ClipboardList, Scissors } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import edgeLogo from '@assets/edgeicon_1024.png';

export default function Home() {
  return (
    <div className="flex flex-col h-full w-full overflow-auto p-6">
      <div className="flex flex-col items-center mb-8">
        <img src={edgeLogo} alt="The Edge Salon Logo" className="h-24 w-24 mb-4" />
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4B78E] to-[#8B734A] mb-2">
          The Edge Salon
        </h1>
        <p className="text-gray-400 text-lg max-w-md text-center">
          Salon Management Dashboard
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <Card className="bg-gradient-to-br from-[#1c1c1c] to-[#2c2c2c] border border-[#3c3c3c] shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-[#D4B78E] to-[#8B734A]">
              <Calendar className="h-5 w-5 text-[#B08D57]" />
              Calendar View
            </CardTitle>
            <CardDescription>
              View and manage daily appointments across all stylists
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400">
              Interactive calendar with drag-and-drop functionality. Easily visualize and reorganize your salon's schedule.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/calendar">
              <Button className="bg-gradient-to-r from-[#B08D57] to-[#8B734A] hover:from-[#C19E68] hover:to-[#9C8459] w-full">
                Open Calendar
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card className="bg-gradient-to-br from-[#1c1c1c] to-[#2c2c2c] border border-[#3c3c3c] shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-[#D4B78E] to-[#8B734A]">
              <ClipboardList className="h-5 w-5 text-[#B08D57]" />
              Appointments
            </CardTitle>
            <CardDescription>
              Manage all appointments and bookings in one place
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400">
              Confirm, reschedule, or cancel appointments. Search for customers and manage their booking details.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/appointments">
              <Button className="bg-gradient-to-r from-[#B08D57] to-[#8B734A] hover:from-[#C19E68] hover:to-[#9C8459] w-full">
                View Appointments
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card className="bg-gradient-to-br from-[#1c1c1c] to-[#2c2c2c] border border-[#3c3c3c] shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-[#D4B78E] to-[#8B734A]">
              <Scissors className="h-5 w-5 text-[#B08D57]" />
              Services
            </CardTitle>
            <CardDescription>
              Manage your salon's service offerings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400">
              Add, edit, or remove services. Set pricing, duration, and assign services to stylists.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/services">
              <Button className="bg-gradient-to-r from-[#B08D57] to-[#8B734A] hover:from-[#C19E68] hover:to-[#9C8459] w-full">
                Manage Services
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
