/**
 * WarehouseCard.js — Warehouse Listing Card Component
 *
 * A clickable card that displays a warehouse's key information in a grid layout.
 * Used on the search results page and in various dashboard warehouse lists.
 *
 * Features:
 *  - Hero image with Next.js optimization (via OptimizedImage)
 *  - Category badge and "Verified" status badge
 *  - Wishlist heart button (only for business_client users)
 *  - Warehouse name, location, and owner info
 *  - Price and area stats grid
 *  - Facilities and amenities tags (max 3 shown, with "+N more" overflow)
 *  - Click navigates to the warehouse detail page using encoded ID
 *  - Region-aware price formatting via CountryContext
 *
 * @param {Object} props
 * @param {string} props.id — Firestore document ID of the warehouse
 * @param {string} props.title — Warehouse name
 * @param {string} props.location — "City, State" string
 * @param {number|string} props.price — Monthly pricing amount
 * @param {number|string} props.area — Total area in the configured unit
 * @param {string} props.type — Warehouse category/type
 * @param {string} props.imageUrl — URL of the front view photo
 * @param {string} props.owner — Company/partner name
 * @param {string[]} props.facilities — List of facility features
 * @param {string[]} props.amenities — List of amenities
 * @param {string} props.category — Alternative category field (fallback for type)
 * @param {string} props.measurementUnit — Unit of measurement (sqft, mt, both)
 * @param {number|string} props.totalMetricTons — Capacity in metric tons
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Ruler, User, Layers, CheckCircle2, Heart } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import { encodeWarehouseId } from '@/lib/warehouseId';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';

const WarehouseCard = ({
    id,
    title,
    location,
    price,
    area,
    type,
    imageUrl,
    owner,
    facilities,
    amenities,
    category,
    measurementUnit,
    totalMetricTons,
}) => {
    const router = useRouter();
    const { user } = useAuth();
    const { toggleWishlist, isWishlisted } = useWishlist();
    const { fmtPrice, config } = useCountry();

    // Only business clients can save warehouses to their wishlist
    const isBusinessClient = user?.userType === 'business_client';
    const saved = isWishlisted(id);

    return (
        <div
            // Navigate to warehouse detail page on click (ID is Base64-encoded for URL safety)
            onClick={() => id && router.push(`/warehouse/${encodeWarehouseId(id)}`)}
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
        >
            {/* ── Image Section ── */}
            <div className="relative aspect-video w-full overflow-hidden">
                <OptimizedImage
                    src={imageUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    quality={70}
                    className="w-full h-full"
                    imgClassName="group-hover:scale-105 transition-transform duration-500 object-cover"
                />

                {/* Floating Badges — Category tag and wishlist heart */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                    {/* Category/Type badge */}
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                        {type || category || 'General'}
                    </div>
                    {/* Wishlist heart — only visible for business clients */}
                    {isBusinessClient && (
                        <button
                            onClick={(e) => toggleWishlist(id, e)}
                            className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform focus:outline-none"
                        >
                            <Heart
                                className={`w-4 h-4 transition-colors ${saved ? 'text-red-500 fill-red-500' : 'text-gray-500'}`}
                            />
                        </button>
                    )}
                </div>

                {/* Verified badge — top-left corner */}
                <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1 z-10">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                </div>
            </div>

            {/* ── Content Section ── */}
            <div className="p-5">
                {/* Warehouse name and location */}
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                        {title}
                    </h3>
                    <div className="flex items-center text-gray-500 text-sm mt-1">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400 shrink-0" />
                        <span className="truncate">{location}</span>
                    </div>
                    {/* Owner/Partner Name */}
                    {owner && (
                        <div className="flex items-center text-xs text-gray-400 mt-1">
                            <User className="w-3 h-3 mr-1" />
                            Warehouse Partners: <span className="ml-1 text-gray-600 font-medium">{owner}</span>
                        </div>
                    )}
                </div>

                {/* ── Stats Grid — Price and Area ── */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Price</p>
                        <p className="text-lg font-bold text-gray-900">
                            {/* Use fmtPrice for numeric prices, show raw string for "Contact for Price" etc. */}
                            {isNaN(Number(price)) ? price : fmtPrice(price)}{' '}
                            <span className="text-xs text-gray-400 font-normal">/mo</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Area / Capacity</p>
                        <div className="flex flex-col items-end text-gray-700 font-semibold mt-0.5">
                            {(!measurementUnit || measurementUnit === 'sqft' || measurementUnit === 'both') && (
                                <div className="flex items-center justify-end">
                                    <Ruler className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                    {area} {config.unit}
                                </div>
                            )}
                            {(measurementUnit === 'mt' || measurementUnit === 'both') && (
                                <div className="flex items-center justify-end text-[13px] mt-0.5">
                                    <Layers className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                    {totalMetricTons?.toLocaleString() || 0} MT
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Facilities Tags — Show first 3 with overflow indicator ── */}
                {facilities && facilities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {facilities.slice(0, 3).map((f, i) => (
                            <span
                                key={i}
                                className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
                            >
                                <Layers className="w-3 h-3" /> {f}
                            </span>
                        ))}
                        {/* "+N more" badge if there are more than 3 facilities */}
                        {facilities.length > 3 && (
                            <span className="bg-slate-200 text-slate-500 px-2 py-1 rounded text-xs font-medium">
                                +{facilities.length - 3} more
                            </span>
                        )}
                    </div>
                )}

                {/* ── Amenities Tags — Show first 3 with overflow indicator ── */}
                {amenities && amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs font-semibold text-slate-500 w-full">Amenities:</span>
                        {amenities.slice(0, 3).map((a, i) => (
                            <span
                                key={i}
                                className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
                            >
                                <Layers className="w-3 h-3" /> {a}
                            </span>
                        ))}
                        {amenities.length > 3 && (
                            <span className="bg-orange-100 text-orange-500 px-2 py-1 rounded text-xs font-medium">
                                +{amenities.length - 3} more
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WarehouseCard;
