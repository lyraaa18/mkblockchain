# Mata Kuliah Blockchain - Project & Simulasi

Repositori ini berisi implementasi proyek dan simulasi teknologi blockchain untuk verifikasi ijazah digital (*Diploma Registry*).

## 📂 Struktur Repositori

1. **[`diploma-registry/`](./diploma-registry)**
   - Proyek Hardhat dan Smart Contract Solidity (`DiplomaRegistry.sol`).
   - Menggunakan OpenZeppelin `AccessControl` untuk manajemen peran (*Admin* & *Issuer*).
   - Pengujian otomatis (*unit tests*) untuk validasi fungsionalitas registrasi ijazah, verifikasi hash dokumen, pencegahan duplikasi, dan pencabutan (*revocation*).

2. **[`simulasi/`](./simulasi)**
   - Rangkaian skrip simulasi mekanisme inti blockchain:
     - `sim_crypto.py`: Kriptografi Hash SHA-256, Avalanche Effect, Mini-Blockchain & Merkle Tree.
     - `sim_consensus.py`: Simulasi Konsensus PoW, PoS, PBFT/QBFT, dan Forking.
     - `sim_utxo.py`: Model Transaksi UTXO (seperti Bitcoin) dan Pencegahan Double Spending.
     - `scripts/run.js`: Simulasi eksekusi smart contract Hardhat in-memory & analisis *gas fee*.
   - Dilengkapi laporan hasil simulasi dalam format `.txt` dan `.json`.
