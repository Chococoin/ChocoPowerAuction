const ChocoPowerAuction = artifacts.require("ChocoPowerAuction");

module.exports = function(deployer) {
  deployer.deploy(ChocoPowerAuction);
};