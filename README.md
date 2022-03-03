# JavaScript Examples

Working with the Akash network can be done in JavaScript by utilizing the cosmjs library (https://github.com/cosmos/cosmjs). This provides high-level functions which allow JavaScript and Typescript application to send and process secure messages through the network.

##  Wallet Creation

The below code examples show the process for creating a new Akash wallet using cosmjs, and generating new accounts which contain private/public key pairs and their associated addresses.

A new wallet can be initialized by calling `Secp256k1HdWallet.generate` from @cosmjs/launchpad, and passing `{ prefix: "akash" }`.

```
import { Secp256k1HdWallet } from "@cosmjs/launchpad";

// the first parameter for generate is the size of the mnemonic, default is 12
const wallet = await Secp256k1HdWallet
	.generate(undefined, { prefix: "akash" });

```

After the wallet is created, specific private/public key pairs are available via accounts

```
import { Secp256k1HdWallet } from "@cosmjs/launchpad";

const wallet = await Secp256k1HdWallet
	.generate(undefined, { prefix: "akash" });

// gets the first account
const [account] = await wallet.getAccounts();
```

The account address, as well as its public key, are available as properties on this account object.

```
import { Secp256k1HdWallet } from "@cosmjs/launchpad";

const wallet = await Secp256k1HdWallet
	.generate(undefined, { prefix: "akash" });

const [account] = await wallet.getAccounts();

// pull the address and pubKey from the first account
const { address, pubKey } = account;
```

## Private keys and offline signing

Cosmjs does not publicly expose the private key for accounts. Instead, messages are passed into the wallet for signing. Cosmjs provides a signing client in the `stargate` module.

```
import { Secp256k1HdWallet } from "@cosmjs/launchpad";
import { stargate as akashStargate } from "@akashnetwork/akashjs";
import { Registry } from "@cosmjs/proto-signing";
import {
  SigningStargateClient,
  StargateClient,
} from "@cosmjs/stargate";

const wallet = await Secp256k1HdWallet
	.generate(undefined, { prefix: "akash" });

// You can use your own RPC node, or get a list of public nodes from akashjs
const rpcEndpoint = "http://my.rpc.node";

const myRegistry = new Registry([
	...defaultRegistryTypes,
	...akashStargate.registry,
]);

const client = await SigningStargateClient.connectWithSigner(
  rpcEndpoint,
  wallet,
  { registry: myRegistry }
);

const [ account ] = wallet.getAccounts();
const msg = getMessage() // your custom message
const fee = const fee = {
  amount: [
    {
      denom: "uakt",
      amount: "0.1",
    },
  ],
  gas: "1", // 180k
};

const signedMessage = await client.sign(
  account.address,
  [msgAny],
  fee,
  memo
);
```