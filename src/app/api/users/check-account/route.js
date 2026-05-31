import { NextResponse } from 'next/server';
import { getAdminDb, isServiceAccountConfigured } from '@/lib/firebase-admin';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        if (!isServiceAccountConfigured()) {
            console.warn('check-account API: Firebase Admin credentials not configured. Returning exists: false.');
            return NextResponse.json({ exists: false, error: 'Firebase Admin credentials not configured' });
        }

        const db = getAdminDb();
        const snapshot = await db.collection('users').where('email', '==', email.toLowerCase().trim()).get();

        if (snapshot.empty) {
            return NextResponse.json({ exists: false });
        }

        const doc = snapshot.docs[0];
        const userData = doc.data();

        return NextResponse.json({
            exists: true,
            user: {
                uid: doc.id,
                name: userData.name || userData.displayName || 'Business Client',
                email: userData.email,
                userType: userData.userType || 'business_client',
            },
        });
    } catch (error) {
        console.error('Error in check-account API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
