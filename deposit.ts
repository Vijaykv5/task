import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as fs from "fs";

const WALLET_PATH = "./sender.json";
const MINT_ADDRESS = "AwhajeMUqqWLLTfbNzaqGfdpY193FZ3hLU7bhAYs9Jqw"; //My own mint address 
const AMOUNT = 1_000_000;
const RPC_ENDPOINT = "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey("Q5v9W72xJaP3J39EnwhPm6LBgmUPTEkSQwtqgLFQaLw");

function loadKeypair(path: string): Keypair {
  const secret = JSON.parse(fs.readFileSync(path, "utf8"));
  return Keypair.fromSecretKey(new Uint8Array(secret));
}

(async () => {
  const connection = new Connection(RPC_ENDPOINT, "confirmed");
  const sender = loadKeypair(WALLET_PATH);
  const mint = new PublicKey(MINT_ADDRESS);
  const amount = BigInt(AMOUNT);

  const [vaultPDA] = await PublicKey.findProgramAddress(
    [Buffer.from("vault"), sender.publicKey.toBuffer()],
    PROGRAM_ID
  );
  console.log("Vault PDA:", vaultPDA.toBase58());

  const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    sender,
    mint,
    sender.publicKey
  );
  console.log("Sender token account:", senderTokenAccount.address.toBase58());

  const vaultTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    sender,
    mint,
    vaultPDA,
    true
  );
  console.log("Vault token account:", vaultTokenAccount.address.toBase58());

  const data = Buffer.alloc(1 + 8);
  data.writeUInt8(0, 0);
  data.writeBigUInt64LE(amount, 1);

  const keys = [
    { pubkey: senderTokenAccount.address, isSigner: false, isWritable: true },
    { pubkey: vaultTokenAccount.address, isSigner: false, isWritable: true },
    { pubkey: sender.publicKey, isSigner: true, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  const ix = {
    keys,
    programId: PROGRAM_ID,
    data,
  };
  const tx = new Transaction().add(ix);

  const sig = await sendAndConfirmTransaction(connection, tx, [sender]);
  console.log("Deposit transaction signature:", sig);
})();
