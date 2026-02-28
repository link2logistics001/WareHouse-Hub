/**
 * warehouseData.js
 * Static seed/demo data used by MerchantDashboard and ChatBox.
 * Real warehouses are loaded dynamically from Firestore (warehouse_details collection).
 */

export const warehouses = [
    {
        id: 'WH001',
        name: 'Prime Logistics Hub',
        ownerName: 'Rajesh Kumar',
        ownerId: 'OWNER001',
        category: 'Bonded',
        status: 'approved',
        location: {
            area: 'Turbhe MIDC',
            city: 'Mumbai',
            state: 'Maharashtra',
            address: 'Plot 14, Turbhe MIDC, Navi Mumbai - 400705',
        },
        size: {
            area: 25000,
            unit: 'sq ft',
        },
        pricing: {
            amount: 185000,
            unit: 'month',
            model: 'Per sq ft',
        },
        clearHeight: 32,
        dockDoors: 6,
        facilities: ['CCTV', 'Fire Safety', 'Security Guard'],
        amenities: ['Loading Bay', 'WMS', 'Temperature Control'],
        storageTypes: ['Non-Hazardous', 'Temperature Controlled'],
        images: [
            'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
            'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
        ],
        description:
            'A premium bonded warehouse with state-of-the-art temperature control, ideal for pharma and FMCG storage. 24/7 operations with WMS integration.',
        rating: 4.8,
        reviews: 34,
        createdAt: '2024-01-10T09:00:00Z',
    },
    {
        id: 'WH002',
        name: 'Metro Storage Solutions',
        ownerName: 'Anita Sharma',
        ownerId: 'OWNER002',
        category: 'Non-Bonded',
        status: 'approved',
        location: {
            area: 'Gurgaon Sector 37',
            city: 'Gurgaon',
            state: 'Haryana',
            address: 'Sector 37, IMT Manesar, Gurgaon - 122050',
        },
        size: {
            area: 40000,
            unit: 'sq ft',
        },
        pricing: {
            amount: 260000,
            unit: 'month',
            model: 'Per sq ft',
        },
        clearHeight: 28,
        dockDoors: 8,
        facilities: ['CCTV', 'Fire Safety'],
        amenities: ['Loading Bay', 'Forklift', 'Pick & Pack'],
        storageTypes: ['Non-Hazardous'],
        images: [
            'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
            'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
        ],
        description:
            'Large-format general warehouse serving the automotive and FMCG sector. Excellent road connectivity to Delhi–Mumbai Industrial Corridor.',
        rating: 4.5,
        reviews: 21,
        createdAt: '2024-02-15T09:00:00Z',
    },
    {
        id: 'WH003',
        name: 'Skyline Cold Chain Facility',
        ownerName: 'Pradeep Nair',
        ownerId: 'OWNER003',
        category: 'Non-Bonded',
        status: 'approved',
        location: {
            area: 'Whitefield',
            city: 'Bengaluru',
            state: 'Karnataka',
            address: '12th km, Whitefield Road, Bengaluru - 560066',
        },
        size: {
            area: 18000,
            unit: 'sq ft',
        },
        pricing: {
            amount: 145000,
            unit: 'month',
            model: 'Per pallet',
        },
        clearHeight: 24,
        dockDoors: 4,
        facilities: ['CCTV', 'Fire Safety', 'Security Guard'],
        amenities: ['Temperature Control', 'Cold Storage', 'E-commerce Fulfillment'],
        storageTypes: ['Temperature Controlled'],
        images: [
            'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80',
        ],
        description:
            'Specialised cold chain facility maintaining 2°C–8°C zones for pharma and perishable goods. ISO-certified with automated temperature logging.',
        rating: 4.9,
        reviews: 47,
        createdAt: '2024-03-05T09:00:00Z',
    },
    {
        id: 'WH004',
        name: 'Eastern Freight Terminal',
        ownerName: 'Sanjay Das',
        ownerId: 'OWNER004',
        category: 'FTWZ',
        status: 'approved',
        location: {
            area: 'Diamond Harbour Road',
            city: 'Kolkata',
            state: 'West Bengal',
            address: 'Diamond Harbour Road, Joka, Kolkata - 700104',
        },
        size: {
            area: 60000,
            unit: 'sq ft',
        },
        pricing: {
            amount: 320000,
            unit: 'month',
            model: 'Per CBM',
        },
        clearHeight: 36,
        dockDoors: 12,
        facilities: ['CCTV', 'Fire Safety', 'Security Guard'],
        amenities: ['Loading Bay', 'Container Handling', 'Cross Docking'],
        storageTypes: ['Hazardous', 'Non-Hazardous'],
        images: [
            'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80',
        ],
        description:
            'FTWZ-certified port-side terminal with container handling capability up to 40 ft. Ideal for import/export operations targeting the eastern corridor.',
        rating: 4.3,
        reviews: 15,
        createdAt: '2024-04-01T09:00:00Z',
    },
    {
        id: 'WH005',
        name: 'Connaught Warehousing Park',
        ownerName: 'Meera Patel',
        ownerId: 'OWNER005',
        category: 'Non-Bonded',
        status: 'approved',
        location: {
            area: 'Bhiwandi',
            city: 'Bhiwandi',
            state: 'Maharashtra',
            address: 'NH48, Bhiwandi, Thane District - 421302',
        },
        size: {
            area: 35000,
            unit: 'sq ft',
        },
        pricing: {
            amount: 210000,
            unit: 'month',
            model: 'Per sq ft',
        },
        clearHeight: 30,
        dockDoors: 7,
        facilities: ['CCTV', 'Security Guard'],
        amenities: ['Kitting / Assembly', 'Labelling', 'E-commerce Fulfillment'],
        storageTypes: ['Non-Hazardous'],
        images: [
            'https://images.unsplash.com/photo-1565891741441-64926e3e3d31?w=800&q=80',
        ],
        description:
            "Strategic e-commerce fulfilment hub in Bhiwandi — Maharashtra's warehouse capital. Same-day delivery reach to Mumbai, Pune, and Nashik.",
        rating: 4.6,
        reviews: 28,
        createdAt: '2024-04-20T09:00:00Z',
    },
];

// ─────────────────────────────────────────────────────────────────────
// Demo conversations (used by ChatBox for UI preview only)
// In production, chats are stored in Firestore.
// ─────────────────────────────────────────────────────────────────────
export const conversations = [
    {
        id: 'CONV001',
        warehouseId: 'WH001',
        merchantId: 'MERCHANT001',
        ownerId: 'OWNER001',
        messages: [
            {
                id: 'MSG001',
                senderId: 'MERCHANT001',
                senderType: 'merchant',
                message: 'Hi! I am interested in your Prime Logistics Hub. Is space available from next month?',
                timestamp: '2024-05-01T10:00:00Z',
                read: true,
            },
            {
                id: 'MSG002',
                senderId: 'OWNER001',
                senderType: 'owner',
                message: 'Hello! Yes, we have 10,000 sq ft available from June 1st. What are your storage requirements?',
                timestamp: '2024-05-01T10:15:00Z',
                read: true,
            },
            {
                id: 'MSG003',
                senderId: 'MERCHANT001',
                senderType: 'merchant',
                message: 'We deal in pharma products, so we need temperature-controlled storage for 8,000 sq ft.',
                timestamp: '2024-05-01T10:30:00Z',
                read: true,
            },
        ],
    },
    {
        id: 'CONV002',
        warehouseId: 'WH002',
        merchantId: 'MERCHANT001',
        ownerId: 'OWNER002',
        messages: [
            {
                id: 'MSG004',
                senderId: 'MERCHANT001',
                senderType: 'merchant',
                message: 'Do you provide pick & pack services? We need fulfillment for our e-commerce brand.',
                timestamp: '2024-05-02T11:00:00Z',
                read: true,
            },
            {
                id: 'MSG005',
                senderId: 'OWNER002',
                senderType: 'owner',
                message: 'Absolutely! We have a dedicated pick & pack team handling up to 2,000 orders per day.',
                timestamp: '2024-05-02T11:20:00Z',
                read: false,
            },
        ],
    },
];
