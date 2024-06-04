import { Keypair } from "@solana/web3.js"
import { writeJson } from "fs-extra"

const main = async () => {
  const airdropMap = new Map<string, number>()
  for (let i = 0; i < 500; i++) {
    const keypair = Keypair.generate()
    const address = keypair.publicKey.toBase58()
    airdropMap.set(address, 10000)
  }
  const airdropAmountArr = Object.values(Object.fromEntries(airdropMap))
  const totalAirdropAmount = airdropAmountArr.reduce((a, b) => a + b, 0)
  console.log("token total airdrop amount: ", totalAirdropAmount)
  const airdropJson = Object.fromEntries(airdropMap)
  await writeJson("./data/airdrop.json", airdropJson)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(`error: ${error.stack}`)
    process.exit(1)
  })
