
from web3 import Web3, EthereumTesterProvider

w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
#w3 = Web3(EthereumTesterProvider())
print(w3.isConnected())
print(w3.eth.get_block('latest'))
print(w3.eth.accounts)#accounts list
