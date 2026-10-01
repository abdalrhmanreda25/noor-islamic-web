/** Per-ayah recitation file on EveryAyah (the folder layout the app uses). */
export const everyAyahUrl = (folder: string, surah: number, ayah: number) =>
  `https://everyayah.com/data/${folder}/${String(surah).padStart(3, "0")}${String(ayah).padStart(3, "0")}.mp3`;

/** Whole-surah file on an mp3quran moshaf server. */
export const surahUrl = (server: string, surah: number) => `${server}${String(surah).padStart(3, "0")}.mp3`;
