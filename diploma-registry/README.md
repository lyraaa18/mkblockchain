# DiplomaRegistry: Prototype Minimal (Tugas Blockchain)

Prototype ini hanya untuk tugas kuliah. Seluruh data, alamat, dan ID bersifat **dummy**. Tidak memakai
mainnet, dana nyata, private key pribadi, atau data pribadi. Berjalan di jaringan simulasi lokal bawaan Hardhat.

## Isi folder

| File | Fungsi |
| --- | --- |
| `contracts/DiplomaRegistry.sol` | Smart contract (Solidity 0.8.24, OpenZeppelin AccessControl) |
| `test/DiplomaRegistry.test.js` | 13 test case (T-01 sampai T-13) sesuai tabel Bab 6.3 laporan |
| `hardhat.config.js` | Konfigurasi compiler |
| `package.json` | Daftar dependency dengan versi terkunci |

## Cara menjalankan

1. Pasang **Node.js LTS** (v18, v20, atau v22) dari nodejs.org. Cek: `node -v`
2. Buka terminal di folder ini (di VS Code: Terminal > New Terminal).
3. Pasang dependency (butuh internet): `npm install`
4. Jalankan test: `npx hardhat test`
   - Pertama kali, Hardhat mengunduh compiler Solidity 0.8.24 secara otomatis (butuh internet).
5. Hasil yang diharapkan: 13 baris bertanda centang dan tulisan `13 passing`.

## Mengambil bukti untuk laporan

- Salin seluruh output terminal ke file `lampiran/test-output.txt` (atau screenshot sebagai pelengkap).
- Catat versi untuk Bab 6.1:
  - `node -v`
  - `npx hardhat --version`
  - versi Solidity: 0.8.24 (lihat `hardhat.config.js`)
  - versi OpenZeppelin: lihat `package.json`
- Isi kolom Aktual, Status, dan Bukti di tabel test case dari output tersebut.

## Yang TIDAK diuji (tulis sebagai keterbatasan di laporan)

- Jaringan Besu QBFT multi-validator, toleransi validator mati, dan finality jaringan (T-14).
- Performa dan beban (T-15).
- Integrasi SIAKAD, portal verifikasi, HSM/KMS, dan penyimpanan off-chain.
- Audit keamanan formal. Prototype ini bukan untuk produksi.

## Catatan desain

- On-chain hanya: hash dokumen (SHA-256), alamat penerbit, waktu, status, kode alasan.
- `credentialId` dibuat off-chain sebagai pseudonim (hash dari NIM dummy + salt); NIM asli tidak pernah dikirim ke kontrak.
- `DEFAULT_ADMIN_ROLE` di prototype adalah satu akun; di rancangan sebenarnya berupa multisig 2-dari-3.
- Kontrak tidak upgradeable; kegagalan memakai custom error (`NotIssuer`, `NotAdmin`, `AlreadyIssued`, dst).
