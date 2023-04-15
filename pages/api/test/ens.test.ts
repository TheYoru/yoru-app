import { describe, it, expect } from "vitest";
import { getAddrFromEns, getTextRecordFromEns } from "../ens";

describe("ens functions", () => {
  it("return the correct address", async () => {
    const addr = await getAddrFromEns("lambda.eth");
    console.log(addr);
    expect(addr[0]).to.equal("0xD0a5266b2515c3b575e30cBC0cfC775FA4fC6660");
  });
  it("return the correct telegram handler", async () => {
    const telegramHandler = await getTextRecordFromEns(
      "lambda.eth",
      "org.telegram"
    );
    console.log(telegramHandler);
    expect(telegramHandler[0]).to.equal("@lalambdada");
  });
});
