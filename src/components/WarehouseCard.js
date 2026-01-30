import React from 'react';
import { MapPin, Ruler, User, Layers, CheckCircle2 } from 'lucide-react';

const WarehouseCard = ({ title, location, price, area, type, imageUrl, owner, facilities, amenities, category }) => {
  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
      {/* Image Section */}
      <div className="relative aspect-video w-full overflow-hidden">
        <img 
          src={imageUrl || "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80"} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Floating Badges */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
          {type || category || "General"}
        </div>
        <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors truncate">
            {title}
          </h3>
          <div className="flex items-center text-gray-500 text-sm mt-1">
            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
            <span className="truncate">{location}</span>
          </div>
          {/* Owner Name */}
          {owner && (
            <div className="flex items-center text-xs text-gray-400 mt-1">
              <User className="w-3 h-3 mr-1" />
              Owner: <span className="ml-1 text-gray-600 font-medium">{owner}</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Price</p>
            <p className="text-lg font-bold text-gray-900">
              ₹{price} <span className="text-xs text-gray-400 font-normal">/mo</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Area</p>
            <div className="flex items-center justify-end text-gray-700 font-semibold">
              <Ruler className="w-4 h-4 mr-1 text-gray-400" />
              {area} sq ft
            </div>
          </div>
        </div>
        {/* Facilities */}
        {facilities && facilities.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {facilities.slice(0, 3).map((f, i) => (
              <span key={i} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                <Layers className="w-3 h-3" /> {f}
              </span>
            ))}
            {facilities.length > 3 && (
              <span className="bg-slate-200 text-slate-500 px-2 py-1 rounded text-xs font-medium">+{facilities.length - 3} more</span>
            )}
          </div>
        )}

        {/* Amenities */}
        {amenities && amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs font-semibold text-slate-500 w-full">Amenities:</span>
            {amenities.slice(0, 3).map((a, i) => (
              <span key={i} className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                <Layers className="w-3 h-3" /> {a}
              </span>
            ))}
            {amenities.length > 3 && (
              <span className="bg-orange-100 text-orange-500 px-2 py-1 rounded text-xs font-medium">+{amenities.length - 3} more</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseCard;