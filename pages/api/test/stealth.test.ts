import { describe, it, expect } from "vitest"
import { generateViewingPrivateKey } from "../stealth"
import { utils } from "ethers"

describe("ens functions", () => {
    it("just true", async () => {
        const prvKey = generateViewingPrivateKey("lambda.eth")
        expect(prvKey).to.equal(
            "0x5179f4bd2beffb77f6bc000bd9651b476413ecdcf4094ed5e3cac268657ef3c3",
        )
    })
})
