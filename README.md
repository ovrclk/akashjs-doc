# JavaScript Examples

Working with the Akash network can be done in JavaScript by utilizing the cosmjs library (https://github.com/cosmos/cosmjs). This provides high-level functions which allow JavaScript and Typescript application to send and process secure messages through the network.

##  Wallet Creation

The following code shows an example of the process for creating a new Akash wallet. The wallet can be used to access accounts which contain private/public key pairs and their associated addresses.

A new wallet can be initialized by calling `Secp256k1HdWallet.generate` from @cosmjs/launchpad, and passing `{ prefix: "akash" }`.

```ts
import { Secp256k1HdWallet } from "@cosmjs/launchpad";

// the first parameter for generate is the size of the mnemonic, default is 12
const wallet = await Secp256k1HdWallet
	.generate(undefined, { prefix: "akash" });

```

After the wallet is created, specific private/public key pairs are available via `getAccounts`.

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

Basic transactions that do not requiring signing (such as querying) can be done using the basic RPC capabilities build into `akashjs`. For example, to query the list of deployments, an RPC request can be created as such.

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

For transactions that requiring signing, requests must be passed through the signing client. [AkashJS](https://github.com/ovrclk/akashjs) provides cosmjs compatible implementations of the Akash message types.

To create the message, the appropriate _type_ can be imported from `akashjs`.

```ts
import { MsgCloseDeployment } from "@akashnetwork/akashjs/build/src/protobuf/akash/deployment/v1beta1/deployment";

```

This type contains the methods needed to construct a message that can then be passed into a Stargate client to be signed and broadcast.

```ts
const mnemonic = "your wallet mnemonic";
const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: "akash" });

// get first account
const [account] = await wallet.getAccounts();

// Use the encode method for the message to wrap the data
const message = MsgCloseDeployment.fromPartial({
    id: {
        dseq: "555555",
        owner: account.address,
    }
});

// Set the appropriate typeUrl and attach the encoded message as the value
const msgAny = {
    typeUrl: getTypeUrl(MsgCloseDeployment),
    value: message
};

// You can use your own RPC node, or get a list of public nodes from akashjs
const rpcEndpoint = "http://my.rpc.node";

// The akash types need to be registered with the client
const myRegistry = new Registry(
    getAkashTypeRegistry()
);

const client = await SigningStargateClient.connectWithSigner(
    rpcEndpoint,
    wallet,
    {
        registry: myRegistry
    }
);

const fee = {
    amount: [
        {
            denom: "uakt",
            amount: "5000",
        },
    ],
    gas: "800000",
};

const signedMessage = await client.signAndBroadcast(
    account.address,
    [msgAny],
    fee,
    "take down deployment"
);
```

## Estimating Gas

When sending transactions, it can be useful to get an estimate of the gas required for a given message. This can be done using the `simulate` method of the signing client which will send the passed in message to an RPC node which will return the estimated gas for that transaction. Before is an example of doing this for the same transaction as shown above.

```ts
    const mnemonic = "your wallet mnemonic";
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: "akash" });

    // get first account
    const [account] = await wallet.getAccounts();

    // Use the encode method for the message to wrap the data
    const message = MsgCloseDeployment.fromPartial({
        id: {
            dseq: "555555",
            owner: account.address,
        }
    });

    // Set the appropriate typeUrl and attach the encoded message as the value
    const msgAny = {
        typeUrl: getTypeUrl(MsgCloseDeployment),
        value: message
    };

    // You can use your own RPC node, or get a list of public nodes from akashjs
    const rpcEndpoint = "http://my.rpc.node";

    const myRegistry = new Registry(
        getAkashTypeRegistry()
    );

    const client = await SigningStargateClient.connectWithSigner(
        rpcEndpoint,
        wallet,
        {
            registry: myRegistry
        }
    );

    const gas = await client.simulate(
        account.address,
        [msgAny],
        "take down deployment"
    );

    console.log(gas);
```