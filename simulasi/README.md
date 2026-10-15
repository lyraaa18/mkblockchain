# Simulasi Sistem Blockchain & Verifikasi Ijazah Digital

Repositori ini berisi serangkaian simulasi konsep inti blockchain dan implementasi *smart contract* untuk verifikasi ijazah digital. Simulasi mencakup dasar kriptografi, mekanisme konsensus, model transaksi UTXO, serta eksekusi *smart contract* pada jaringan Ethereum lokal (Hardhat in-memory).

---

## 📁 Struktur Direktori

```text
simulasi/
│
├── sim_crypto.py             # Simulasi 1: Kriptografi Hash, Avalanche Effect, Mini-Blockchain & Merkle Tree
├── sim_consensus.py          # Simulasi 2: Konsensus PoW, PoS, PBFT/QBFT & Penanganan Fork
├── sim_utxo.py               # Simulasi 3: Model Transaksi UTXO & Pencegahan Double Spending
│
├── contracts/
│   └── DiplomaRegistry.sol   # Smart Contract Solidity (OpenZeppelin AccessControl, Issue, Verify, Revoke)
├── scripts/
│   └── run.js                # Skrip eksekusi pengujian Smart Contract Hardhat in-memory
├── hardhat.config.js         # Konfigurasi Hardhat (Solidity 0.8.24)
│
├── crypto_result.txt         # Hasil eksekusi sim_crypto.py
├── consensus_result.txt      # Hasil eksekusi sim_consensus.py
├── utxo_result.txt           # Hasil eksekusi sim_utxo.py
├── eth_result.txt            # Hasil eksekusi scripts/run.js (gas fee, event log, verifikasi)
├── chain.json                # Dump struktur rantai blok mini-blockchain
└── merkle.json               # Dump struktur node & root Merkle tree
```

---

## ⚙️ Prasyarat Lingkungan (Prerequisites)

1. **Python 3.8+**
   - Menggunakan pustaka standar bawaan Python: `hashlib`, `time`, `random`, `json`, `copy`.
   - Tidak memerlukan instalasi `pip` tambahan.
2. **Node.js 18+ & npm**
   - Diperlukan untuk menjalankan simulasi Smart Contract ([scripts/run.js](file:///d:/blockchain/simulasi/scripts/run.js)).
   - Modul `node_modules` (Hardhat, solc, OpenZeppelin, ethers) menggunakan dependensi yang tersedia di direktori `../diploma-registry`.

---

## 🚀 Panduan Menjalankan Simulasi

Buka terminal (PowerShell atau Command Prompt) di dalam folder `simulasi`:

```powershell
cd d:\blockchain\simulasi
```

### 1. Simulasi Kriptografi & Blockchain Dasar (`sim_crypto.py`)
Mendemonstrasikan:
- Hashing SHA-256 terhadap 4 record data ijazah.
- **Avalanche Effect**: perubahan 1 karakter mengubah >50% bit hash.
- **Mini-Blockchain**: validasi rantai blok (`prev_hash`) dan deteksi pemalsuan data (*tampering*).
- **Merkle Tree**: kalkulasi daun, node perantara, Merkle root, dan pembuktian sensitivitas root terhadap modifikasi data.

```powershell
# Menampilkan output di terminal
python sim_crypto.py

# Menyimpan output langsung ke file teks
python sim_crypto.py > crypto_result.txt
```

---

### 2. Simulasi Mekanisme Konsensus (`sim_consensus.py`)
Mendemonstrasikan:
- **Proof of Work (PoW)**: pencarian *nonce* dengan target *difficulty* (3, 4, 5 angka nol di awal hash), pencatatan waktu komputasi & jumlah iterasi.
- **Proof of Stake (PoS)**: simulasi 10.000 putaran pemilihan proposer berdasarkan bobot *stake*.
- **PBFT / QBFT**: toleransi kesalahan Byzantine dengan rumus $f = \lfloor(n-1)/3\rfloor$ dan kuorum $2f+1$ pada berbagai skenario validator mati (*silent*) atau curang (*byzantine*).
- **Simulasi Fork**: resolusi rantai terpanjang (*longest-chain rule*) pada PoW vs *instant finality* pada QBFT.

```powershell
# Menampilkan output di terminal
python sim_consensus.py

# Menyimpan output langsung ke file teks
python sim_consensus.py > consensus_result.txt
```

---

### 3. Simulasi Model UTXO (`sim_utxo.py`)
Mendemonstrasikan:
- Transaksi awal (*Coinbase*) pembagian saldo BTC.
- Pembentukan transaksi transfer dengan alokasi *output* penerima dan *change* (uang kembalian) serta perhitungan *fee*.
- **Pencegahan Double-Spending**: simulasi saat dua transaksi menggunakan UTXO yang sama; mempool dan mining memastikan hanya transaksi pertama yang valid, sedangkan transaksi kedua ditolak saat validasi ulang.

```powershell
# Menampilkan output di terminal
python sim_utxo.py

# Menyimpan output langsung ke file teks
python sim_utxo.py > utxo_result.txt
```

---

### 4. Simulasi Smart Contract Ethereum (`scripts/run.js`)
Mendemonstrasikan kontrak [contracts/DiplomaRegistry.sol](file:///d:/blockchain/simulasi/contracts/DiplomaRegistry.sol):
- Kompilasi kontrak on-the-fly via compiler Solidity (`solc`).
- *Deployment* kontrak ke Hardhat network in-memory (Chain ID 31337).
- Manajemen peran (*Access Control*): *Admin* memberikan peran `ISSUER_ROLE`.
- Penerbitan ijazah (`issue`): penyimpanan hash identitas dan dokumen ke *state* kontrak dengan *event emission*.
- Verifikasi ijazah (`verify`): pengecekan keaslian (fungsi `view` tanpa gas fee).
- Pencabutan ijazah (`revoke`): pengubahan status menjadi `REVOKED` dengan *reason code*.
- Pencegahan akses ilegal: percobaan `issue` oleh akun *non-issuer* otomatis di-*revert*.
- Analisis *Gas Used*, *Gas Price*, dan *Transaction Fee* (ETH).

**Cara Menjalankan (PowerShell):**
```powershell
$env:NODE_PATH="..\diploma-registry\node_modules"; node scripts/run.js
```
*Untuk menyimpan ke file teks:*
```powershell
$env:NODE_PATH="..\diploma-registry\node_modules"; node scripts/run.js > eth_result.txt
```

**Cara Menjalankan (Command Prompt / CMD):**
```cmd
set NODE_PATH=..\diploma-registry\node_modules && node scripts/run.js > eth_result.txt
```

---

## ⚡ Menjalankan Seluruh Simulasi Sekaligus

Untuk mengeksekusi semua simulasi dan memperbarui seluruh file laporan `.txt` dalam satu perintah:

**PowerShell:**
```powershell
python sim_crypto.py > crypto_result.txt; python sim_consensus.py > consensus_result.txt; python sim_utxo.py > utxo_result.txt; $env:NODE_PATH="..\diploma-registry\node_modules"; node scripts/run.js > eth_result.txt
```

---

## 📊 Ringkasan Hasil Simulasi

| File Simulasi | Parameter Uji Utama | Temuan / Hasil Kunci | File Output |
| :--- | :--- | :--- | :--- |
| `sim_crypto.py` | SHA-256, Avalanche, Tampering, Merkle | Perubahan tahun 2026 ke 2025 mengubah 130/256 bit (50.8%). Rantai blok dan Merkle root mendeteksi ketidakvalidan secara instan. | `crypto_result.txt`, `chain.json`, `merkle.json` |
| `sim_consensus.py` | PoW difficulty 3-5, PoS 10k round, QBFT 4-7 node | PoW waktu eksponensial terhadap difficulty; PoS proporsional terhadap stake; QBFT toleran hingga 1 node fault dari 4 validator ($f=1$, $q=3$). | `consensus_result.txt` |
| `sim_utxo.py` | Coinbase, Mempool, Double spend | Transaksi ganda ditolak setelah blok ditambang karena input UTXO asal telah terhapus dari set aktif. | `utxo_result.txt` |
| `scripts/run.js` | Deploy, Issue, Verify, Revoke, AccessControl | Verifikasi sukses tanpa gas (`view`). Non-issuer gagal `issue` (`revert NotIssuer`). Transaksi tercatat pada blok 1-5 dengan rincian gas fee. | `eth_result.txt` |
