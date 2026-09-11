# ECC project skills for Gemini

Folder ini dibuat dari ECC 2.1.0 menggunakan target project-local Gemini. Tujuh skill didukung langsung oleh resolver installer; empat skill tambahan disalin dari sumber ECC yang sama karena nama skill tersebut belum dipetakan sebagai modul native target Gemini.

## Skill terpasang

1. `api-connector-builder`
2. `backend-patterns`
3. `tdd-workflow`
4. `ai-regression-testing`
5. `verification-loop`
6. `error-handling`
7. `database-migrations`
8. `cost-aware-llm-pipeline`
9. `eval-harness`
10. `agent-architecture-audit`
11. `loop-design-check`

Skill 2, 3, 9, dan 11 tersedia sebagai salinan project-local dari `/home/nothrovo/ECC/skills/`. `ecc-install-state.json` mencatat permintaan installer dan operasi yang didukung native; karena itu daftar operasi di state tidak mencantumkan empat salinan kompatibilitas tersebut meskipun direktorinya ada.

Gemini harus mulai dari `GEMINI.md`, lalu membaca penuh skill yang relevan sebelum mengubah kode. Instruksi Midas di bagian akhir `GEMINI.md` menentukan urutan skill, invariants workflow, dan perintah verifikasi.

Skill ini hanya panduan kerja untuk agent. Bot produksi tidak mengimpor ECC dan tidak mendapat dependency runtime baru.
