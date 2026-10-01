// Builds data/quran-listen/reciters.json: the per-ayah (EveryAyah) reciters of
// the app's `verseAudioOptions` (lib/features/quran_kariem/data/verse_audio_model.dart).
// Whole-surah / timing-based entries are skipped: their riwayat do not match
// the Hafs text the site shows. Also used by the listening wird.
//
// Usage: node scripts/convert-quran-listen.mjs [path-to-flutter-repo]
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.argv[2] ?? "../../Flutter/noon-islamic-android");
const OUT = path.resolve("data/quran-listen");
const dart = fs.readFileSync(path.join(SRC, "lib/features/quran_kariem/data/verse_audio_model.dart"), "utf8");

// English display names; anything missing is derived from the folder name.
const EN = {
  Alafasy_128kbps: "Mishary Alafasy", MaherAlMuaiqly128kbps: "Maher Al-Muaiqly",
  Abdul_Basit_Murattal_192kbps: "Abdul Basit (Murattal)", Husary_128kbps: "Mahmoud Khalil Al-Husary",
  Minshawy_Murattal_128kbps: "Mohamed Siddiq Al-Minshawi", "Abdurrahmaan_As-Sudais_192kbps": "Abdurrahman As-Sudais",
  "Saood_ash-Shuraym_128kbps": "Saud Ash-Shuraim", Ghamadi_40kbps: "Saad Al-Ghamdi",
  "Yasser_Ad-Dussary_128kbps": "Yasser Ad-Dossary", "Abu_Bakr_Ash-Shaatree_128kbps": "Abu Bakr Ash-Shatri",
  Hani_Rifai_192kbps: "Hani Ar-Rifai", Hudhaify_128kbps: "Ali Al-Hudhaify", Muhammad_Ayyoub_128kbps: "Muhammad Ayyoub",
  Muhammad_Jibreel_128kbps: "Muhammad Jibreel", Abdul_Basit_Mujawwad_128kbps: "Abdul Basit (Mujawwad)",
  Minshawy_Mujawwad_192kbps: "Al-Minshawi (Mujawwad)", Minshawy_Teacher_128kbps: "Al-Minshawi (Teacher)",
  Husary_128kbps_Mujawwad: "Al-Husary (Mujawwad)", Husary_Muallim_128kbps: "Al-Husary (Teacher)",
  Mohammad_al_Tablaway_128kbps: "Mohammad At-Tablawi", Mustafa_Ismail_48kbps: "Mustafa Ismail",
  Nasser_Alqatami_128kbps: "Nasser Al-Qatami", Salah_Al_Budair_128kbps: "Salah Al-Budair",
  Muhsin_Al_Qasim_192kbps: "Abdul Muhsin Al-Qasim", Abdullah_Basfar_192kbps: "Abdullah Basfar",
  Abdullah_Matroud_128kbps: "Abdullah Al-Matroud", ahmed_ibn_ali_al_ajamy_128kbps: "Ahmed Al-Ajmi",
  "Abdullaah_3awwaad_Al-Juhaynee_128kbps": "Abdullah Al-Juhany", Salaah_AbdulRahman_Bukhatir_128kbps: "Salah Bukhatir",
  Fares_Abbad_64kbps: "Fares Abbad", Ali_Jaber_64kbps: "Ali Jaber", Ibrahim_Akhdar_32kbps: "Ibrahim Al-Akhdar",
  mahmoud_ali_al_banna_32kbps: "Mahmoud Ali Al-Banna", Ahmed_Neana_128kbps: "Ahmed Neana",
  "Khaalid_Abdullaah_al-Qahtaanee_192kbps": "Khalid Al-Qahtani", Ayman_Sowaid_64kbps: "Ayman Suwaid",
  Yaser_Salamah_128kbps: "Yaser Salamah", Akram_AlAlaqimy_128kbps: "Akram Al-Alaqimy",
  Ali_Hajjaj_AlSuesy_128kbps: "Ali Hajjaj As-Suesy", Sahl_Yassin_128kbps: "Sahl Yassin",
  khalefa_al_tunaiji_64kbps: "Khalifa At-Tunaiji", Muhammad_AbdulKareem_128kbps: "Muhammad Abdul Kareem",
  Nabil_Rifa3i_48kbps: "Nabil Ar-Rifai", aziz_alili_128kbps: "Aziz Alili", Parhizgar_48kbps: "Shahriar Parhizgar",
  Karim_Mansoori_40kbps: "Karim Mansoori",
};
const derive = (f) => f.replace(/_?\d+kbps_?/i, " ").replace(/[_-]+/g, " ").trim();

const field = (block, key) => block.match(new RegExp(`${key}:\\s*(?:"([^"]*)"|(\\w+))`))?.slice(1).find((v) => v != null);
const reciters = [];
for (const [, block] of dart.matchAll(/VerseAudioOption\(([\s\S]*?)\n\s*\),/g)) {
  const folder = field(block, "subfolder");
  if (!folder || field(block, "isTimingBased") === "true" || /surahFolderUrl:/.test(block)) continue;
  if (field(block, "narration") !== "حفص عن عاصم") continue; // text on the site is Hafs
  reciters.push({ id: folder, name: field(block, "name"), nameEn: EN[folder] ?? derive(folder) });
}
if (reciters.length < 10) throw new Error(`parsed only ${reciters.length} reciters`);

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "reciters.json"), JSON.stringify(reciters));
console.log(`${reciters.length} per-ayah reciters -> ${OUT}`);
