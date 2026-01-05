'use client';

import { useLocale, useTranslations as useNextIntlTranslations } from 'next-intl';
import { useInterfaceStore } from '@/stores/interfaceStore';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function useLanguage() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { language, updateLanguage } = useInterfaceStore();

  useEffect(() => {
    // Sync locale with interface store if different
    if (language !== currentLocale) {
      // Update URL locale without page reload
      const newPathname = pathname.replace(`/${currentLocale}`, `/${language}`);
      router.replace(newPathname);
    }
  }, [language, currentLocale, pathname, router]);

  const changeLanguage = async (newLang: 'en' | 'es') => {
    await updateLanguage(newLang);
    // Force page reload to apply new locale
    window.location.reload();
  };

  return {
    currentLanguage: currentLocale as 'en' | 'es',
    changeLanguage,
  };
}

// Re-export useTranslations for convenience
export function useTranslations(namespace?: string) {
  return useNextIntlTranslations(namespace);
}
