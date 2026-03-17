require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    hoodi: {
      url: "https://eth-hoodi.g.alchemy.com/v2/sBUwi2hKRRmcGTTafh7fqRhE6rFI2baY",
      accounts: ["d88326d5f312705eb09fa20383b074c23754f91437be357a842b90aaaebe129f"],
    },
  },

};
