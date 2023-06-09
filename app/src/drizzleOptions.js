import Web3 from "web3";
import SupplyChain from "./contracts/SupplyChain.json";

const options = {
    web3: {
        block: false,
        customProvider: new Web3("ws://localhost:8545"),
    },
    contracts: [SupplyChain],
    events: {
        SupplyChain: ["Manufactured", "Packed", "ForSale", "Sold", "Shipped", "Received", "Purchased"],
    },
};

export default options;
