import {Aptos} from "@olton/aptos";

export const initAptos = () => {
    globalThis.aptos = new Aptos(config.aptos.api)
}

export const cacheLedger = async () => {
    try {
        cache.ledger = await aptos.getLedger()
    } finally {
        setTimeout(cacheLedger, 3000)
    }
}