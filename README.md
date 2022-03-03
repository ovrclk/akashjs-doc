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
const { address, pubkey } = account;
```

## Private Keys and Offline Signing

Cosmjs does not publicly expose the private key for accounts. Instead, messages are passed into the wallet for signing. This can be done directly, as shown below.

```ts
import { Secp256k1HdWallet, StdSignDoc } from "@cosmjs/launchpad";

function getMessage(): StdSignDoc {
  // implements custom message
}

const wallet = await Secp256k1HdWallet
    .generate(undefined, { prefix: "akash" });

const [account] = await wallet.getAccounts();
const msg = getMessage(); // your custom message

const signedMessage = await wallet.signAmino(
    account.address,
    msg
);
```

## Validating An Address

Currently neither `cosmjs` or `akashjs` have methods of directly validating addresses. A basic validation can be done in JavaScript using either a RegEx or by attempting to convert the address to a public key.

## Unsigned Transactions

Basic transactions that do not requiring signing (such as querying) can be done using the basic RPC capabilities build into `akashjs`. For example, to query the list of deployments an RPC request can be created as such.

```ts
import {
    QueryDeploymentsResponse,
    QueryDeploymentsRequest,
    QueryClientImpl
} from "@akashnetwork/akashjs/build/protobuf/akash/deployment/v1beta1/query";
import { getRpc } from "@akashnetwork/akashjs/build/rpc"

const request = QueryDeploymentsRequest.fromJSON({
    filters: {
        owner: "akashSomeOwnerAddress",
    }
});
```

Once the request has been created, it can be passed to the appropriate <Service>ClientImpl method (`Deployments` in this case).

```ts
const client = new QueryClientImpl(getRpc("http://your.rpc.node"));
const response = await client.Deployments(request);
const data = QueryDeploymentsResponse.toJSON(response);
```

## Signed Transactions

For transactions that requiring signing, requests must be passed through the signing client. Basic setup is the same as for any signed requests. For the message, the appropriate message type can be imported from `akashjs`. Below is an example of a deployment close message.

```ts
import { Secp256k1HdWallet } from "@cosmjs/launchpad";
import { stargate as akashStargate } from "@akashnetwork/akashjs";
import { Registry } from "@cosmjs/proto-signing";
import {
  SigningStargateClient,
  StargateClient,
} from "@cosmjs/stargate";

// import the required message type from akashjs
import { MsgCloseDeployment } from "@akashnetwork/akashjs/protobuf/akash/deployment/v1beta1/deployment";

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

// Use the encode method for the message to wrap the data
const message = MsgCloseDeployment.encode(
  MsgCloseDeployment.fromJSON({
    id: {
      dseq: "555555"
      owner: 'ownerAddress'
    }
  })
}).finish();

// Set the appropriate typeUrl and attach the encoded message as the value
const msgAny = {
  typeUrl: "akash.deployment.v1beta1.Msg/CloseDeployment",
  value: message
});

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