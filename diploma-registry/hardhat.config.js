require("@nomicfoundation/hardhat-toolbox");

/** Konfigurasi minimal: kompilasi dan test di jaringan lokal bawaan Hardhat (in-memory). */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
};
