const PICKS=[
 {code:"2330",name:"台積電",price:980,score:91,tags:["趨勢","基本面","量價"]},
 {code:"2454",name:"聯發科",price:1320,score:88,tags:["趨勢","獲利","動能"]},
 {code:"2308",name:"台達電",price:395,score:85,tags:["基本面","趨勢"]},
 {code:"2881",name:"富邦金",price:91,score:82,tags:["獲利","風險"]},
 {code:"3711",name:"日月光投控",price:158,score:80,tags:["量價","動能"]}
]; // 全部為固定示範價格，非即時行情
let state=JSON.parse(localStorage.getItem("smartstock_v1")||'{"cash":100000,"holdings":{},"history":[]}');
const money=n=>"NT$"+Math.round(n).toLocaleString("zh-TW");
function save(){localStorage.setItem("smartstock_v1",JSON.stringify(state));render()}
function total(){return state.cash+Object.values(state.holdings).reduce((s,h)=>s+h.qty*h.price,0)}
function buy(code){let p=PICKS.find(x=>x.code===code);let qty=Math.max(1,Math.floor(10000/p.price));let cost=qty*p.price;if(cost>state.cash){alert("模擬現金不足");return}state.cash-=cost;let h=state.holdings[code]||{...p,qty:0,cost:0};h.qty+=qty;h.cost+=cost;state.holdings[code]=h;state.history.unshift({type:"買進",code,name:p.name,qty,price:p.price,time:new Date().toLocaleString("zh-TW")});save()}
function sell(code){let h=state.holdings[code];if(!h)return;state.cash+=h.qty*h.price;state.history.unshift({type:"賣出",code,name:h.name,qty:h.qty,price:h.price,time:new Date().toLocaleString("zh-TW")});delete state.holdings[code];save()}
function render(){
 let a=total(), pnl=a-100000;
 assets.textContent=perfAssets.textContent=money(a);cash.textContent=money(state.cash);pnl.textContent=money(pnl);
 pnl.className=pnl>=0?"positive":"negative";returnRate.textContent=(pnl/1000).toFixed(2)+"%";returnRate.className=pnl>=0?"positive":"negative";
 tradeCount.textContent=state.history.filter(x=>x.type==="賣出").length;
 pickList.innerHTML=PICKS.map(p=>`<div class="card"><div class="row"><div><b>${p.name}</b> <span class="symbol">${p.code}</span><div class="tags">${p.tags.map(t=>`<span>${t}</span>`).join("")}</div></div><div style="text-align:right"><div class="score">AI ${p.score}</div><div class="price">${money(p.price)}</div><small>示範價格</small></div></div><div class="row"><small>Strategy v1.0</small><button class="buy" onclick="buy('${p.code}')">模擬買進</button></div></div>`).join("");
 let hs=Object.values(state.holdings);holdingList.innerHTML=hs.length?hs.map(h=>`<div class="card"><div class="row"><div><b>${h.name}</b> <span class="symbol">${h.code}</span><div>${h.qty} 股 · 成本 ${money(h.cost)}</div></div><div style="text-align:right"><b>${money(h.qty*h.price)}</b><br><small>示範價格 ${money(h.price)}</small></div></div><div class="row"><small>資料儲存在本機</small><button class="sell" onclick="sell('${h.code}')">全部模擬賣出</button></div></div>`).join(""):'<div class="empty">目前沒有模擬持股</div>';
 historyList.innerHTML=state.history.length?state.history.map(x=>`<div class="card"><div class="row"><b>${x.type} ${x.name} ${x.code}</b><span>${money(x.qty*x.price)}</span></div><small>${x.qty} 股 × ${money(x.price)} · ${x.time}</small></div>`).join(""):'<div class="empty">尚無交易紀錄</div>';
}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab,.panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.getElementById(b.dataset.tab).classList.add("active")});render();