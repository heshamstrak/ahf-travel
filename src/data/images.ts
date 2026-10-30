/*
 * Central image registry. Every mock entity refers to these keys, so when the
 * backend starts returning uploaded images only this file needs to change.
 * Photos are sourced from Unsplash and Wikimedia Commons.
 */

const unsplash = (id: string, w = 1400) =>
  `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;

const commons = (path: string) => `https://thumb.wikimedia.org/wikipedia/commons/thumb/${path}`;

export const images = {
  hero: unsplash("1568322445389-f64ac2515020", 2400),

  destinations: {
    cairo: unsplash("1572252009286-268acec5ca0a"),
    giza: unsplash("1539768942893-daf53e448371"),
    sharm: commons("8/83/Naama_Bay_Beach_R01.jpg/1920px-Naama_Bay_Beach_R01.jpg"),
    hurghada: "https://upload.wikimedia.org/wikipedia/commons/2/26/Hurghada_Hilton_Resort_Beach_Red_Sea_-_panoramio.jpg",
    luxor: commons("1/11/Luxor_Temple%2C_Pillars%2C_Luxor%2C_Egypt.jpg/1920px-Luxor_Temple%2C_Pillars%2C_Luxor%2C_Egypt.jpg"),
    aswan: commons("3/3b/Aswan_Nile_R05.jpg/1920px-Aswan_Nile_R05.jpg"),
  },

  hotels: {
    marriottView: commons("0/0d/View_from_the_Oberoi_-_Mena_House_Hotel%2C_Egypt.jpg/1920px-View_from_the_Oberoi_-_Mena_House_Hotel%2C_Egypt.jpg"),
    marriottExterior: commons("c/c1/3._Mena_House_C.jpg/1920px-3._Mena_House_C.jpg"),
    marriottFacade: commons("3/36/2._Mena_House_Hotel_1_C.jpg/1920px-2._Mena_House_Hotel_1_C.jpg"),
    fourSeasons: commons("b/bf/Four_Seasons_Hotel_in_Cairo.JPG/1920px-Four_Seasons_Hotel_in_Cairo.JPG"),
    beachResort: commons("8/83/Naama_Bay_Beach_R01.jpg/1920px-Naama_Bay_Beach_R01.jpg"),
    poolResort: unsplash("1520250497591-112f2f40a3f4"),
    pool: unsplash("1566073771259-6a8506099945"),
    hurghadaBeach: "https://upload.wikimedia.org/wikipedia/commons/2/26/Hurghada_Hilton_Resort_Beach_Red_Sea_-_panoramio.jpg",
    sheratonHurghada: commons("3/3b/Sheraton_hurghada_-_panoramio.jpg/1920px-Sheraton_hurghada_-_panoramio.jpg"),
    winterPalace: commons("2/27/Luxor_Winter_Palace_R01.jpg/1920px-Luxor_Winter_Palace_R01.jpg"),
    oldCataract: commons("3/3f/Aswan_Old_Cataract_Hotel_R01.jpg/1920px-Aswan_Old_Cataract_Hotel_R01.jpg"),
  },

  tours: {
    pyramidsSphinx: commons("d/db/Great_Sphinx_of_Giza_%28%D8%A3%D8%A8%D9%88_%D8%A7%D9%84%D9%87%D9%88%D9%84%29.jpg/1920px-Great_Sphinx_of_Giza_%28%D8%A3%D8%A8%D9%88_%D8%A7%D9%84%D9%87%D9%88%D9%84%29.jpg"),
    giza: unsplash("1539768942893-daf53e448371"),
    nileCruise: commons("3/32/Sun_Ray_Nile_cruise_ship_R01.jpg/1920px-Sun_Ray_Nile_cruise_ship_R01.jpg"),
    karnak: commons("c/c8/Karnak_Khonsu_Temple_R01.jpg/1920px-Karnak_Khonsu_Temple_R01.jpg"),
    luxorPillars: commons("1/11/Luxor_Temple%2C_Pillars%2C_Luxor%2C_Egypt.jpg/1920px-Luxor_Temple%2C_Pillars%2C_Luxor%2C_Egypt.jpg"),
    reef: commons("e/e7/%D0%9A%D0%BE%D1%80%D0%B0%D0%BB%D0%BB%D0%BE%D0%B2%D1%8B%D0%B9_%D1%80%D0%B8%D1%84_%D0%9D%D0%B0%D0%B0%D0%BC%D0%B0_%D0%91%D0%B5%D0%B9.jpg/1920px-%D0%9A%D0%BE%D1%80%D0%B0%D0%BB%D0%BB%D0%BE%D0%B2%D1%8B%D0%B9_%D1%80%D0%B8%D1%84_%D0%9D%D0%B0%D0%B0%D0%BC%D0%B0_%D0%91%D0%B5%D0%B9.jpg"),
    redSeaCoast: commons("5/55/Red_sea_2_-_panoramio.jpg/1920px-Red_sea_2_-_panoramio.jpg"),
  },

  cars: {
    corolla: commons("2/24/2018_Toyota_Corolla_%28ZRE172R%29_Ascent_sedan_%282018-11-02%29_02.jpg/1920px-2018_Toyota_Corolla_%28ZRE172R%29_Ascent_sedan_%282018-11-02%29_02.jpg"),
    accent: commons("a/a2/2012_Hyundai_Accent_%28RB%29_Premium_sedan_%282018-10-01%29_02.jpg/1920px-2012_Hyundai_Accent_%28RB%29_Premium_sedan_%282018-10-01%29_02.jpg"),
    elantra: commons("9/9a/HYUNDAI_ELANTRA_SEDAN_%28XD%29_China.jpg/1920px-HYUNDAI_ELANTRA_SEDAN_%28XD%29_China.jpg"),
    mgOne: commons("b/b9/MG_ZS_EV_Facelift_1X7A5867.jpg/1920px-MG_ZS_EV_Facelift_1X7A5867.jpg"),
    rav4: commons("9/9f/Toyota_RAV4_Plug-in_Hybrid_GR_Sport_IMG_9891.jpg/1920px-Toyota_RAV4_Plug-in_Hybrid_GR_Sport_IMG_9891.jpg"),
    prado: commons("2/28/Toyota_Land_Cruiser_Prado%2C_Baku_%28P1090223%29.jpg/1920px-Toyota_Land_Cruiser_Prado%2C_Baku_%28P1090223%29.jpg"),
    mercedesC: unsplash("1493238792000-8113da705763"),
  },

  transfers: {
    van: commons("5/50/Mercedes_eVito_hotel_vans.jpg/1920px-Mercedes_eVito_hotel_vans.jpg"),
    minibus: commons("1/1f/1989_Toyota_HiAce_9-seater_minibus_%28LH51%29%2C_front_right.jpg/1920px-1989_Toyota_HiAce_9-seater_minibus_%28LH51%29%2C_front_right.jpg"),
  },

  packages: {
    cairo: commons("f/fc/Muhammad_Ali_Mosque_1.jpg/1920px-Muhammad_Ali_Mosque_1.jpg"),
    classic: commons("b/b2/Thebes%2C_Luxor%2C_Egypt%2C_Panoramic_view_of_the_Valley_of_the_Kings.jpg/1920px-Thebes%2C_Luxor%2C_Egypt%2C_Panoramic_view_of_the_Valley_of_the_Kings.jpg"),
    redSea: commons("5/55/Red_sea_2_-_panoramio.jpg/1920px-Red_sea_2_-_panoramio.jpg"),
    highlights: commons("3/31/Templo_de_Nefertari%2C_Abu_Simbel%2C_Egipto%2C_2022-04-02%2C_DD_153.jpg/1920px-Templo_de_Nefertari%2C_Abu_Simbel%2C_Egipto%2C_2022-04-02%2C_DD_153.jpg"),
  },

  transferBanner: commons("5/50/Mercedes_eVito_hotel_vans.jpg/1920px-Mercedes_eVito_hotel_vans.jpg"),

  avatar: (n: number) => `https://i.pravatar.cc/150?img=${n}`,
} as const;
