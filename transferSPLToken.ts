import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, transfer, getAccount } from "@solana/spl-token";
import fs from "fs";

function loadKeypair(path: string): Keypair {
  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(path, "utf-8")));
  return Keypair.fromSecretKey(secretKey);
}

(async () => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const senderKeypair = loadKeypair("./sender.json"); 
  const recipientPubkey = new PublicKey(
    "DoNjkSH9e3bYRtpvzPVXMMHg8UbKn5y2eFGh2DecQnv5"
  ); 
  const mintAddress = new PublicKey(
    "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
  ); // Have SPL token mint address here
  const amount = 1 * 10 ** 6;

  //Get ATA for sender and recipient
  const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    senderKeypair,
    mintAddress,
    senderKeypair.publicKey
  );


  const senderAccountInfo = await getAccount(connection, senderTokenAccount.address);
  if (Number(senderAccountInfo.amount) < amount) {
    console.error(
      `Sender does not have enough tokens. Balance: ${Number(senderAccountInfo.amount)}, Required: ${amount}`
    );
    process.exit(1);
  }

  const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    senderKeypair,
    mintAddress,
    recipientPubkey
  );


  const txSignature = await transfer(
    connection,
    senderKeypair,
    senderTokenAccount.address,
    recipientTokenAccount.address,
    senderKeypair,
    amount
  );

  console.log("Transfer successful. Signature:", txSignature);
})();
