# Working with Akash REST API

Below are examples of how to use the REST API for Akash to query and broadcast messages to the blockchain using curl. 

## Query URLs

A list of endpoints which expose a REST API can be found in the metadata file for any of the Akash networks. These metadata files are available at the following URLs:

### mainnet
https://raw.githubusercontent.com/ovrclk/net/master/mainnet/meta.json

### testnet
https://raw.githubusercontent.com/ovrclk/net/master/testnet/meta.json

### edgenet
https://raw.githubusercontent.com/ovrclk/net/master/edgenet/meta.json

The REST endpoints can be found in the `apis` > `rest` section.

```json
"apis": {
	...
    "rest": [
	  ...
      {
        "address": "http://135.181.181.122:1518"
      },
	  ...
    ]
}
```

For any node, you can query it's `node_info` endpoint to test the nodes responsive, and check its version support.

```sh
curl -s http://<rest node>/node_info
```

## Queries Paths

A Swagger document defining the REST API that Akash nodes expose can be found [here](https://raw.githubusercontent.com/ovrclk/akash/mainnet/main/client/docs/swagger-ui/swagger.yaml)

## Querying Blocks

Block are available via the `/blocks` path.  You can either query a block directly using its height, or you can query the latest block specifically. This query takes either the block height or `latest` as its parameter.

For example, to query block `55555`, you could query it using curl like so:

```sh 
curl -s http://<rest node>/blocks/55555
```

Similarly, you could query the latest block by replacing the block height with the keyword `latest`.

```sh 
curl -s http://<rest node>/blocks/latest
```

The query will return the full block data as a JSON object. The model for the return value can be found in the Swagger document linked above. If specific values are of interest, a utility such as `jq` can be used. For example to get the height of the latest block, the output of curl can be passed to `jq`.

```sh 
curl -s http://<rest node>/blocks/latest | jq -r '.block.header.height'
```
	
## Broadcasting Transactions

To broadcast a transaction, the signed transaction message must be compiled ahead of time and assembled into the appropriate JSON message format. An example of a basic message, for example publishing a certificate, the message would look like this:

```json
{
  "tx": {
    "msg": [
		"akaskMsgIQD02fs....",
    ],
    "fee": {
      "gas": 15000,
      "amount": [
        {
          "denom": "uakt",
          "amount": "50000"
        }
      ]
    },
    "memo": "broadcast certificate",
    "signature": {
      "signature": "MEUCIQD02fsDPra8MtbRsyB1w7bqTM55Wu138zQbFcWx4+CFyAIge5WNPfKIuvzBZ69MyqHsqD8S1IwiEp+iUb6VSdtlpgY=",
      "pub_key": {
        "type": "tendermint/PubKeySecp256k1",
        "value": "Avz04VhtKJh8ACCVzlI8aTosGy0ikFXKIVHQ3jKMrosH"
      },
      "account_number": "0",
      "sequence": "0"
    }
  },
  "mode": "block"
}
```

The `mode` of the message will determine how/what the request returns. The possible values are `block`, `sync` or `async`.

- `block`: Will return once the message is added to a block, but before the block is verified.
- `sync`: Will return only once the block has been validated.
- `aysnc`: Will return immediately.

The message and signature must be generated via an offline signer using the appropriate wallet/keys. See [this document](https://github.com/ovrclk/akashjs-doc/blob/main/README.md) for using an example of using akashjs to generate this.

This message can be placed into a file, and passed into curl to broadcast it to Akash. 
The query endpoint for transactions is the `/txs` endpoint. 

```sh
curl -s -X POST -H "Content-Type: application/json" -d @data.json http://<rest node>/txs
```

Since broadcasting is a mutating action, it must be submitted via a POST request, with the content types set to JSON. This is accomplished in curl by passing in `-X POST` to set the HTTP method, and `-H "Content-Type: application/json"` to set the content type.

## Estimate Gas Fees

The REST API does not expose a general method for estimating the gas for a transaction. If an estimation of gas fees is required, the messages can be simulated using the RPC API available though akashjs. Please see [this document](https://github.com/ovrclk/akashjs-doc/blob/main/README.md) for details.

It is possible to send a request to the RPC API manually; however, this will require encoding and decoding the request. The general procedure is similar to using cosmjs to handle the RPC as detailed above, however the message will be output from the script rather than being sent to the build-in RPC client.

```ts
const mnemonic = "your mnemonic"
const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: "akash" });

// We need to first setup the message we want to get an estimate for
const [account] = await wallet.getAccounts();
const message = MsgCloseDeployment.fromPartial({
    id: {
        dseq: "555555",
        owner: account.address,
    }
});

const msgAny = {
    typeUrl: getTypeUrl(MsgCloseDeployment),
    value: message
};

// Next we setup a client so we can get the sequence for the account
const rpcEndpoint = "http://your.rpc.node";
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
const chainAccount = await client.getAccount(account.address);

// Now we can build the simulate request
const encodedMessage = myRegistry.encodeAsAny(msgAny);
const signer = encodeSecp256k1Pubkey(account.pubkey);
const request = SimulateRequest.fromPartial({
    tx: Tx.fromPartial({
        authInfo: AuthInfo.fromPartial({
            fee: Fee.fromPartial({}),
            signerInfos: [
                {
                    publicKey: encodePubkey(signer),
                    sequence: Long.fromNumber(chainAccount.sequence, true),
                    modeInfo: { single: { mode: SignMode.SIGN_MODE_UNSPECIFIED } },
                },
            ],
        }),
        body: TxBody.fromPartial({
            messages: Array.from([encodedMessage]),
            memo: "get estimate",
        }),
        signatures: [new Uint8Array()],
    })
});

// With our request build we can encode it and output in JSON format
const output = {
    jsonrpc: "2.0",
    "id": 0,
    "method": "abci_query",
    "params": {
        "path": "/cosmos.tx.v1beta1.Service/Simulate",
        "data": Buffer.from(SimulateRequest.encode(request).finish()).toString("hex"),
        "prove": false
    }
}

// output to the console
console.log(JSON.stringify(output));
```

This encoded message can be put into a file, then passed to curl for transmission using the method outlined above. It's important to node that when using this method, the request must be sent to an RPC node rather than a REST node as outlined in the Query URLs section. The request should look similar to:

```sh
curl -s -X POST -H "Content-Type: application/json" -d @simulate-request.json http://<rpc node>/
```

The value returned from the request will be encoded and contained in a JSON-RPC object.

```json
{
  "jsonrpc": "2.0",
  "id": 0,
  "result": {
    "response": {
      "code": 0,
      "log": "",
      "info": "",
      "index": "0",
      "key": null,
      "value": "CgQQnvM...",
      "proofOps": null,
      "height": "123456",
      "codespace": ""
    }
  }
}
```

To get the gas estimate, the `value` of the response will need to be decoded. This can be done with a simple script as shown below.


```ts
const response = Buffer.from(
    "CgQQnvM...",
    "base64"
)

console.log(
    JSON.stringify(
        SimulateResponse.decode(response)
    )
)
```

The base64-encoded content of the `value` property can be passed into `Buffer.from`. This will convert it into a Buffer than can then be passed to `SimulateResponse` for decoding. The returned value will look like this:

```json
{
  gasInfo: {
    gasWanted: Long { low: 0, high: 0, unsigned: true },
    gasUsed: Long { low: 178590, high: 0, unsigned: true }
  },
  result: {
    log: '...',
    events: [
      ...
    ],
    data: '...'
  }
}
```

The contents in `result` can be ignore in this case. The gas-estimate data is contained in the gasInfo property, specifically in the `gasUsed.low` field.

## Getting Transaction Status

The status for a specific transaction can be requested using the transaction hash. The hash can be passed into the `txs` endpoint as the `tx.hash` query parameter.

```sh
curl -s http://<rest node>/txs?tx.hash=<hash id>
```

The returned object will be structured as such:

```json
  "total_count": "1",
  "count": "1",
  "page_number": "1",
  "page_total": "1",
  "limit": "30",
  "txs": [
	  ...
  ]
```

The `txs` property is a list of transactions, however if the endpoint is queried using a single hash, this list will only contain the specific transaction requested. The transaction will contain both the details of the transaction, and a log of it's processing.

```json
    {
      "height": "123456",
      "txhash": "...",
      "data": "...",
      "raw_log": "..."
      "logs": [
        {
          "events": [
			...
            {
              "type": "message",
              "attributes": [
				...
                {
                  "key": "<attribute key>",
                  "value": "<attribute value>"
                }
				...
              ]
            },
			...
          ]
        }
      ],
      "gas_wanted": "500000",
      "gas_used": "2500000",
      "tx": {
	   ...
	  },
      "timestamp": "2022-03-11T18:45:34Z"
    }
```

The `log` property will contain a list of all the events that occurred during the processing of the transaction. The same data can also be found as a JSON encoded string in the `raw_log` property.

The `tx` property contains a summarization of the transaction it's self. Its format is as follows:

```json
{
  "type": "cosmos-sdk/StdTx",
  "value": {
    "msg": [
      {
        "type": "cosmos-sdk/SomeMsgType",
        "value": {
          "delegator_address": "akash...",
          "validator_address": "akashvaloper..."
        }
      },
	  ...
    ],
    "fee": {
      "amount": [
        {
          "denom": "uakt",
          "amount": "5000"
        }
      ],
      "gas": "800000"
    },
    "signatures": [
      {
        "pub_key": {
          "type": "tendermint/PubKeySecp256k1",
          "value": "xxx"
        },
        "signature": "Abc123="
      }
    ],
    "memo": "",
    "timeout_height": "0"
  }
}
```

`msg` will contain a list of all the messages associated with the transactions. `fee` will contain the fee and gas for the transaction, and `signatures` the required authorization data.