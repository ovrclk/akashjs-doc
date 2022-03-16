// import the request types from cosmjs-types
import { SimulateResponse } from "cosmjs-types/cosmos/tx/v1beta1/service";

async function main() {
    const response = Buffer.from(
        "CgQQnv...",
        "base64"
    )

    console.log(
        JSON.stringify(
            SimulateResponse.decode(response)
        )
    )
}

main();
