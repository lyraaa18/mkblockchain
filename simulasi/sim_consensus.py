import hashlib, time, random
def H(s): return hashlib.sha256(s.encode()).hexdigest()

print("== A. Simulasi Proof of Work (blok berisi 4 transaksi dummy) ==")
tx="tx1|tx2|tx3|tx4"; prev="0"*64
for diff in (3,4,5):
    t=time.time(); n=0
    while True:
        h=H(f"{prev}|{tx}|{n}")
        if h.startswith("0"*diff): break
        n+=1
    dt=time.time()-t
    print(f"difficulty={diff} nol heksa: nonce={n} percobaan={n+1} waktu={dt:.3f}s hash={h[:24]}..")

print("\n== B. Simulasi PoS (pemilihan proposer berbobot stake, 10.000 putaran, seed=7) ==")
random.seed(7)
stake={"Kampus-A":40,"Kampus-B":30,"Kampus-C":20,"Regulator":10}
cnt={k:0 for k in stake}
for _ in range(10000):
    cnt[random.choices(list(stake),weights=stake.values())[0]]+=1
for k,v in cnt.items(): print(f"{k}: stake {stake[k]}% -> terpilih {v/100:.1f}%")

print("\n== C. Simulasi PBFT/QBFT (n=4 validator) ==")
def qbft(n,faulty_silent=0,faulty_byz=0,seed=1):
    random.seed(seed)
    f=(n-1)//3; q=2*f+1
    vals=list(range(n))
    byz=set(range(n-faulty_byz,n))
    silent=set(range(n-faulty_byz-faulty_silent,n-faulty_byz))
    proposer=0; block_hash=H("block-1")
    # pre-prepare: proposer broadcast; prepare: honest validators vote same hash
    prepares=0; commits=0
    for v in vals:
        if v in silent: continue
        if v in byz: continue   # byzantine vote hash lain -> tidak dihitung ke hash yang benar
        prepares+=1
    committed = prepares>=q
    return f,q,prepares,committed
print("rumus: toleransi f=floor((n-1)/3), kuorum=2f+1")
for n,s,b in [(4,0,0),(4,1,0),(4,0,1),(4,2,0),(4,1,1),(7,2,0)]:
    f,q,p,ok=qbft(n,s,b)
    print(f"n={n} validator mati={s} byzantine={b} -> f={f} kuorum={q} suara sah={p} => {'BLOK FINAL (commit)' if ok else 'GAGAL / halt (tidak final)'}")

print("\n== D. Simulasi fork (dua blok bersaing di tinggi 5, PoW longest-chain) ==")
random.seed(3)
A=5;B=5;step=0
print("t0: blok#5a (penambang X) dan blok#5b (penambang Y) ditemukan hampir bersamaan -> fork")
while A==B:
    step+=1
    if random.random()<0.5: A+=1
    else: B+=1
print(f"setelah {step} blok berikutnya, rantai {'A' if A>B else 'B'} lebih panjang ({max(A,B)} vs {min(A,B)}); rantai lain jadi orphan/stale")
print("Pada QBFT: satu blok per tinggi, finality langsung -> tidak ada fork.")
