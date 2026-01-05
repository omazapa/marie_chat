import { headers } from 'next/headers';
import { cookies } from 'next/headers';

export async function getLocale(): Promise<string> {
  // Try to get locale from cookie first
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE');

  if (localeCookie?.value && ['en', 'es'].includes(localeCookie.value)) {
    return localeCookie.value;
  }

  // Try to get from Accept-Language header
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');

  if (acceptLanguage) {
    // Simple parsing - check if Spanish is preferred
    if (acceptLanguage.toLowerCase().includes('es')) {
      return 'es';
    }
  }

  // Default to English
  return 'en';
}

export async function setLocale(locale: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60, // 1 year
  });
}
