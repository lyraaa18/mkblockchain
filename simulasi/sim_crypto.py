import hashlib, json
def H(s): return hashlib.sha256(s.encode('utf-8')).hexdigest()

# --- Data dummy (UTF-8, format: id|nim|prodi|tahun|status) ---
records=[
 "R-01|IJZ-0001|NIM-DUMMY-001|Informatika|2026|ACTIVE",
 "R-02|IJZ-0002|NIM-DUMMY-002|Informatika|2026|ACTIVE",
 "R-03|IJZ-0003|NIM-DUMMY-003|Teknik Sipil|2026|ACTIVE",
 "R-04|IJZ-0004|NIM-DUMMY-004|Teknik Industri|2026|REVOKED",
]
print("== 1. Hash SHA-256 per record ==")
for r in records: print(r.split('|')[0], H(r))

print("\n== 2. Uji perubahan input (avalanche) ==")
orig=records[1]; mod=orig.replace("2026","2025")
h1,h2=H(orig),H(mod)
diff=sum(a!=b for a,b in zip(bin(int(h1,16))[2:].zfill(256),bin(int(h2,16))[2:].zfill(256)))
print("asli :",orig,"\n ->",h1); print("ubah :",mod,"\n ->",h2)
print("bit berbeda: %d dari 256 (%.1f%%)"%(diff,diff/256*100))

print("\n== 3. Mini-blockchain ==")
def build(recs):
    chain=[]; prev="0"*64
    for i,r in enumerate(recs):
        cur=H(f"{i}|{prev}|{r}")
        chain.append({"idx":i,"data":r,"prev":prev,"hash":cur}); prev=cur
    return chain
def validate(chain):
    res=[]; prev="0"*64; ok=True
    for b in chain:
        calc=H(f"{b['idx']}|{prev}|{b['data']}")
        valid = ok and b['prev']==prev and b['hash']==calc
        if not (b['prev']==prev and b['hash']==calc): ok=False
        res.append("VALID" if (b['prev']==prev and b['hash']==calc and valid) else "INVALID")
        prev=b['hash']
    return res
chain=build(records)
for b,s in zip(chain,validate(chain)): print(b['idx'],b['prev'][:16]+"..",b['hash'][:16]+"..",s)
print("\n-- Setelah R-02 (blok 1) diubah (tahun 2026 -> 2025), hash tidak dihitung ulang --")
import copy
t=copy.deepcopy(chain); t[1]['data']=mod
for b,s in zip(t,validate(t)): print(b['idx'],b['prev'][:16]+"..",b['hash'][:16]+"..",s)
json.dump({"chain":chain},open("chain.json","w"),indent=1)

print("\n== 4. Merkle tree ==")
leaves=[H(r) for r in records]
l1=[H(leaves[0]+leaves[1]),H(leaves[2]+leaves[3])]
root=H(l1[0]+l1[1])
for i,l in enumerate(leaves): print("L%d"%(i+1),l)
print("N12",l1[0]);print("N34",l1[1]);print("ROOT",root)
ml=[H(r) for r in [records[0],mod,records[2],records[3]]]
r2=H(H(ml[0]+ml[1])+H(ml[2]+ml[3]))
print("ROOT setelah R-02 diubah",r2,"| sama dengan root asli?",r2==root)
json.dump({"leaves":leaves,"n12":l1[0],"n34":l1[1],"root":root,"root_tampered":r2,
 "hash_orig":h1,"hash_mod":h2,"bits":diff,"mod":mod},open("merkle.json","w"),indent=1)
