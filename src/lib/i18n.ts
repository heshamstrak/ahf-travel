import { LanguageCode } from "@/data/types";

/*
 * Translation architecture: UI chrome lives here, keyed by stable ids.
 * Product content (hotel names, descriptions) stays in the data layer and is
 * localised by the backend later. Add a key to both languages, never a page copy.
 */
export const dictionaries: Record<LanguageCode, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.hotels": "Hotels",
    "nav.tours": "Tours",
    "nav.cars": "Cars",
    "nav.transfers": "Transfers",
    "nav.packages": "Packages",
    "nav.signIn": "Sign In",
    "nav.createAccount": "Create Account",
    "nav.myBookings": "My Bookings",
    "nav.favorites": "Favorites",
    "nav.profile": "Profile",
    "nav.signOut": "Sign out",
    "nav.menu": "Menu",
    "nav.currency": "Currency",
    "nav.language": "Language",
    "search.hotels": "Hotels",
    "search.tours": "Tours",
    "search.cars": "Cars",
    "search.transfers": "Transfers",
    "search.searchHotels": "Search Hotels",
    "search.findExperiences": "Find Experiences",
    "search.searchCars": "Search Cars",
    "search.findTransfer": "Find Transfer",
    "footer.explore": "Explore",
    "footer.company": "Company",
    "footer.support": "Support",
    "common.viewDetails": "View Details",
    "common.bookNow": "Book Now",
    "common.loadMore": "Load more",
    "common.filters": "Filters",
    "common.sort": "Sort by",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.hotels": "الفنادق",
    "nav.tours": "الجولات",
    "nav.cars": "السيارات",
    "nav.transfers": "النقل",
    "nav.packages": "الباقات",
    "nav.signIn": "تسجيل الدخول",
    "nav.createAccount": "إنشاء حساب",
    "nav.myBookings": "حجوزاتي",
    "nav.favorites": "المفضلة",
    "nav.profile": "الملف الشخصي",
    "nav.signOut": "تسجيل الخروج",
    "nav.menu": "القائمة",
    "nav.currency": "العملة",
    "nav.language": "اللغة",
    "search.hotels": "فنادق",
    "search.tours": "جولات",
    "search.cars": "سيارات",
    "search.transfers": "نقل",
    "search.searchHotels": "ابحث عن فنادق",
    "search.findExperiences": "ابحث عن تجارب",
    "search.searchCars": "ابحث عن سيارات",
    "search.findTransfer": "ابحث عن نقل",
    "footer.explore": "استكشف",
    "footer.company": "الشركة",
    "footer.support": "الدعم",
    "common.viewDetails": "عرض التفاصيل",
    "common.bookNow": "احجز الآن",
    "common.loadMore": "عرض المزيد",
    "common.filters": "الفلاتر",
    "common.sort": "ترتيب حسب",
  },
};

export function translate(lang: LanguageCode, key: string): string {
  return dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
}
