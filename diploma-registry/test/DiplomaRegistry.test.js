// Test DiplomaRegistry. Semua data DUMMY. Nomor T-xx mengikuti tabel test case di laporan (Bab 6.3).
const { expect } = require("chai");
const { ethers } = require("hardhat");

const Status = { NONE: 0n, ACTIVE: 1n, REVOKED: 2n };

// Simulasi proses off-chain di middleware kampus:
// hash dokumen = SHA-256 dari isi PDF; id = pseudonim dari NIM dummy + salt rahasia.
const pdfBytes = (text) => ethers.toUtf8Bytes(text);
const docHashOf = (text) => ethers.sha256(pdfBytes(text));
const idOf = (nimDummy) => ethers.keccak256(ethers.toUtf8Bytes(nimDummy + "|SALT-DUMMY-123"));
const REASON_FRAUD = ethers.keccak256(ethers.toUtf8Bytes("ACADEMIC_FRAUD"));

describe("DiplomaRegistry (data dummy, jaringan lokal Hardhat)", function () {
  let reg, admin, issuerA, issuerB, outsider;
  let id1, h1;

  beforeEach(async function () {
    [admin, issuerA, issuerB, outsider] = await ethers.getSigners();
    reg = await (await ethers.getContractFactory("DiplomaRegistry")).deploy(admin.address);
    await reg.waitForDeployment();
    await reg.connect(admin).addIssuer(issuerA.address);
    await reg.connect(admin).addIssuer(issuerB.address);
    id1 = idOf("NIM-DUMMY-0001");
    h1 = docHashOf("ISI-PDF-IJAZAH-DUMMY-0001");
  });

  it("T-01 (happy, REQ-01) issuer terdaftar menerbitkan ijazah -> ACTIVE + event CredentialIssued", async function () {
    await expect(reg.connect(issuerA).issue(id1, h1)).to.emit(reg, "CredentialIssued");
    const c = await reg.getCredential(id1);
    expect(c.status).to.equal(Status.ACTIVE);
    expect(c.docHash).to.equal(h1);
    expect(c.issuer).to.equal(issuerA.address);
  });

  it("T-02 (happy, REQ-02) verify dengan hash yang benar -> valid = true", async function () {
    await reg.connect(issuerA).issue(id1, h1);
    const [valid, status, issuer] = await reg.verify(id1, h1);
    expect(valid).to.equal(true);
    expect(status).to.equal(Status.ACTIVE);
    expect(issuer).to.equal(issuerA.address);
  });

  it("T-03 (negatif, REQ-03) dokumen diubah -> hash berbeda -> valid = false", async function () {
    await reg.connect(issuerA).issue(id1, h1);
    const hTampered = docHashOf("ISI-PDF-IJAZAH-DUMMY-0001-DIUBAH");
    const [valid] = await reg.verify(id1, hTampered);
    expect(valid).to.equal(false);
  });

  it("T-04 (happy, REQ-04) revoke oleh penerbit -> REVOKED + event CredentialRevoked", async function () {
    await reg.connect(issuerA).issue(id1, h1);
    await expect(reg.connect(issuerA).revoke(id1, REASON_FRAUD)).to.emit(reg, "CredentialRevoked");
    const c = await reg.getCredential(id1);
    expect(c.status).to.equal(Status.REVOKED);
    expect(c.reasonCode).to.equal(REASON_FRAUD);
  });

  it("T-05 (negatif, REQ-04) verify ijazah yang sudah dicabut -> valid = false, status REVOKED", async function () {
    await reg.connect(issuerA).issue(id1, h1);
    await reg.connect(issuerA).revoke(id1, REASON_FRAUD);
    const [valid, status] = await reg.verify(id1, h1);
    expect(valid).to.equal(false);
    expect(status).to.equal(Status.REVOKED);
  });

  it("T-06 (unauthorized, REQ-01) akun non-issuer menerbitkan -> revert NotIssuer", async function () {
    await expect(reg.connect(outsider).issue(id1, h1)).to.be.revertedWithCustomError(reg, "NotIssuer");
  });

  it("T-07 (unauthorized, REQ-01) issuer B mencabut ijazah milik issuer A -> revert NotCredentialIssuer", async function () {
    await reg.connect(issuerA).issue(id1, h1);
    await expect(reg.connect(issuerB).revoke(id1, REASON_FRAUD)).to.be.revertedWithCustomError(reg, "NotCredentialIssuer");
  });

  it("T-08 (negatif, REQ-01) menerbitkan id atau hash yang sama dua kali -> revert AlreadyIssued", async function () {
    await reg.connect(issuerA).issue(id1, h1);
    await expect(reg.connect(issuerA).issue(id1, docHashOf("LAIN"))).to.be.revertedWithCustomError(reg, "AlreadyIssued");
    await expect(reg.connect(issuerA).issue(idOf("NIM-DUMMY-0002"), h1)).to.be.revertedWithCustomError(reg, "AlreadyIssued");
  });

  it("T-09 (happy, REQ-05) amandemen -> lama REVOKED (AMENDMENT), baru ACTIVE, supersededBy terisi", async function () {
    await reg.connect(issuerA).issue(id1, h1);
    const id1b = idOf("NIM-DUMMY-0001-REV1");
    const h1b = docHashOf("ISI-PDF-IJAZAH-DUMMY-0001-KOREKSI");
    await expect(reg.connect(issuerA).amend(id1, id1b, h1b)).to.emit(reg, "CredentialAmended");
    const oldC = await reg.getCredential(id1);
    const newC = await reg.getCredential(id1b);
    expect(oldC.status).to.equal(Status.REVOKED);
    expect(oldC.reasonCode).to.equal(await reg.REASON_AMENDMENT());
    expect(oldC.supersededBy).to.equal(id1b);
    expect(newC.status).to.equal(Status.ACTIVE);
    expect(newC.docHash).to.equal(h1b);
  });

  it("T-10 (unauthorized, REQ-07) akun non-admin memanggil pause -> revert NotAdmin", async function () {
    await expect(reg.connect(outsider).pause()).to.be.revertedWithCustomError(reg, "NotAdmin");
    await expect(reg.connect(issuerA).addIssuer(outsider.address)).to.be.revertedWithCustomError(reg, "NotAdmin");
  });

  it("T-11 (negatif, REQ-08) saat paused: issue ditolak, verify tetap berjalan", async function () {
    await reg.connect(issuerA).issue(id1, h1);
    await expect(reg.connect(admin).pause()).to.emit(reg, "Paused");
    await expect(reg.connect(issuerA).issue(idOf("NIM-DUMMY-0002"), docHashOf("X"))).to.be.revertedWithCustomError(reg, "ContractPaused");
    const [valid] = await reg.verify(id1, h1);
    expect(valid).to.equal(true);
    await reg.connect(admin).unpause();
    await expect(reg.connect(issuerA).issue(idOf("NIM-DUMMY-0002"), docHashOf("X"))).to.emit(reg, "CredentialIssued");
  });

  it("T-12 (recovery, REQ-08) kunci issuer A bocor -> admin cabut A dan daftarkan A2", async function () {
    const [, , , , issuerA2] = await ethers.getSigners();
    await reg.connect(admin).removeIssuer(issuerA.address);
    await expect(reg.connect(issuerA).issue(id1, h1)).to.be.revertedWithCustomError(reg, "NotIssuer");
    await reg.connect(admin).addIssuer(issuerA2.address);
    await expect(reg.connect(issuerA2).issue(id1, h1)).to.emit(reg, "CredentialIssued");
  });

  it("T-13 (privasi, REQ-06) state dan event tidak memuat data pribadi dummy", async function () {
    const namaDummy = "Budi Dummy";
    const nimDummy = "NIM-DUMMY-0001";
    const tx = await reg.connect(issuerA).issue(id1, h1);
    const receipt = await tx.wait();
    const c = await reg.getCredential(id1);

    // Gabungkan semua data log event dan seluruh isi state menjadi satu string hex.
    const logHex = receipt.logs.map((l) => l.data + l.topics.join("")).join("").toLowerCase();
    const stateHex = [c.docHash, c.issuer, c.reasonCode, c.supersededBy].join("").toLowerCase();
    const hex = (s) => ethers.hexlify(ethers.toUtf8Bytes(s)).slice(2).toLowerCase();

    for (const pii of [namaDummy, nimDummy]) {
      expect(logHex.includes(hex(pii))).to.equal(false);
      expect(stateHex.includes(hex(pii))).to.equal(false);
    }
    // Catatan: tes ini membuktikan kontrak tidak punya field PII dan middleware hanya mengirim hash/ID pseudonim.
    // Ia tidak bisa mencegah middleware yang salah mengirim PII sebagai id; itu dikendalikan di sisi off-chain.
  });
});
