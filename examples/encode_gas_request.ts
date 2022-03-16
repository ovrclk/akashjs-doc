import { DirectSecp256k1HdWallet, encodePubkey, Registry } from "@cosmjs/proto-signing";
import { SigningStargateClient } from "@cosmjs/stargate";
import { encodeSecp256k1Pubkey } from "@cosmjs/launchpad";
import Long from 'long';

// import the required message type from akashjs
import { getAkashTypeRegistry, getTypeUrl } from "@akashnetwork/akashjs/build/src/stargate/index";
import { MsgCloseDeployment } from "@akashnetwork/akashjs/build/src/protobuf/akash/deployment/v1beta1/deployment";

// import the request types from cosmjs-types
import { SimulateRequest, SimulateResponse } from "cosmjs-types/cosmos/tx/v1beta1/service";
import { Tx, TxBody, AuthInfo, Fee } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { SignMode } from "cosmjs-types/cosmos/tx/signing/v1beta1/signing";

async function main() {
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

    console.log(JSON.stringify(output));
}

main();
