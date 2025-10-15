// hooks/authHelpers.ts
import { BASE_URL } from './api';
import { UserRole } from '@/context/AuthContext';

export interface UserDetails {
    id: number;
    username: string;
    name: string;
    birth_date: string;
    number: string;
    email: string;
    email_2?: string;
    height?: string;
    weight?: string;
    side?: string;
    position?: { id: number; name: string } | null;
    preferred_role?: string | null; // ← PRIDAJ TOTO


}

export interface Club {
    id: number;
    name: string;
    description?: string;
}


export async function loginWithCredentials(
    username: string,
    password: string
): Promise<{
    access: string;
    refresh: string;
    club: Club | null;
    roles: UserRole[];
    categories: string[];
    details: UserDetails;
}> {
    const response = await fetch(`${BASE_URL}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) throw new Error('Neplatné prihlasovacie údaje');

    const data = await response.json();

    const meResponse = await fetch(`${BASE_URL}/me/`, {
        headers: { Authorization: `Bearer ${data.access}` },
    });

    if (!meResponse.ok) throw new Error('Nepodarilo sa načítať údaje o používateľovi');

    const meData = await meResponse.json();

    const details: UserDetails = {
        id: meData.id,
        username: meData.username,
        name: meData.name,
        birth_date: meData.birth_date,
        number: meData.number,
        email: meData.email,
        email_2: meData.email_2,
        height: meData.height,
        weight: meData.weight,
        side: meData.side,
        position: meData.position,
        preferred_role: meData.preferred_role ?? null, // ← PRIDAJ TOTO

    };

    const club: Club | null = meData.club ?? null;
    const roles: UserRole[] = Array.isArray(meData.roles) ? meData.roles : [];
    const categories: string[] = Array.isArray(meData.assigned_categories) ? meData.assigned_categories : [];

    return {
        access: data.access,
        refresh: data.refresh,
        club,
        roles,
        categories,
        details,
    };
}