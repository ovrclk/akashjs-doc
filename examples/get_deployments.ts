import {
    QueryDeploymentsResponse,
    QueryDeploymentsRequest,
    QueryClientImpl
} from "@akashnetwork/akashjs/build/protobuf/akash/deployment/v1beta1/query";
import { getRpc } from "@akashnetwork/akashjs/build/rpc"

async function main() {
    const request = QueryDeploymentsRequest.fromJSON({
        filters: {
            owner: "akash1usm9umrgzckc2pa873cmqwqplr9kuur95mz3v6",
        }
    });

    const client = new QueryClientImpl(getRpc("http://135.181.181.122:28957"));
    const response = await client.Deployments(request);
    const data = QueryDeploymentsResponse.toJSON(response);

    console.log(data)
}

main();