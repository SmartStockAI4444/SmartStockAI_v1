(()=>{'use strict';
const STOCK_DB='SmartStockAI_MarketData', STOCK_STORE='months';
const INDEX_DB='SmartStockAI2_Research', INDEX_STORE='market';
const STOCKS=[["2330","台積電"],["2454","聯發科"],["2308","台達電"],["2382","廣達"],["3231","緯創"],["2317","鴻海"],["2303","聯電"],["2881","富邦金"],["2882","國泰金"],["2891","中信金"],["2886","兆豐金"],["2884","玉山金"],["2885","元大金"],["2892","第一金"],["5880","合庫金"],["2412","中華電"],["3045","台灣大"],["4904","遠傳"],["1301","台塑"],["1303","南亞"],["1326","台化"],["2002","中鋼"],["2603","長榮"],["2609","陽明"],["2615","萬海"],["2606","裕民"],["2618","長榮航"],["2610","華航"],["1216","統一"],["2912","統一超"],["2207","和泰車"],["2105","正新"],["1101","台泥"],["1102","亞泥"],["1402","遠東新"],["2357","華碩"],["2379","瑞昱"],["3034","聯詠"],["3008","大立光"],["3711","日月光投控"],["2345","智邦"],["2356","英業達"],["2376","技嘉"],["2377","微星"],["2324","仁寶"],["2353","宏碁"],["6669","緯穎"],["3661","世芯-KY"],["3443","創意"],["3017","奇鋐"]];
const $=id=>document.getElementById(id);
const MONTHS=36, MIN_SAMPLE=10, HORIZONS=[{days:20,weight:5,label:'20 日'},{days:60,weight:9,label:'60 日'},{days:120,weight:11,label:'120 日'}];
const monthKeys=()=>{const now=new Date(),a=[];for(let i=MONTHS-1;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);a.push(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}01`)}return a};
function openExisting(name,store){
 return new Promise((resolve,reject)=>{
  let q;try{q=indexedDB.open(name)}catch(e){reject(e);return}
  q.onupgradeneeded=()=>{try{q.transaction.abort()}catch(e){};reject(Error('找不到既有資料庫：'+name+'（為保護資料，本頁不會建立新資料庫）'))};
  q.onerror=()=>reject(q.error||Error('無法開啟資料庫：'+name));
  q.onsuccess=()=>{const db=q.result;if(!db.objectStoreNames.contains(store)){db.close();reject(Error('資料庫 '+name+' 缺少資料表 '+store));return}resolve(db)};
 });
}
function get(db,store,key){return new Promise((resolve,reject)=>{const q=db.transaction(store,'readonly').objectStore(store).get(key);q.onsuccess=()=>resolve(q.result??null);q.onerror=()=>reject(q.error)})}
function fmtPct(x){return (x*100).toFixed(2)+'%'}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function normalizeStockRows(raw){
 const map=new Map();
 if(!Array.isArray(raw))return map;
 for(const r of raw){
  let date,close;
  if(Array.isArray(r)){date=String(r[0]??'');close=Number(String(r[1]??'').replace(/,/g,''))}
  else if(r&&typeof r==='object'){date=String(r.d??r.date??'');close=Number(String(r.c??r.close??'').replace(/,/g,''))}
  if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(close)&&close>0)map.set(date,close);
 }
 return map;
}
async function readStockData(db){
 const keys=monthKeys(), result=new Map(), monthCount=new Map();
 for(const [code] of STOCKS){
  const rows=new Map();let found=0;
  for(const month of keys){
   const raw=await get(db,STOCK_STORE,code+'_'+month);
   if(raw){found++;for(const [d,c] of normalizeStockRows(raw))rows.set(d,c)}
  }
  result.set(code,rows);monthCount.set(code,found);
 }
 return {result,monthCount};
}
async function readIndexData(db){
 const keys=monthKeys(), rows=new Map();let months=0;
 for(const month of keys){
  const raw=await get(db,INDEX_STORE,'TAIEX_'+month);
  if(raw&&Array.isArray(raw.rows)){months++;for(const r of raw.rows){const d=String(r.date||''),c=Number(r.close);if(/^\d{4}-\d{2}-\d{2}$/.test(d)&&c>0)rows.set(d,c)}}
 }
 return {rows,months};
}
function pickBaseDate(indexRows,stockRows){
 const dates=[...indexRows.keys()].sort();
 for(let i=dates.length-1;i>=120;i--){
  const d=dates[i],count=STOCKS.reduce((n,[code])=>n+(stockRows.get(code)?.has(d)?1:0),0);
  if(count>=40)return {date:d,index:i,coverage:count};
 }
 return null;
}
function avgRank(items){
 const sorted=[...items].sort((a,b)=>a.rel-b.rel),rank=new Map();
 let i=0;
 while(i<sorted.length){let j=i+1;while(j<sorted.length&&Math.abs(sorted[j].rel-sorted[i].rel)<1e-12)j++;
  const averageRank=((i+1)+j)/2;
  for(let k=i;k<j;k++)rank.set(sorted[k].code,averageRank);
  i=j;
 }
 return rank;
}
function percentile(rank,n){return n<=1?null:100*(rank-1)/(n-1)}
function compute(indexRows,stockRows,base){
 const dates=[...indexRows.keys()].sort(),idx=base.index,baseDate=base.date;
 const records=[],missing=[];
 for(const [code,name] of STOCKS){
  const prices=stockRows.get(code),why=[];
  const end=prices?.get(baseDate);
  if(!(end>0))why.push('基準日缺收盤價');
  const returns={};
  for(const h of HORIZONS){
   const anchorDate=dates[idx-h.days],indexStart=indexRows.get(anchorDate),indexEnd=indexRows.get(baseDate),stockStart=prices?.get(anchorDate);
   if(!(indexStart>0))why.push(h.label+'大盤基準不足');
   if(!(stockStart>0))why.push(h.label+'股票歷史價不足');
   if(end>0&&stockStart>0&&indexStart>0&&indexEnd>0){
    const sr=end/stockStart-1,ir=indexEnd/indexStart-1;
    returns[h.days]={stock:sr,index:ir,relative:sr-ir};
   }
  }
  if(HORIZONS.every(h=>returns[h.days]))records.push({code,name,returns});
  else missing.push({code,name,reason:[...new Set(why)].join('、')||'資料不足'});
 }
 if(records.length<MIN_SAMPLE)return {records,missing,baseDate,coverage:base.coverage,insufficient:true};
 const ranks={};
 for(const h of HORIZONS){
  const values=records.map(x=>({code:x.code,rel:x.returns[h.days].relative}));
  ranks[h.days]=avgRank(values);
 }
 for(const r of records){
  r.parts={};r.total=0;
  for(const h of HORIZONS){
   const p=percentile(ranks[h.days].get(r.code),records.length);
   const points=p===null?null:p/100*h.weight;
   r.parts[h.days]={rank:ranks[h.days].get(r.code),percentile:p,points};
   r.total+=points||0;
  }
 }
 records.sort((a,b)=>b.total-a.total);
 return {records,missing,baseDate,coverage:base.coverage,insufficient:false};
}
function renderDiagnostics(x,stockInfo,indexInfo){
 const stocksWithAny=STOCKS.filter(([c])=>stockInfo.result.get(c)?.size).length;
 const totalRows=STOCKS.reduce((n,[c])=>n+stockInfo.result.get(c).size,0);
 const lines=[
  '股票資料庫：'+STOCK_DB+'（唯讀）',
  '股票資料表：'+STOCK_STORE+'｜有資料股票：'+stocksWithAny+'/50｜有效日收盤列：'+totalRows,
  '股票資料月份：'+STOCKS.reduce((n,[c])=>n+stockInfo.monthCount.get(c),0)+' 個股票月份物件',
  '大盤資料庫：'+INDEX_DB+'（唯讀）',
  '大盤完整月份：'+indexInfo.months+'/36｜有效交易日：'+indexInfo.rows.size,
  '共同基準日：'+(x.baseDate||'無法建立')+'｜當日有股票資料：'+(x.coverage??0)+'/50',
  '符合三個期間完整計算：'+x.records.length+'/50',
  '資料不足或未納入：'+x.missing.length+'/50'
 ];
 $('diagnostics').textContent=lines.join('\n');
}
function renderResults(x){
 const body=$('results'),foot=$('footnote');
 if(x.insufficient){
  body.innerHTML='<tr><td colspan="6">完整資料股票少於 10 檔，暫不排名。</td></tr>';
  foot.textContent='目前完整樣本 '+x.records.length+' 檔；最低要求 '+MIN_SAMPLE+' 檔。缺少資料的股票不會被當成 0 分。';
  return;
 }
 body.innerHTML=x.records.map((r,i)=>{
  const a=r.returns[20].relative,b=r.returns[60].relative,c=r.returns[120].relative;
  const cls=v=>v>=0?'positive':'negative';
  return `<tr><td>${i+1}</td><td>${esc(r.name)} ${r.code}</td><td class="${cls(a)}">${fmtPct(a)}</td><td class="${cls(b)}">${fmtPct(b)}</td><td class="${cls(c)}">${fmtPct(c)}</td><td><b>${r.total.toFixed(2)}</b></td></tr>`;
 }).join('');
 foot.textContent=`共同基準日 ${x.baseDate}｜完整納入 ${x.records.length} 檔｜分數為相對大盤強度 25 分中的得分。各期間相對差值為股票報酬減大盤報酬。`;
}
async function run(){
 const btn=$('run');if(btn.disabled)return;
 btn.disabled=true;$('status').textContent='正在以唯讀方式開啟既有資料庫…';$('diagnostics').textContent='讀取中…';
 $('results').innerHTML='<tr><td colspan="6">正在計算…</td></tr>';$('footnote').textContent='';
 let sdb,idb;
 try{
  sdb=await openExisting(STOCK_DB,STOCK_STORE);
  idb=await openExisting(INDEX_DB,INDEX_STORE);
  $('status').textContent='正在讀取 50 檔股票與 36 個月大盤資料…';
  const [stockInfo,indexInfo]=await Promise.all([readStockData(sdb),readIndexData(idb)]);
  if(!indexInfo.rows.size)throw Error('大盤資料庫沒有可用收盤資料');
  const base=pickBaseDate(indexInfo.rows,stockInfo.result);
  if(!base)throw Error('找不到至少 40 檔股票與大盤同日有資料、且具備 120 日回看區間的共同基準日');
  $('status').textContent='資料讀取完成，正在計算三個期間的相對強度排名…';
  const result=compute(indexInfo.rows,stockInfo.result,base);
  renderDiagnostics(result,stockInfo,indexInfo);renderResults(result);
  $('status').textContent=result.insufficient?'資料已讀取，但完整樣本不足，未產生排名。':'計算完成。這是第一個 25 分模組的研究測試結果，尚未代表完整選股總分。';
 }catch(e){
  $('status').textContent='執行未完成：'+String(e.message||e);
  $('diagnostics').textContent='請確認本機瀏覽器中原本的股票行情與 TAIEX 資料均存在，且使用相同網址來源。';
  $('results').innerHTML='<tr><td colspan="6">尚無可用結果</td></tr>';
 }finally{if(sdb)sdb.close();if(idb)idb.close();btn.disabled=false}
}
$('run').addEventListener('click',run);
})();