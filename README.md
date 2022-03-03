# JavaScript Examples

Working with the Akash network can be done in JavaScript by utilizing the cosmjs library (https://github.com/cosmos/cosmjs). This provides high-level functions which allow JavaScript and Typescript application to send and process secure messages through the network.

##  Wallet Creation

The below code examples show the process for creating a new Akash wallet using cosmjs, and generating new accounts which contain private/public key pairs and their associated addresses.

A new wallet can be initialized by calling `Secp256k1HdWallet.generate` from @cosmjs/launchpad, and passing `{ prefix: "akash" }`.

```ts
import { Secp256k1HdWallet } from "@cosmjs/launchpad";

// the first parameter for generate is the size of the mnemonic, default is 12
const wallet = await Secp256k1HdWallet
	.generate(undefined, { prefix: "akash" });

```

After the wallet is created, specific private/public key pairs are available via accounts

```ts
import { Secp256k1HdWallet } from "@cosmjs/launchpad";

const wallet = await Secp256k1HdWallet
	.generate(undefined, { prefix: "akash" });

// gets the first account
const [account] = await wallet.getAccounts();
```

The account address, as well as its public key, are available as properties on this account object.

```ts
import { Secp256k1HdWallet } from "@cosmjs/launchpad";

const wallet = await Secp256k1HdWallet
	.generate(undefined, { prefix: "akash" });

const [account] = await wallet.getAccounts();

// pull the address and pubKey from the first account
const { address, pubKey } = account;
```

## Private Keys and Offline Signing

Cosmjs does not publicly expose the private key for accounts. Instead, messages are passed into the wallet for signing. Cosmjs provides a signing client in the `stargate` module.

```ts
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
const fee = {
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

## Broadcasting Signed Messages

The signing client includes the ability to also broadcast the signed message. Simply replace the `sign` call to `signAndBroadcast`.

```ts
import { Secp256k1HdWallet } from "@cosmjs/launchpad";
import { stargate as akashStargate } from "@akashnetwork/akashjs";
import { Registry } from "@cosmjs/proto-signing";
import {
  assertIsBroadcastTxSuccess,
  SigningStargateClient,
  StargateClient,
} from "@cosmjs/stargate";

// ...

const signedMessage = await client.signAndBroadcast(
  account.address,
  [msgAny],
  fee,
  memo
);

assertIsBroadcastTxSuccess(result);
```

## Validating An Address

Currently neither `cosmjs` or `akashjs` have methods of directly validating addresses. A basic validation can be done in JavaScript using the following method.

```ts
function validateAddress(address: string) {
	const buffer = Buffer.from
}
```

## Unsigned Transactions

Basic transactions that do not requiring signing (such as querying) can be done using the basic RPC capabilities build into akashjs. For example, to query the list of deployments an RPC request can be created as such.

```ts
import { getRpc } from "../src/rpc";
import {
    QueryClientImpl,
    QueryDeploymentsRequest,
    QueryDeploymentsResponse
} from "../src/protobuf/akash/deployment/v1beta1/query";

const request = QueryDeploymentsRequest.fromJSON({
    filters: {
        owner: "akash-address",
    }
});
```

Once the request has been created, it can be passed to the appropriate ClientImpl method (`Deployments` in this case).

```ts
const client = new QueryClientImpl(getRpc("http://my.rpc.node"));
const response = await client.Deployments(request);
const data = QueryDeploymentResponse.toJSON(response);
```

## Signed Transactions

For transactions that requiring signing, requests must be passed through the signing client. 


```ts
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

const msg = 

const fee = const fee = {
  amount: [
    {
      denom: "uakt",
      amount: "0.1",
    },
  ],
  gas: "1", // 180k
};

const signedMessage = await client.signAndBroadcast(
  account.address,
  [msgAny],
  fee,
  memo
);
```