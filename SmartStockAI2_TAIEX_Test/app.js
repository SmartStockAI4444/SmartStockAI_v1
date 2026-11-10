(()=>{'use strict';
const DB_NAME='SmartStockAI2_Research', STORE='market', PREFIX='TAIEX_', MONTHS=36;
const $=id=>document.getElementById(id);
let db=null, running=false, stopRequested=false;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function openDB(){return new Promise((resolve,reject)=>{const q=indexedDB.open(DB_NAME,1);q.onupgradeneeded=()=>{const d=q.result;if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE)};q.onsuccess=()=>{db=q.result;resolve(db)};q.onerror=()=>reject(q.error)})}
function get(key){return new Promise((resolve,reject)=>{const q=db.transaction(STORE,'readonly').objectStore(STORE).get(key);q.onsuccess=()=>resolve(q.result||null);q.onerror=()=>reject(q.error)})}
function put(key,value){return new Promise((resolve,reject)=>{const q=db.transaction(STORE,'readwrite').objectStore(STORE).put(value,key);q.onsuccess=()=>resolve(true);q.onerror=()=>reject(q.error)})}
function monthsList(){const now=new Date(), out=[];for(let i=MONTHS-1;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);out.push(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}01`)}return out}
function num(v){const x=Number(String(v??'').replace(/,/g,'').trim());return Number.isFinite(x)?x:null}
function isoDate(roc){const a=String(roc).split('/').map(Number);if(a.length!==3||!a.every(Number.isFinite))return null;return `${a[0]+1911}-${String(a[1]).padStart(2,'0')}-${String(a[2]).padStart(2,'0')}`}
function normalize(j,ym){
  if(!j||j.stat!=='OK'||!Array.isArray(j.fields)||!Array.isArray(j.data))throw Error(j?.stat||'官方回應格式不符');
  const idx=j.fields.indexOf('收盤指數');
  const dateIdx=j.fields.indexOf('日期');
  const openIdx=j.fields.indexOf('開盤指數'), highIdx=j.fields.indexOf('最高指數'), lowIdx=j.fields.indexOf('最低指數');
  if([idx,dateIdx,openIdx,highIdx,lowIdx].some(x=>x<0))throw Error('官方欄位缺少必要欄位');
  const rows=j.data.map(r=>({date:isoDate(r[dateIdx]),open:num(r[openIdx]),high:num(r[highIdx]),low:num(r[lowIdx]),close:num(r[idx])}))
    .filter(x=>x.date&&x.close>0&&x.open>0&&x.high>0&&x.low>0&&x.date.slice(0,7)===ym.slice(0,4)+'-'+ym.slice(4,6))
    .sort((a,b)=>a.date.localeCompare(b.date));
  if(!rows.length)throw Error('本月份沒有可用交易日資料');
  const seen=new Set();for(const r of rows){if(seen.has(r.date))throw Error('發現重複日期：'+r.date);seen.add(r.date)}
  return rows;
}
async function fetchMonth(month){
  const url=`https://www.twse.com.tw/rwd/zh/TAIEX/MI_5MINS_HIST?date=${month}&response=json`;
  let last;
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),15000);
      let response;try{response=await fetch(url,{cache:'no-store',signal:controller.signal})}finally{clearTimeout(timer)}
      if(!response.ok)throw Error('HTTP '+response.status);
      const json=await response.json();
      const rows=normalize(json,month);
      await put(PREFIX+month,{month,source:'TWSE TAIEX historical index',savedAt:new Date().toISOString(),rows});
      return rows.length;
    }catch(e){last=e;if(attempt<3)await sleep(1500*attempt)}
  }
  throw last||Error('下載失敗');
}
async function audit(){
  await openDB();const months=monthsList(), all=[];let complete=0,missing=[];
  for(const m of months){const x=await get(PREFIX+m);if(x&&Array.isArray(x.rows)&&x.rows.length){complete++;all.push(...x.rows)}else missing.push(m.slice(0,4)+'-'+m.slice(4,6))}
  all.sort((a,b)=>a.date.localeCompare(b.date));
  const unique=[...new Map(all.map(x=>[x.date,x])).values()];
  const range=unique.length?`${unique[0].date} ～ ${unique[unique.length-1].date}`:'尚無資料';
  $('audit').textContent=`月份完整：${complete}/${MONTHS}\n交易日資料：${unique.length} 筆\n日期範圍：${range}\n缺漏月份：${missing.length?missing.join('、'):'無'}\n資料庫：${DB_NAME}`;
  $('summary').textContent=`已保存 ${complete}/${MONTHS} 個月份｜${unique.length} 個交易日`;
  $('bar').style.width=(complete/MONTHS*100)+'%';
  const last=unique.slice(-10).reverse();
  $('recent').innerHTML=last.length?last.map(x=>`<tr><td>${x.date}</td><td>${x.open.toLocaleString('en-US',{minimumFractionDigits:2})}</td><td>${x.high.toLocaleString('en-US',{minimumFractionDigits:2})}</td><td>${x.low.toLocaleString('en-US',{minimumFractionDigits:2})}</td><td><b>${x.close.toLocaleString('en-US',{minimumFractionDigits:2})}</b></td></tr>`).join(''):'<tr><td colspan="5">尚無資料</td></tr>';
  return {complete,missing,rows:unique.length};
}
async function start(){
  if(running)return;running=true;stopRequested=false;$('start').disabled=true;$('stop').disabled=false;
  try{
    await openDB();const months=monthsList();let ok=0,skip=0,fail=[];
    for(let i=0;i<months.length;i++){
      if(stopRequested)break;
      const m=months[i],key=PREFIX+m,existing=await get(key);
      if(existing&&Array.isArray(existing.rows)&&existing.rows.length){skip++;}
      else{
        $('status').textContent=`正在取得 ${m.slice(0,4)}-${m.slice(4,6)} 大盤資料（${i+1}/${MONTHS}）…`;
        try{const n=await fetchMonth(m);ok++;$('status').textContent=`完成 ${m.slice(0,4)}-${m.slice(4,6)}：${n} 個交易日。已新增 ${ok} 個月份。`}
        catch(e){fail.push(m.slice(0,4)+'-'+m.slice(4,6)+'：'+String(e.message||e));$('status').textContent='本月取得失敗，已記錄；繼續處理其他月份。'}
        await sleep(1800);
      }
      $('summary').textContent=`處理中 ${i+1}/${MONTHS}｜本次新增 ${ok}｜已存在略過 ${skip}｜失敗 ${fail.length}`;
      $('bar').style.width=((i+1)/MONTHS*100)+'%';
    }
    const a=await audit();
    $('status').textContent=(stopRequested?'已暫停，可按「開始／繼續」接續。':'本輪下載處理完成。')+
      `\n本次新增月份：${ok}；原有月份略過：${skip}；本次失敗：${fail.length}。`+
      (fail.length?'\n失敗明細：\n'+fail.join('\n'):'')+
      `\n目前完整月份：${a.complete}/${MONTHS}。`;
  }catch(e){$('status').textContent='執行失敗：'+String(e.message||e)}
  finally{running=false;$('start').disabled=false;$('stop').disabled=true}
}
$('start').addEventListener('click',start);
$('stop').addEventListener('click',()=>{stopRequested=true;$('status').textContent='收到暫停要求，完成目前月份後停止…'});
$('auditBtn').addEventListener('click',()=>audit().catch(e=>$('audit').textContent='檢查失敗：'+e.message));
openDB().then(audit).catch(e=>$('status').textContent='資料庫初始化失敗：'+e.message);
})();