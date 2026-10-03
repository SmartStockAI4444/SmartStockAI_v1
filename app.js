const BASE=100000;
const RAW_P=[
["2330","台積電",91,980,960,985,925,1030,1060,["趨勢","基本面","量價"]],
["2454","聯發科",88,1320,1290,1325,1240,1390,1430,["趨勢","獲利","動能"]],
["2308","台達電",85,410,400,412,382,435,450,["基本面","趨勢","題材"]],
["2382","廣達",82,285,278,286,264,302,315,["量價","動能","題材"]],
["3231","緯創",80,118,114,119,108,126,132,["量價","趨勢","題材"]]
];
let P=[...new Map(RAW_P.map(s=>[s[0],s])).values()].slice(0,5);
let realMode=false,dataDate="";
let S=JSON.parse(localStorage.ssa11||'{"cash":100000,"h":[],"t":[],"r":0}');
const f=n=>"NT$"+Math.round(Number(n)*100)/100 .toLocaleString?.("zh-TW");
function money(n){return "NT$"+Number(n).toLocaleString("zh-TW",{maximumFractionDigits:2})}
const save=()=>localStorage.ssa11=JSON.stringify(S);

async function loadOfficial(){
 try{
   const d=new Date(), y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,"0");
   const date=`${y}${m}01`;
   const updated=[];
   for(const s of P){
     const url=`https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?date=${date}&stockNo=${s[0]}&response=json`;
     const r=await fetch(url,{cache:"no-store"});
     if(!r.ok) throw Error("TWSE HTTP");
     const j=await r.json();
     if(!j.data||!j.data.length) throw Error("TWSE no data");
     const row=j.data[j.data.length-1];
     const close=Number(String(row[6]).replace(/,/g,""));
     if(!Number.isFinite(close)) throw Error("bad close");
     const q=[...s]; q[3]=close; q[4]=close; q[5]=close; q[6]=null; q[7]=null; q[8]=null;
     updated.push(q); dataDate=row[0];
   }
   P=updated; realMode=true;
   dataBadge.textContent="TWSE 收盤資料";
   dataNotice.textContent=`資料日期：${dataDate}｜來源：臺灣證券交易所（TWSE）｜非即時行情。AI 分數與選股理由仍為 Strategy v1.3 示範策略。`;
 }catch(e){
   realMode=false;
   dataBadge.textContent="示範資料";
   dataNotice.textContent="目前無法從瀏覽器取得 TWSE 公開日行情，已自動切回示範價格；不會把示範價格標示成真實行情。";
 }
 render();
}
function metrics(){let m=0,c=0;S.h.forEach(h=>{let s=P.find(x=>x[0]==h.code);if(s){m+=s[3]*h.qty;c+=h.cost}});let u=m-c,total=S.cash+m;return{u,total,p:total-BASE,rate:(total-BASE)/BASE*100}}
function buy(i){let s=P[i];if(S.cash<s[3])return alert("可用現金不足");S.cash-=s[3];let h=S.h.find(x=>x.code==s[0]);h?(h.qty++,h.cost+=s[3]):S.h.push({code:s[0],name:s[1],qty:1,cost:s[3]});S.t.unshift({a:"買進",name:s[1],code:s[0],price:s[3],time:new Date().toLocaleString("zh-TW"),source:realMode?"TWSE收盤":"示範"});save();render()}
function sell(code){let h=S.h.find(x=>x.code==code),s=P.find(x=>x[0]==code);if(!h||!s)return;let avg=h.cost/h.qty,d=s[3]-avg;S.cash+=s[3];S.r+=d;h.qty--;h.cost-=avg;S.t.unshift({a:"賣出",name:s[1],code,price:s[3],d,time:new Date().toLocaleString("zh-TW"),source:realMode?"TWSE收盤":"示範"});if(!h.qty)S.h=S.h.filter(x=>x.code!=code);save();render()}
function render(){
 list.innerHTML=P.map((s,i)=>`<article class="stock"><div class="head"><div><h3>${s[1]} <span class="code">${s[0]}</span></h3><div class="chips">${s[9].map(x=>`<span class="chip">${x}</span>`).join("")}</div></div><div><div class="score">AI ${s[2]}</div><div class="price">${money(s[3])}</div><span class="label">${realMode?"TWSE 收盤價":"示範價格"}</span></div></div><div class="grid"><div><span class="label">價格資料</span><b>${realMode?"官方收盤資料":"示範資料"}</b></div><div><span class="label">資料日期</span><b>${realMode?dataDate:"—"}</b></div><div><span class="label">行情類型</span><b>${realMode?"非即時行情":"示範"}</b></div><div><span class="label">資料來源</span><b>${realMode?"TWSE":"內建示範"}</b></div></div><p class="reason"><b>策略說明：</b>AI 分數與選股理由目前仍為 Strategy v1.3 示範策略；價格資料與策略訊號分開標示。</p><button class="buy" onclick="buy(${i})">模擬買進 1 股</button></article>`).join("");
 holds.innerHTML=S.h.length?S.h.map(h=>{let s=P.find(x=>x[0]==h.code);if(!s)return"";let avg=h.cost/h.qty,d=s[3]*h.qty-h.cost;return`<article class="stock"><h3>${h.name} ${h.code}</h3><p>${h.qty} 股｜平均成本 ${money(avg)}｜損益 <span class="${d>=0?"pos":"neg"}">${money(d)}</span></p><button class="buy" onclick="sell('${h.code}')">模擬賣出 1 股</button></article>`}).join(""):'<div class="empty">目前沒有持股</div>';
 tradeList.innerHTML=S.t.length?S.t.map(t=>`<div class="trade"><b>${t.a} ${t.name} ${t.code}</b><br>${money(t.price)}｜${t.time}<br><span class="label">${t.source||"舊版紀錄"}</span>${t.d!==undefined?`<br>已實現損益 ${money(t.d)}`:""}</div>`).join(""):'<div class="empty">目前沒有交易紀錄</div>';
 let x=metrics();asset.textContent=money(x.total);cash.textContent=money(S.cash);pnl.textContent=money(x.p);realized.textContent=money(S.r);unrealized.textContent=money(x.u);rate.textContent=x.rate.toFixed(2)+"%"
}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button,.panel").forEach(x=>x.classList.remove("on"));b.classList.add("on");document.getElementById(b.dataset.t).classList.add("on")});
render();loadOfficial();
if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js?v=13");