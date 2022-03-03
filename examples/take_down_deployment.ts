import { Secp256k1HdWallet } from "@cosmjs/launchpad";
import { stargate as akashStargate } from "@akashnetwork/akashjs";
import { Registry } from "@cosmjs/proto-signing";
import {
    defaultRegistryTypes,
    SigningStargateClient,
    StargateClient,
} from "@cosmjs/stargate";

// import the required message type from akashjs
import { MsgCloseDeployment } from "@akashnetwork/akashjs/build/protobuf/akash/deployment/v1beta1/deployment";

async function main() {

    const wallet = await Secp256k1HdWallet
        .generate(undefined, { prefix: "akash" });

    // Use the encode method for the message to wrap the data
    const message = MsgCloseDeployment.encode(
        MsgCloseDeployment.fromJSON({
            id: {
                dseq: "555555",
                owner: 'ownerAddress'
            }
        })
    ).finish();

    // Set the appropriate typeUrl and attach the encoded message as the value
    const msgAny = {
        typeUrl: "akash.deployment.v1beta1.Msg/CloseDeployment",
        value: message
    };

    // You can use your own RPC node, or get a list of public nodes from akashjs
    const rpcEndpoint = "http://my.rpc.node";

    const myRegistry = new Registry([
        ...defaultRegistryTypes,
        ...akashStargate.registry as any,
    ]);

    const client = await SigningStargateClient.connectWithSigner(
        rpcEndpoint,
        wallet,
        { registry: myRegistry }
    );

    const [account] = await wallet.getAccounts();

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
}

main();