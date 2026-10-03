const BASE=100000;
const CANDIDATES=[["2330","台積電"],["2454","聯發科"],["2308","台達電"],["2382","廣達"],["3231","緯創"]];
const FALLBACK={"2330":980,"2454":1320,"2308":410,"2382":285,"3231":118};
let P=CANDIDATES.map(x=>({code:x[0],name:x[1],score:null,price:FALLBACK[x[0]],date:"",tags:["等待計算"],real:false,why:"等待 TWSE 資料"}));
let S=JSON.parse(localStorage.ssa11||'{"cash":100000,"h":[],"t":[],"r":0}');
const money=n=>"NT$"+Number(n).toLocaleString("zh-TW",{maximumFractionDigits:2}),save=()=>localStorage.ssa11=JSON.stringify(S);
const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
function monthKeys(){
 let d=new Date(),r=[];
 for(let i=0;i<3;i++){let x=new Date(d.getFullYear(),d.getMonth()-i,1);r.push(`${x.getFullYear()}${String(x.getMonth()+1).padStart(2,"0")}01`)}
 return r;
}
async function history(code){
 let all=[];
 for(const date of monthKeys()){
  const u=`https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?date=${date}&stockNo=${code}&response=json`;
  const r=await fetch(u,{cache:"no-store"}); if(!r.ok)throw Error("TWSE");
  const j=await r.json();
  (j.data||[]).forEach(z=>{let close=Number(String(z[6]).replace(/,/g,"")),vol=Number(String(z[1]).replace(/,/g,""));if(close>0)all.push({date:z[0],close,vol})});
 }
 let m=new Map(all.map(x=>[x.date,x]));return [...m.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
function calc(h){
 if(h.length<21)throw Error("history");
 let c=h.map(x=>x.close),v=h.map(x=>x.vol),last=c.at(-1),ma5=avg(c.slice(-5)),ma20=avg(c.slice(-20));
 let r5=(last/c.at(-6)-1)*100,r20=(last/c.at(-21)-1)*100,vr=avg(v.slice(-5))/Math.max(1,avg(v.slice(-20)));
 let rets=c.slice(-20).map((x,i,a)=>i?Math.abs(x/a[i-1]-1)*100:0).slice(1),vol=avg(rets);
 let score=50;
 score+=last>ma5?8:-8; score+=ma5>ma20?12:-12;
 score+=Math.max(-12,Math.min(12,r5*1.5)); score+=Math.max(-12,Math.min(12,r20*.6));
 score+=vr>1.15?8:vr<.8?-5:0; score-=Math.max(0,(vol-3)*2);
 score=Math.max(0,Math.min(100,Math.round(score)));
 let tags=[];if(last>ma5&&ma5>ma20)tags.push("多頭趨勢");if(r5>0)tags.push("5日動能");if(r20>0)tags.push("20日動能");if(vr>1.15)tags.push("量能放大");if(!tags.length)tags.push("偏弱觀察");
 return{score,last,r5,r20,vr,ma5,ma20,tags};
}
async function load(){
 let ok=0,res=[];
 for(const [code,name] of CANDIDATES){
  try{let h=await history(code),x=calc(h),z=h.at(-1);res.push({code,name,score:x.score,price:x.last,date:z.date,tags:x.tags,real:true,why:`5日 ${x.r5.toFixed(1)}%｜20日 ${x.r20.toFixed(1)}%｜5/20日均線 ${x.ma5.toFixed(1)}/${x.ma20.toFixed(1)}｜量比 ${x.vr.toFixed(2)}`});ok++}
  catch(e){res.push({code,name,score:null,price:FALLBACK[code],date:"",tags:["示範備援"],real:false,why:"官方資料讀取或歷史筆數不足，未產生策略分數"})}
 }
 P=res.sort((a,b)=>(b.score??-1)-(a.score??-1)).slice(0,5);
 dataBadge.textContent=ok===5?"TWSE 策略計算":ok?"部分官方資料":"示範資料";
 dataNotice.textContent=ok?`Strategy v1.4 已用 TWSE 歷史日行情計算趨勢、5/20日動能與量能分數。候選池目前固定為 5 檔，這不是全市場 AI 選股，也不是投資建議。`:"TWSE 資料目前無法完整取得，已使用示範價格；不產生假的策略分數。";
 render();
}
function metrics(){let m=0,c=0;S.h.forEach(h=>{let s=P.find(x=>x.code==h.code);if(s){m+=s.price*h.qty;c+=h.cost}});let u=m-c,total=S.cash+m;return{u,total,p:total-BASE,rate:(total-BASE)/BASE*100}}
function buy(i){let s=P[i];if(S.cash<s.price)return alert("可用現金不足");S.cash-=s.price;let h=S.h.find(x=>x.code==s.code);h?(h.qty++,h.cost+=s.price):S.h.push({code:s.code,name:s.name,qty:1,cost:s.price});S.t.unshift({a:"買進",name:s.name,code:s.code,price:s.price,time:new Date().toLocaleString("zh-TW"),source:s.real?"TWSE收盤":"示範"});save();render()}
function sell(code){let h=S.h.find(x=>x.code==code),s=P.find(x=>x.code==code);if(!h||!s)return;let av=h.cost/h.qty,d=s.price-av;S.cash+=s.price;S.r+=d;h.qty--;h.cost-=av;S.t.unshift({a:"賣出",name:s.name,code,price:s.price,d,time:new Date().toLocaleString("zh-TW"),source:s.real?"TWSE收盤":"示範"});if(!h.qty)S.h=S.h.filter(x=>x.code!=code);save();render()}
function render(){
 list.innerHTML=P.map((s,i)=>`<article class="stock"><div class="head"><div><h3>${s.name} <span class="code">${s.code}</span></h3><div class="chips">${s.tags.map(x=>`<span class="chip">${x}</span>`).join("")}</div></div><div><div class="score">${s.score===null?"未評分":"策略 "+s.score}</div><div class="price">${money(s.price)}</div><span class="label">${s.real?"TWSE 收盤價":"示範價格"}</span></div></div><div class="grid"><div><span class="label">資料日期</span><b>${s.date||"—"}</b></div><div><span class="label">行情類型</span><b>${s.real?"非即時收盤":"示範"}</b></div><div><span class="label">資料來源</span><b>${s.real?"TWSE":"內建備援"}</b></div><div><span class="label">策略版本</span><b>v1.4</b></div></div><p class="reason"><b>計算摘要：</b>${s.why}</p><button class="buy" onclick="buy(${i})">模擬買進 1 股</button></article>`).join("");
 holds.innerHTML=S.h.length?S.h.map(h=>{let s=P.find(x=>x.code==h.code);if(!s)return"";let av=h.cost/h.qty,d=s.price*h.qty-h.cost;return`<article class="stock"><h3>${h.name} ${h.code}</h3><p>${h.qty} 股｜平均成本 ${money(av)}｜損益 <span class="${d>=0?"pos":"neg"}">${money(d)}</span></p><button class="buy" onclick="sell('${h.code}')">模擬賣出 1 股</button></article>`}).join(""):'<div class="empty">目前沒有持股</div>';
 tradeList.innerHTML=S.t.length?S.t.map(t=>`<div class="trade"><b>${t.a} ${t.name} ${t.code}</b><br>${money(t.price)}｜${t.time}<br><span class="label">${t.source||"舊版紀錄"}</span>${t.d!==undefined?`<br>已實現損益 ${money(t.d)}`:""}</div>`).join(""):'<div class="empty">目前沒有交易紀錄</div>';
 let x=metrics();asset.textContent=money(x.total);cash.textContent=money(S.cash);pnl.textContent=money(x.p);realized.textContent=money(S.r);unrealized.textContent=money(x.u);rate.textContent=x.rate.toFixed(2)+"%";
}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button,.panel").forEach(x=>x.classList.remove("on"));b.classList.add("on");document.getElementById(b.dataset.t).classList.add("on")});
render();load();if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js?v=14");