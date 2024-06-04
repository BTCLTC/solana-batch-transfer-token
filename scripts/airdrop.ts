import base58 from "bs58"
import { readJson } from "fs-extra"
import { BN } from "@coral-xyz/anchor"
import { ComputeBudgetProgram, Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js"
import { chunk } from "./utils"
import { RPC_URL } from "./constants"
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress
} from "@solana/spl-token"

// TODO: change this
const privateKey = ""
const wallet = Keypair.fromSecretKey(base58.decode(privateKey))

console.log("wallet address: ", wallet.publicKey.toBase58())

// TODO: change this
const token = new PublicKey("")

// TODO: change this
const decimals = 6

const connection = new Connection(RPC_URL, "confirmed")

function delay(seconds = 0.5) {
  return new Promise(resolve => {
      setTimeout(resolve, seconds * 1000)
  })
}

const main = async () => {
  const json = await readJson("./data/airdrop.json")
  const arr = []
  for (let [key, value] of Object.entries(json)) {
    arr.push({
      [key]: value
    })
  }
  const list = chunk(arr, 8)
  for (const i of list) {
    const transaction = new Transaction()

    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 100000
      }),
    )

    for (const j of i) {
      const address = new PublicKey(Object.keys(j)[0])
      const amount = Object.values(j)[0] as number
      console.log(`${address}: ${amount}`)

      await delay()
      const destinationTokenAccount = await getAssociatedTokenAddress(token, address)

      await delay()
      const tokenAccountInfo = await connection.getAccountInfo(destinationTokenAccount)
      if (!tokenAccountInfo) {
        await delay()
        transaction.add(
          await createAssociatedTokenAccountInstruction(wallet.publicKey, destinationTokenAccount, address, token)
        )
      }

      await delay()
      const source = await getAssociatedTokenAddress(token, wallet.publicKey)
      transaction.add(
        createTransferInstruction(source, destinationTokenAccount, wallet.publicKey, new BN(amount).mul(new BN(10 ** decimals)).toNumber(), [wallet])
      )
    }

    const recentBlockhash = await connection.getLatestBlockhash()
    transaction.recentBlockhash = recentBlockhash.blockhash
    transaction.lastValidBlockHeight = recentBlockhash.lastValidBlockHeight

    transaction.sign(wallet)
    let signature = await sendAndConfirmTransaction(connection, transaction, [wallet])
    console.log(`send token tx: https://solscan.io/tx/${signature}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(`error: ${error.stack}`)
    process.exit(1)
  })
