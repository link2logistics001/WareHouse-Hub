'use client'
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, AlertCircle, CheckCircle, Lock } from 'lucide-react';

export default function Availability() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Mock Booking Data
  const bookings = [
    { id: 1, name: 'FreshMart Lease', start: 5, end: 15, color: 'bg-red-100 text-red-700 border-red-200' },
    { id: 2, name: 'Maintenance', start: 22, end: 24, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  ];

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const prevMonth = () => setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));

  // Helper to check if a day has a booking
  const getBooking = (day) => {
    return bookings.find(b => day >= b.start && day <= b.end);
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Availability Calendar</h1>
          <p className="text-slate-500">Manage bookings and block dates for maintenance.</p>
        </div>
        
        {/* Stats Summary */}
        <div className="flex gap-4">
           <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Available</p>
                <p className="font-bold text-slate-900">18 Days</p>
              </div>
           </div>
           <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Booked</p>
                <p className="font-bold text-slate-900">12 Days</p>
              </div>
           </div>
        </div>
      </div>

      {/* THE CALENDAR UI */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Calendar Controls */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CalIcon className="w-5 h-5 text-orange-600" />
              {monthName} {year}
            </h2>
          </div>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 auto-rows-[120px]">
          
          {/* Empty Cells for previous month */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r border-slate-100 bg-slate-50/30"></div>
          ))}

          {/* Actual Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const booking = getBooking(day);

            return (
              <div key={day} className="relative border-b border-r border-slate-100 p-3 hover:bg-slate-50 transition-colors group">
                <span className={`text-sm font-semibold ${booking ? 'text-slate-400' : 'text-slate-700'}`}>
                  {day}
                </span>

                {/* Status Indicator */}
                {!booking && (
                  <div className="mt-2">
                     <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium bg-green-50 px-2 py-1 rounded w-fit opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCircle className="w-3 h-3" /> Open
                     </div>
                  </div>
                )}

                {/* Booking Bar */}
                {booking && (
                  <div className={`mt-2 p-2 rounded-lg text-xs font-medium border ${booking.color} shadow-sm`}>
                    <p className="truncate">{booking.name}</p>
                    {day === booking.start && <span className="text-[10px] opacity-75">Starts Today</span>}
                  </div>
                )}

                {/* Add Block Button (Hover) */}
                {!booking && (
                   <button className="absolute bottom-2 right-2 p-1.5 bg-slate-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-lg">
                      <Lock className="w-3 h-3" />
                   </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-6 flex items-center gap-6 text-sm text-slate-500">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div> Booked Lease</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></div> Maintenance</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-white border border-slate-200"></div> Available</div>
      </div>

    </div>
  );
}