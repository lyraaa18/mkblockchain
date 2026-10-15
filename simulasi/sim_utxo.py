import hashlib, itertools
def H(s): return hashlib.sha256(s.encode()).hexdigest()
BTC=100_000_000
class Ledger:
    def __init__(s): s.utxo={}; s.mempool=[]; s.height=0
    def coinbase(s,addr,amt):
        txid=H(f"coinbase|{addr}|{amt}|{len(s.utxo)}"); s.utxo[(txid,0)]=(addr,amt); return txid
    def make_tx(s,inputs,outputs):
        ins=sorted(inputs); body=f"{ins}|{outputs}"
        return {"txid":H(body),"inputs":ins,"outputs":outputs}
    def validate(s,tx):
        total_in=0
        for i in tx["inputs"]:
            if i not in s.utxo: return False,"UTXO tidak ada / sudah dibelanjakan (double spend)"
            total_in+=s.utxo[i][1]
        total_out=sum(a for _,a in tx["outputs"])
        if total_out>total_in: return False,"output > input"
        return True,total_in-total_out
    def submit(s,tx):
        ok,info=s.validate(tx)
        if ok: s.mempool.append(tx); return True,info
        return False,info
    def mine(s):
        s.height+=1; mined=[]
        for tx in s.mempool:
            ok,info=s.validate(tx)
            if not ok: continue
            for i in tx["inputs"]: del s.utxo[i]
            for n,(addr,amt) in enumerate(tx["outputs"]): s.utxo[(tx["txid"],n)]=(addr,amt)
            mined.append((tx["txid"],info))
        s.mempool=[]; return mined
L=Ledger()
fund=L.coinbase("Alice",int(1.0*BTC))
print("UTXO awal Alice:",fund[:16]+"..:0 = 1.00000000 BTC (simulasi)")
tx1=L.make_tx([(fund,0)],[("Bob",int(0.30*BTC)),("Alice(change)",int(0.6995*BTC))])
ok,fee=L.submit(tx1); print("\nTx1 dikirim ke mempool:",ok,"fee =",fee/BTC,"BTC")
print("Tx1 ID:",tx1["txid"])
print("Input :",fund[:16]+"..:0 (1.00000000 BTC)")
for n,(a,amt) in enumerate(tx1["outputs"]): print(f"Output {n}: {a} {amt/BTC:.8f} BTC")
# double spend: UTXO yang sama dibelanjakan ke Carol
tx2=L.make_tx([(fund,0)],[("Carol",int(0.50*BTC)),("Alice(change)",int(0.4995*BTC))])
ok2,info2=L.submit(tx2)
print("\nTx2 (double spend UTXO yang sama) masuk mempool? ",ok2,"| mempool sederhana menerima karena UTXO masih belum terkonfirmasi")
print("Tx2 ID:",tx2["txid"])
m=L.mine()
print("\nBlok #1 ditambang. Transaksi terkonfirmasi:")
for t,f in m: print(" ",t[:16]+".. fee",f/BTC)
print("Tx2 setelah blok #1 -> divalidasi ulang:", L.validate(tx2))
print("\nUTXO set akhir:")
for (t,n),(a,amt) in L.utxo.items(): print(f"  {t[:16]}..:{n} {a} {amt/BTC:.8f} BTC")
print("\nKonfirmasi: Tx1 terkonfirmasi 1 (di blok #1)")
