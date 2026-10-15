const hre = require("hardhat"); const fs=require("fs"); const path=require("path"); const solc=require("solc");
function imp(p){ try{ return {contents: fs.readFileSync(require.resolve(p.startsWith("@")?p:path.join(__dirname,"..",p)),"utf8")}; }catch(e){ try{return {contents:fs.readFileSync(path.join(__dirname,"..","node_modules",p),"utf8")}}catch(e2){return {error:"not found "+p}} } }
const src=fs.readFileSync("contracts/DiplomaRegistry.sol","utf8");
const out=JSON.parse(solc.compile(JSON.stringify({language:"Solidity",sources:{"DiplomaRegistry.sol":{content:src}},settings:{optimizer:{enabled:true,runs:200},outputSelection:{"*":{"*":["abi","evm.bytecode.object"]}}}}),{import:imp}));
if(out.errors) out.errors.filter(e=>e.severity==="error").forEach(e=>{console.error(e.formattedMessage);process.exit(1)});
const c=out.contracts["DiplomaRegistry.sol"].DiplomaRegistry;
(async()=>{
  const {ethers}=hre; const [admin,issuer,verifier]=await ethers.getSigners();
  const net=await ethers.provider.getNetwork();
  console.log("Jaringan: Hardhat in-memory, chainId =",net.chainId.toString());
  const F=new ethers.ContractFactory(c.abi,"0x"+c.evm.bytecode.object,admin);
  const reg=await F.deploy(); const dr=await reg.deploymentTransaction().wait();
  const addr=await reg.getAddress();
  const show=(label,tx,r)=>{ const fee=r.gasUsed*r.gasPrice;
    console.log(`\n[${label}]\n tx hash   : ${r.hash}\n block     : ${r.blockNumber}\n from      : ${r.from}\n to        : ${r.to}\n value     : ${tx.value} wei\n gas limit : ${tx.gasLimit}\n gas used  : ${r.gasUsed}\n gas price : ${r.gasPrice} wei (${ethers.formatUnits(r.gasPrice,"gwei")} gwei)\n fee       : ${fee} wei (${ethers.formatEther(fee)} ETH)\n status    : ${r.status===1?"1 (success)":"0 (reverted)"}`);
    return r;};
  show("Deploy DiplomaRegistry",reg.deploymentTransaction(),dr); console.log(" contract  :",addr);
  const t1=await reg.connect(admin).addIssuer(issuer.address); show("addIssuer",t1,await t1.wait());
  const id=ethers.id("IJZ-0001-salt"), h=ethers.sha256(ethers.toUtf8Bytes("PDF-IJAZAH-DUMMY-0001"));
  const t2=await reg.connect(issuer).issue(id,h); const r2=await t2.wait(); show("issue(id, docHash)",t2,r2);
  const ev=r2.logs.map(l=>reg.interface.parseLog(l)).filter(Boolean)[0];
  console.log(" event     :",ev.name,"| id =",ev.args[0],"| docHash =",ev.args[1],"| issuer =",ev.args[2],"| issuedAt =",ev.args[3].toString());
  console.log(" id        :",id,"\n docHash   :",h);
  const v=await reg.connect(verifier).verify(id,h); console.log("\n[verify (view, tanpa gas)] valid =",v[0],"status =",["NONE","ACTIVE","REVOKED"][Number(v[1])]);
  const v2=await reg.connect(verifier).verify(id,ethers.sha256(ethers.toUtf8Bytes("PDF-DIUBAH"))); console.log("[verify hash berubah] valid =",v2[0]);
  const t3=await reg.connect(issuer).revoke(id,2); const r3=await t3.wait(); show("revoke(id, reason=2)",t3,r3);
  const v3=await reg.verify(id,h); console.log("[verify setelah revoke] valid =",v3[0],"status =",["NONE","ACTIVE","REVOKED"][Number(v3[1])]);
  try{ await reg.connect(verifier).issue(ethers.id("x"),ethers.id("y")); }catch(e){ console.log("\n[issue oleh non-issuer] revert:",e.message.includes("NotIssuer")?"NotIssuer":e.message.slice(0,80)); }
  const blk=await ethers.provider.getBlock("latest"); console.log("\nBlok terakhir:",blk.number,"| baseFeePerGas =",blk.baseFeePerGas.toString(),"| gasLimit blok =",blk.gasLimit.toString());
})();
