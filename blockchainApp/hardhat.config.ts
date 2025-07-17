import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
      },
      {
        // Seaport 依存
        version: "0.8.17",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  typechain: {
    outDir: "frontend/types",
    target: "ethers-v6",
    alwaysGenerateOverloads: false,
    // externalArtifacts: ['externalArtifacts/*.json'],
  },
};

export default config;
