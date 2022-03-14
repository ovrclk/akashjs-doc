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

The REST API does not expose a general method for estimating the gas for a transaction. However, a message with the `simulate` flag can be used to request an estimation from a node.

Creating a message like this can be generated using the same method as linked to above.

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