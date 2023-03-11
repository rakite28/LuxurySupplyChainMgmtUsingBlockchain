import React, { useEffect, useState } from "react"

import Web3 from 'web3'
import TruffleContract from "truffle-contract"
import SupplyChainJSON from "../contracts/SupplyChain.json"

import { connect } from "react-redux"
import * as blockchainConnectionActions from "../actions/blockchainConnection/blockchainConnectionActions"
import './style.css'
import './utilities.css'
const Blockchain = (props) => {

    const emptyAddress = "0x0000000000000000000000000000000000000000"
    const stages = ["Pack Item", "Mark for Sale", "Purchase Item", "Mark Shipped", "Confirm Received", "Purchase Item"]

    useEffect(() => {
        const loadBlockchain = async () => {
            // Wallet
            const provider = Web3.givenProvider || window.ethereum || window.web3.currentProvider;

            // Check if wallet is installed.
            if (!provider) {
                console.warn("Couldn't retrieve any wallet connected to the browser. Using default 'http://localhost:8545'");
                provider = "http://localhost:8545";
            }

            // Web3
            const web3 = new Web3(provider);

            // Check if wallet is accessible ( access granted by user ).
            const accounts = await web3.eth.getAccounts()
            if (accounts.length == 0) {
                throw "Couldn't retrieve any account from the wallet. Please grant access to the wallet."
            };

            const network = await web3.eth.net.getId()
            const account = accounts[0]
            const balance = await web3.eth.getBalance(account)
            const balanceEth = web3.utils.fromWei(balance, 'ether')

            // Contract
            const truffle = TruffleContract(SupplyChainJSON)
            truffle.setProvider(provider)
            truffle.setNetwork(network)
            truffle.deployed().then(contract => {
                // Setup Redux Store
                props.actions.setupConnection({
                    contract: contract,
                    account: account,
                    balance: balanceEth,
                    transactions: []
                })

                syncAllEvents(contract)
            })
        }

        const syncAccountChange = () => {
            window.ethereum.on('accountsChanged', function (accounts) {
                loadBlockchain()
            })
        }

        const syncAllEvents = (contract) => {
            contract.allEvents((err, log) => {
                if (!err) {
                    props.actions.addTransaction(log)
                }
            })
        }

        loadBlockchain()
        syncAccountChange()

        return () => { }
    }, [props.actions])

    const [formData, setFormData] = useState({
        // Role Management
        'role_userID': '',
        'role_role': 'Manufacturer',
        // Manufacture Item
        'item_id': '1',
        'item_name': 'Poco F2 Pro',
        'item_price': '300',
        'item_description': 'MI flagship smart phone release in 2019.',
        // Search Item
        'search_id': ''
    })

    const [outputData, setOutputData] = useState({
        'role_assign': null,
        'role_check': null,
        'role_unassign': null,
        'manufacture_item': null,
        // Search Item
        'search_result': null,
        'search_item': null,
        'step_item_stage': null,
    })

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target
        setFormData(prevFormData => ({
            ...prevFormData,
            [name]: type === "checkbox" ? checked : value
        }))
    }

    const checkRole = (event) => {
        event.preventDefault()

        const contract = props.blockchain.contract
        const account = props.blockchain.account

        const userID = formData.role_userID
        const role = formData.role_role

        if (userID.length != 42) {
            console.error("Invalid address given")
            return
        }

        const getRoleCall = (role) => {
            if (role == "Manufacturer")
                return contract.isManufacturer(userID, { from: account })
            else if (role == "Distributor")
                return contract.isDistributor(userID, { from: account })
            else if (role == "Retailer")
                return contract.isRetailer(userID, { from: account })
            else if (role == "Consumer")
                return contract.isConsumer(userID, { from: account })
            else
                throw ("Unkonwn role selected " + role)
        }

        getRoleCall(role)
            .then(response => {
                if (response == true)
                    setOutputData(prevOutputData => (
                        prevOutputData,
                        { role_check: role + " ✅" }
                    ))
                else
                    setOutputData(prevOutputData => (
                        prevOutputData,
                        { role_check: role + " ❌" }
                    ))
            })
            .catch(error => {
                // TODO: Gracefully show error
                console.error("Error occured while completing transaction", error)
            })
    }

    const assignRole = (event) => {
        event.preventDefault()

        const contract = props.blockchain.contract
        const account = props.blockchain.account

        const userID = formData.role_userID
        const role = formData.role_role

        const getRoleCall = (role) => {
            if (role == "Manufacturer")
                return contract.addManufacturer(userID, { from: account })
            else if (role == "Distributor")
                return contract.addDistributor(userID, { from: account })
            else if (role == "Retailer")
                return contract.addRetailer(userID, { from: account })
            else if (role == "Consumer")
                return contract.addConsumer(userID, { from: account })
            else
                throw ("Unkonwn role selected " + role)
        }

        // TODO: Confirm user `does not` the role to be assigned

        getRoleCall(role)
            .then(response => {
                if (response.receipt.status)
                    setOutputData(prevOutputData => (
                        prevOutputData,
                        { role_assign: "Role assigned successful ✅" }
                    ))
                else
                    setOutputData(prevOutputData => (
                        prevOutputData,
                        { role_assign: "Error occured while assigning role  ❌" }
                    ))
            })
            .catch(error => {
                // TODO: Gracefully show error
                console.error("Error occured while completing transaction", error)
            })
    }

    const unassignRole = (event) => {
        event.preventDefault()

        const contract = props.blockchain.contract
        const account = props.blockchain.account

        const userID = formData.role_userID
        const role = formData.role_role

        const getRoleCall = (role) => {
            if (role == "Manufacturer")
                return contract.renounceManufacturer({ from: account })
            else if (role == "Distributor")
                return contract.renounceDistributor({ from: account })
            else if (role == "Retailer")
                return contract.renounceRetailer({ from: account })
            else if (role == "Consumer")
                return contract.renounceConsumer({ from: account })
            else
                throw ("Unkonwn role selected " + role)
        }

        // TODO: Confirm user `has` the role to be unassigned

        getRoleCall(role)
            .then(response => {
                if (response.receipt.status)
                    setOutputData(prevOutputData => (
                        { ...prevOutputData, role_unassign: "Role unassigned successful ✅" }
                    ))
                else
                    setOutputData(prevOutputData => (
                        { prevOutputData, role_unassign: "Error occured while assigning role  ❌" }
                    ))
            })
            .catch(error => {
                // TODO: Gracefully show error
                console.error("Error occured while completing transaction", error)
            })
    }

    const manufactureItem = (event) => {
        event.preventDefault()

        const { contract, account } = props.blockchain
        const {
            item_id,
            item_name,
            item_price,
            item_description } = formData

        contract.manufactureItem(
            item_id,
            item_name,
            item_description,
            item_price,
            { from: account }
        )
            .then(response => {
                if (response.receipt.status)
                    setOutputData(prevOutputData => (
                        { ...prevOutputData, manufacture_item: "Item manufactured successfully ✅" }
                    ))
                else
                    setOutputData(prevOutputData => (
                        { ...prevOutputData, manufacture_item: "Error occured while manufacturing item  ❌" }
                    ))
            })
            .catch(error => {
                // TODO: Gracefully show error
                console.error("Error occured while completing transaction", error)
            })
    }

    const searchItem = (event) => {
        if (event != undefined) event.preventDefault()

        const { contract, account } = props.blockchain
        const { search_id } = formData

        contract.fetchItem(search_id, { from: account })
            .then(response => {
                if (response.owner != emptyAddress)
                    setOutputData(prevOutputData => ({
                        ...prevOutputData,
                        search_result: true,
                        search_item: response
                    }))
                else
                    setOutputData(prevOutputData => (
                        { ...prevOutputData, search_result: false }
                    ))
            })
            .catch(error => {
                // TODO: Gracefully show error
                console.error("Error occured while completing transaction", error)
            })
    }

    const stepItemStage = () => {
        const { contract, account } = props.blockchain
        const item_id = outputData.search_item.UPC.words[0]
        const item_price = outputData.search_item.price.words[0]
        const item_state = outputData.search_item.state.words[0]

        const getActionMethod = (currentState) => {
            if (currentState == 0)
                return contract.packItem(item_id, { from: account })
            else if (currentState == 1)
                return contract.sellItem(item_id, item_price, { from: account })
            else if (currentState == 2)
                return contract.buyItem(item_id, { from: account, value: item_price })
            else if (currentState == 3)
                return contract.shipItem(item_id, { from: account })
            else if (currentState == 4)
                return contract.receiveItem(item_id, { from: account })
            else if (currentState == 5)
                return contract.purchaseItem(item_id, { from: account })
        }

        getActionMethod(item_state)
            .then(response => {
                if (response.owner != emptyAddress) {
                    setOutputData(prevOutputData => ({
                        ...prevOutputData,
                        step_item_stage: "Transaction completed successfully ✅"
                    }))
                    searchItem()
                } else
                    setOutputData(prevOutputData => ({
                        ...prevOutputData,
                        step_item_stage: "Error occured while completing transaction  ❌"
                    }))
                searchItem()
            })
            .catch(error => {
                // TODO: Gracefully show error
                console.error("Error occured while completing transaction", error)
            })
    }

    return (






        <div>
            <div class="navbar">
                <div class="container flex">
                    <h1 class="logo">LORD OF LUXURY.</h1>
                    <nav>
                        <ul>
                            <li><a href="index.html">Home</a></li>
                            <li><a href="features.html">Features</a></li>
                            {/* <!-- <li><a href="docs.html">Docs</a></li> --> */}
                            <li><a href="#lb">Our Partners</a></li>
                            <li><a href="">Transaction History</a></li>
                            <li><a href="">Logged In As</a></li>
                        </ul>
                    </nav>
                </div>
            </div>

            <section class="showcase">
                <div class="container grid">
                    <div class="showcase-text">
                        <h1>Exclusive. Authentic. Secure.</h1>
                        <p>One Stop Destination to seize <b>Counterfeit Luxury goods</b>, <b>Fradulent Transactions</b> &
                            maintain <b>transparency</b>. A secure supply chain management system.</p>
                        <a href="features.html" class="btn btn-outline">Read More</a>
                    </div>
                    <div class="showcase-form card">
                        <h2>Register your company!</h2>
                        <form>
                            <div class="form-control">
                                <input type="text" name="name" placeholder="Name" required />
                            </div>
                            <div class="form-control">
                                <input type="text" name="company" placeholder="Company Name" required />
                            </div>
                            <div class="form-control">
                                <input type="email" name="email" placeholder="Email" required />
                            </div>
                            <input type="submit" value="Send" class="btn btn-primary" />
                        </form>
                    </div>
                </div>
            </section>
            <br />
            <br />
            <br />
            <br />
            <br />

            <section class="languages">
                <h2 class="md text-center my-2">
                    <b id="lb">Our Partners</b>
                </h2>
                <div class="container flex">
                    <div class="card">
                        <h4>Gucci</h4>
                        <img src="gucci.png" height='80' width="10" alt="" />
                    </div>
                    <div class="card">
                        <h4>Burberry</h4>
                        <img src="images/burberry.jpg" height='80' width="10" alt="" />
                    </div>
                    <div class="card">
                        <h4>Louis Vuitton</h4>
                        <img src="images/lvlogo.png" height='80' width="10" alt="" />
                    </div>
                    <div class="card">
                        <h4>Versace</h4>
                        <img src="images/versace1.png" height='80' width="10" alt="" />
                    </div>
                    <div class="card">
                        <h4>Gant</h4>
                        <img src="images/Gant1.png" height='80' width="10" alt="" />
                    </div>
                    <div class="card">
                        <h4>Givenchy</h4>
                        <img src="images/givenchy.png" height='80' width="10" alt="" />
                    </div>
                </div>
            </section>

            <section class="cloud bg-primary my-2 py-2">
                <div class="container grid">
                    <div class="text-center">
                        <h2 class="lg">Modern technology.</h2>
                        <p class="lead my-1">Smart Contracts. Provenance Tracking like you've never seen. Transparent, efficient
                            and privacy
                            maintained.</p>
                        <a href="features.html" class="btn btn-dark">Read More</a>
                    </div>
                    <img src="images/cloud.png" alt="" />
                </div>
            </section>



            <section class="cli">
                <div class="container grid">
                    <img src="images/cli.png" alt="" />
                    <div class="card">
                        <h3>Easy to use + verified security</h3>
                    </div>
                    <div class="card">
                        <h3>Royalty points</h3>
                    </div>
                </div>
            </section>


            <section class="features-head bg-primary py-3">
                <div class="container grid">
                    <div>
                        <h1 class="xl">Service Guaranteed</h1>
                        <p class="lead">
                            Check out the services provided by LORD OF LUXURY that separate us from the competition</p>
                    </div>
                    <img src="images/logos/server.png" alt="" />
                </div>
            </section>


            <section class="features-sub-head bg-light py-3">
                <div class="container grid">
                    <div>
                        <h1 class="md">The LORD OF LUXURY Platform</h1>
                        <p>
                            We provide realistic and efficient solutions like Provenance Tracking, Smart Contracts, Supply chain
                            transparency and privacy.
                        </p>
                    </div>
                    <img src="images/logos/server2.png" alt="" />
                </div>
            </section>

            <section class="features-main my-2">
                <div class="container grid grid-3">
                    <div class="card flex">
                        <i class="fas fa-server fa-3x"></i>
                        <p>
                            Provenance tracking: Blockchain is used to create a tamper-proof record of the journey of each
                            luxury good</p>
                    </div>
                    <div class="card flex">
                        <i class="fas fa-network-wired fa-3x"></i>
                        <p>
                            Smart Contracts: Blockchain is used to automate transactions and ensure that payments are made more
                            securely and efficiently.
                        </p>
                    </div>
                    <div class="card flex">
                        <i class="fas fa-laptop-code fa-3x"></i>
                        <p>
                            Supply chain transparency: Blockchain is used to provide end-to-end transparency of the supply
                            chain.
                        </p>
                    </div>
                    <div class="card flex">
                        <i class="fas fa-database fa-3x"></i>
                        <p>
                            Privacy: Blockchain can be use to ensure complete privacy.
                        </p>
                    </div>
                    <div class="card flex">
                        <i class="fas fa-power-off fa-3x"></i>
                        <p>
                            Plus Royalty Points: The businesses get added Royalty points each time they do business with us.
                        </p>
                    </div>
                    <div class="card flex">
                        <i class="fas fa-upload fa-3x"></i>
                        <p>
                            Simple:Businesses can easily register and get associated with our services.

                        </p>
                    </div>
                </div>
            </section>
            <section class="stats">
                <div class="container">
                    <h3 class="stats-heading text-center my-1">
                        Welcome to the best platform for safe and secure transactions.
                    </h3>

                    <div class="grid grid-3 text-center my-4">
                        <div>
                            <img src="images/handshake.jpeg" height="100" width="0.02"></img>
                            <h3>10k+</h3>
                            <p class="text-secondary">Satisfied businesses</p>
                        </div>
                        <div>
                            <img src="images/truck.png"></img>
                            {/* <i class="fas fa-upload fa-3x"></i> */}
                            <h3>1Lakh+</h3>
                            <p class="text-secondary">Goods supplied</p>
                        </div>
                        <div>
                            <img src="images/bss.jpeg" height="200"></img>
                            {/* <i class="fas fa-project-diagram fa-3x"></i> */}
                            <h3>60K+</h3>
                            <p class="text-secondary">Customers</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer class="footer bg-dark py-5">
                <div class="container grid grid-3">
                    <div>
                        <h1>LORD OF LUXURY.</h1>
                        <p>Copyright &copy; 2023</p>
                    </div>
                    <nav>
                        <ul>
                            <li><a href="index.html">Home</a></li>
                            <li><a href="features.html">Features</a></li>
                            {/* <li><a href="docs.html">Docs</a></li> */}
                            <li><a href="#lb">Our Partners</a></li>
                            <li><a href="">Transaction History</a></li>
                            <li><a href="">Logged In As</a></li>
                        </ul>
                    </nav>
                    <div class="social">
                        <a href="#"><i class="fab fa-github fa-2x"></i></a>
                        <a href="#"><i class="fab fa-facebook fa-2x"></i></a>
                        <a href="#"><i class="fab fa-instagram fa-2x"></i></a>
                        <a href="#"><i class="fab fa-twitter fa-2x"></i></a>
                    </div>
                </div>
            </footer>

            <div className="section">
                <h1>Open Chain</h1>
                <p>Selected account is {props.blockchain.account}</p>
                <p>Selected account balance is {props.blockchain.balance} Eth
                </p>
            </div>


            {/* Roles Management */}
            <div className="section">
                <h1>Roles Managements</h1>
                <div>
                    <form onSubmit={event => event.preventDefault()}>
                        <label htmlFor="role_userID">User ID </label>
                        <input
                            type="text"
                            placeholder="User ID"
                            id="role_userID"
                            name="role_userID"
                            value={formData.role_userID}
                            onChange={handleInputChange}
                            required
                            minLength="12"
                        />
                        <br />
                        <label htmlFor="role_role">Role </label>
                        <select
                            id="role_role"
                            name="role_role"
                            onChange={handleInputChange}
                            value={formData.role_role}>
                            <option value="Manufacturer">Manufacturer</option>
                            <option value="Distributor">Distributor</option>
                            <option value="Retailer">Retailer</option>
                            <option value="Consumer">Consumer</option>
                        </select>
                        <br />
                        <p>
                            <button onClick={checkRole}>Check Role</button>
                            {outputData.role_check != null ? outputData.role_check : ''}
                        </p>
                        <p>
                            <button onClick={assignRole}>Assign Role</button>
                            {outputData.role_assign != null ? outputData.role_assign : ''}
                        </p>
                        <p>You can only renounce your roles (not for annother account).</p>
                        <p>
                            <button onClick={unassignRole}>Unassign Role</button>
                            {outputData.role_unassign != null ? outputData.role_unassign : ''}
                        </p>
                    </form>
                </div>
            </div>

            {/* Item Managemnet */}
            <div className="section">
                <h1>Manufacture Item</h1>
                <form onSubmit={manufactureItem}>
                    <label htmlFor="item_id">SKU </label>
                    <input
                        type="number"
                        placeholder="ID"
                        id="item_id"
                        name="item_id"
                        value={formData.item_id}
                        onChange={handleInputChange}
                        required
                    />
                    <br />
                    <label htmlFor="item_name">Name </label>
                    <input
                        type="text"
                        placeholder="Name"
                        id="item_name"
                        name="item_name"
                        value={formData.item_name}
                        onChange={handleInputChange}
                        required
                    />
                    <br />
                    <label htmlFor="item_description">Description </label>
                    <input
                        type="text"
                        placeholder="Name"
                        id="item_description"
                        name="item_description"
                        value={formData.item_description}
                        onChange={handleInputChange}
                        required
                    />
                    <br />
                    <label htmlFor="item_price">Price </label>
                    <input
                        type="number"
                        placeholder="Price"
                        id="item_price"
                        name="item_price"
                        value={formData.item_price}
                        onChange={handleInputChange}
                        required
                    />
                    <br />
                    <button>Manufacture</button>
                    <p>{outputData.manufacture_item != null ? outputData.manufacture_item : ''}</p>
                </form>
            </div>
            <div className="section">
                <h1>Search Item</h1>
                <form onSubmit={searchItem}>
                    <label>Item SKU </label>
                    <input
                        type="number"
                        placeholder="SKU"
                        id="search_id"
                        name="search_id"
                        value={formData.search_id}
                        onChange={handleInputChange}
                        required
                    />
                    <button>Search</button>
                    {outputData.search_result == false && <p>No item found 😕</p>}
                    {outputData.search_result && (
                        <table>
                            <tbody>
                                <tr>
                                    <td><strong>UPC</strong></td>
                                    <td>{outputData.search_item.UPC.words[0]}</td>
                                </tr>
                                <tr>
                                    <td><strong>Name</strong></td>
                                    <td>{outputData.search_item.name}</td>
                                </tr>
                                <tr>
                                    <td><strong>Description</strong></td>
                                    <td>{outputData.search_item.description}</td>
                                </tr>
                                <tr>
                                    <td><strong>Price</strong></td>
                                    <td>£{outputData.search_item.price.words[0]}</td>
                                </tr>
                                <tr>
                                    <td><strong>Manufacturer ID</strong></td>
                                    <td>{outputData.search_item.manufacturerID}</td>
                                </tr>
                                <tr>
                                    <td><strong>Distributor ID</strong></td>
                                    <td>{outputData.search_item.distributorID}</td>
                                </tr>
                                <tr>
                                    <td><strong>Retailer ID</strong></td>
                                    <td>{outputData.search_item.retailerID}</td>
                                </tr>
                                <tr>
                                    <td><strong>Consumer ID</strong></td>
                                    <td>{outputData.search_item.consumerID}</td>
                                </tr>
                                <tr>
                                    <td><strong>Timeline</strong></td>
                                    <table>
                                        <tr>
                                            <td>Manufactured</td>
                                            <td>{outputData.search_item.state.words[0] >= 0 ? "✅" : "❌"}</td>
                                        </tr>
                                        <tr>
                                            <td>Packed</td>
                                            <td>{outputData.search_item.state.words[0] >= 1 ? "✅" : "❌"}</td>
                                        </tr>
                                        <tr>
                                            <td>For Sale</td>
                                            <td>{outputData.search_item.state.words[0] >= 2 ? "✅" : "❌"}</td>
                                        </tr>
                                        <tr>
                                            <td>Sold</td>
                                            <td>{outputData.search_item.state.words[0] >= 3 ? "✅" : "❌"}</td>
                                        </tr>
                                        <tr>
                                            <td>Shipped</td>
                                            <td>{outputData.search_item.state.words[0] >= 4 ? "✅" : "❌"}</td>
                                        </tr>
                                        <tr>
                                            <td>Received</td>
                                            <td>{outputData.search_item.state.words[0] >= 5 ? "✅" : "❌"}</td>
                                        </tr>
                                        <tr>
                                            <td>Purchased</td>
                                            <td>{outputData.search_item.state.words[0] >= 6 ? "✅" : "❌"}</td>
                                        </tr>
                                    </table>
                                </tr>
                                <tr>
                                    <td>
                                        {
                                            outputData.search_item.state.words[0] != 6
                                            &&
                                            <button onClick={stepItemStage}>{stages[outputData.search_item.state.words[0]]}</button>
                                        }
                                    </td>
                                    <td><p>{outputData.step_item_stage}</p></td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </form>
            </div>

            {/* Transactions */}
            <div className="section">
                <h1>Transactions</h1>
                {props.blockchain.transactions.length == 0 && <p>No recent transactions to show.</p>}
                <ul>
                    {props.blockchain.transactions.map((transaction, index) => (
                        <li key={index}>
                            {transaction.event} : {transaction.transactionHash}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

/**
 * Redux Configuration
 */

const mapStateToProps = (state) => {
    return {
        blockchain: state.blockchain
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        actions: {
            setupConnection: (details) => dispatch(blockchainConnectionActions.setupConnection(details)),
            addTransaction: (details) => dispatch(blockchainConnectionActions.addTransaction(details))
        },
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Blockchain)
