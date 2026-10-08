(()=>{'use strict';const P=[["2330", "台積電"], ["2454", "聯發科"], ["2308", "台達電"], ["2382", "廣達"], ["3231", "緯創"], ["2317", "鴻海"], ["2303", "聯電"], ["2881", "富邦金"], ["2882", "國泰金"], ["2891", "中信金"], ["2886", "兆豐金"], ["2884", "玉山金"], ["2885", "元大金"], ["2892", "第一金"], ["5880", "合庫金"], ["2412", "中華電"], ["3045", "台灣大"], ["4904", "遠傳"], ["1301", "台塑"], ["1303", "南亞"], ["1326", "台化"], ["2002", "中鋼"], ["2603", "長榮"], ["2609", "陽明"], ["2615", "萬海"], ["2606", "裕民"], ["2618", "長榮航"], ["2610", "華航"], ["1216", "統一"], ["2912", "統一超"], ["2207", "和泰車"], ["2105", "正新"], ["1101", "台泥"], ["1102", "亞泥"], ["1402", "遠東新"], ["2357", "華碩"], ["2379", "瑞昱"], ["3034", "聯詠"], ["3008", "大立光"], ["3711", "日月光投控"], ["2345", "智邦"], ["2356", "英業達"], ["2376", "技嘉"], ["2377", "微星"], ["2324", "仁寶"], ["2353", "宏碁"], ["6669", "緯穎"], ["3661", "世芯-KY"], ["3443", "創意"], ["3017", "奇鋐"]],M=[],D={},S={},$=x=>document.getElementById(x),COST=.00585,HOLD=20,TH=65;let run=false,stop=false,ctl=null,lastValidation=null;let now=new Date();for(let i=35;i>=0;i--){let d=new Date(now.getFullYear(),now.getMonth()-i,1);M.push(''+d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+'01')}P.forEach(p=>M.forEach(m=>S[p[0]+'_'+m]='等待'));const sleep=n=>new Promise(r=>setTimeout(r,n));function n(x){return Number(String(x).replace(/,/g,''))}function dk(x){let a=x.split('/').map(Number);return (a[0]+1911)+'-'+String(a[1]).padStart(2,'0')+'-'+String(a[2]).padStart(2,'0')}let DB=null;
function openDB(){return new Promise((resolve,reject)=>{let q=indexedDB.open('SmartStockAI_MarketData',1);q.onupgradeneeded=()=>{let d=q.result;if(!d.objectStoreNames.contains('months'))d.createObjectStore('months')};q.onsuccess=()=>{DB=q.result;resolve(DB)};q.onerror=()=>reject(q.error)})}
function idbGet(k){return new Promise(r=>{if(!DB)return r(null);let q=DB.transaction('months','readonly').objectStore('months').get(k);q.onsuccess=()=>r(q.result||null);q.onerror=()=>r(null)})}
function idbPut(k,x){return new Promise(r=>{if(!DB)return r(false);let q=DB.transaction('months','readwrite').objectStore('months').put(x,k);q.onsuccess=()=>r(true);q.onerror=()=>r(false)})}
async function load(){await openDB();for(let p of P){for(let m of M){let k=p[0]+'_'+m,x=await idbGet(k);if(!x){try{x=JSON.parse(localStorage.getItem('ssa35_'+k)||localStorage.getItem('ssa33_'+k)||'null')}catch(e){}if(x&&x.length)await idbPut(k,x)}if(x&&x.length){D[k]=x;S[k]='成功'}}}draw();$('work').textContent=Object.keys(D).length?'已載入永久行情資料。':'未找到舊行情資料；若 v3.5 資料只存在記憶體，這次需重新下載一次。之後版本將可直接沿用。'}function save(k,x){idbPut(k,x);try{localStorage.setItem('ssa35_'+k,JSON.stringify(x))}catch(e){}}function draw(){let ok=0,fail=0,h='';P.forEach(p=>{let a=0,b=0;M.forEach(m=>{let s=S[p[0]+'_'+m];if(s==='成功'){ok++;a++}if(s==='失敗'){fail++;b++}});h+='<div class="card"><b>'+p[1]+' '+p[0]+'</b><span>'+a+'/36'+(b?'｜失敗 '+b:'')+'</span></div>'});let done=ok+fail;$('summary').textContent='完成 '+done+' / 1800｜成功 '+ok+'｜失敗 '+fail;$('bar').style.width=(done/18)+'%';$('stocks').innerHTML=h;$('retry').disabled=run||!fail;$('validate').disabled=run||ok<1620}async function one(p,m,a){let k=p[0]+'_'+m;S[k]='處理中';draw();$('work').textContent='正在取得 '+p[1]+' '+m.slice(0,6)+'｜第 '+a+' 次';ctl=new AbortController();let t=setTimeout(()=>ctl.abort(),10000);try{let r=await fetch('https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?date='+m+'&stockNo='+p[0]+'&response=json&_='+Date.now(),{cache:'no-store',signal:ctl.signal});if(!r.ok)throw Error('HTTP '+r.status);let j=await r.json();if(j.stat!=='OK')throw Error(j.stat||'TWSE異常');let x=(j.data||[]).map(q=>[dk(q[0]),n(q[6]),n(q[1])]).filter(q=>q[1]>0);if(!x.length)throw Error('無資料');D[k]=x;save(k,x);S[k]='成功';return true}catch(e){if(stop)S[k]='等待';return false}finally{clearTimeout(t);ctl=null;draw()}}async function task(p,m){let k=p[0]+'_'+m;for(let a=1;a<=3&&!stop;a++){if(await one(p,m,a))return;if(a<3)await sleep(a===1?1800:3500)}if(!stop)S[k]='失敗';draw()}async function go(failOnly){if(run)return;run=true;stop=false;$('start').disabled=true;$('stop').disabled=false;for(let p of P){for(let m of M){if(stop)break;let k=p[0]+'_'+m;if(failOnly){if(S[k]!=='失敗')continue;S[k]='等待'}else if(S[k]==='成功'||S[k]==='失敗')continue;await task(p,m);if(!stop)await sleep(900)}if(stop)break;if(!stop)await sleep(1400)}run=false;$('start').disabled=false;$('stop').disabled=true;draw();$('work').textContent=stop?'已停止，可繼續。':'下載階段完成。'}function series(c){let z=new Map;M.forEach(m=>(D[c+'_'+m]||[]).forEach(x=>z.set(x[0],{d:x[0],c:x[1],v:x[2]})));return [...z.values()].sort((a,b)=>a.d.localeCompare(b.d))}function ma(a,k,i){let s=0;for(let j=i-k+1;j<=i;j++)s+=a[j].c;return s/k}function score(a,i){if(i<20)return null;let c=a[i].c,m5=ma(a,5,i),m20=ma(a,20,i),r5=c/a[i-5].c-1,r20=c/a[i-20].c-1,v=a.slice(i-19,i+1).reduce((s,x)=>s+(x.v||0),0)/20,vr=v?(a[i].v||0)/v:1,rs=[];for(let j=i-19;j<=i;j++)if(j>0)rs.push(a[j].c/a[j-1].c-1);let av=rs.reduce((s,x)=>s+x,0)/rs.length,sd=Math.sqrt(rs.reduce((s,x)=>s+(x-av)**2,0)/rs.length),q=50;q+=c>m5?7:-7;q+=m5>m20?10:-10;q+=Math.max(-10,Math.min(10,r5*100));q+=Math.max(-12,Math.min(12,r20*60));q+=Math.max(-5,Math.min(5,(vr-1)*5));q-=Math.min(10,sd*180);return Math.max(0,Math.min(100,q))}function st(r){if(!r.length)return{n:0,w:0,a:0,dd:0};let eq=1,pk=1,dd=0;r.forEach(x=>{eq*=1+x;pk=Math.max(pk,eq);dd=Math.min(dd,eq/pk-1)});return{n:r.length,w:r.filter(x=>x>0).length/r.length,a:r.reduce((s,x)=>s+x,0)/r.length,dd}}const pc=x=>(x*100).toFixed(2)+'%';function validate(){let tr=[],te=[],per=[],trades=[];P.forEach(p=>{let a=series(p[0]);if(a.length<80)return;let cut=Math.floor(a.length*.7),x=[],y=[];for(let i=20;i<a.length-HOLD;i+=HOLD){let q=score(a,i);if(q<TH)continue;let r=a[i+HOLD].c/a[i].c-1-COST;if(i<cut)x.push(r);else{y.push(r);trades.push({code:p[0],name:p[1],date:a[i].d,r:r,score:q,entry:a[i].c,path:a.slice(i+1,i+HOLD+1).map(z=>z.c)})}}tr.push(...x);te.push(...y);per.push([p,st(y)]) });lastValidation={trades:trades,per:per};let A=st(tr),B=st(te),used=per.filter(x=>x[1].n),pos=used.filter(x=>x[1].a>0).length,h='<h3>後 30% 樣本外</h3><div class="grid"><div><b>'+B.n+'</b><small>交易樣本</small></div><div><b>'+pc(B.w)+'</b><small>勝率</small></div><div><b>'+pc(B.a)+'</b><small>平均每筆</small></div><div><b>'+pos+' / '+used.length+'</b><small>正期望股票</small></div><div><b>'+pc(B.dd)+'</b><small>最大回撤</small></div></div><h3>前70%形成期</h3><p>'+A.n+'筆｜勝率 '+pc(A.w)+'｜平均 '+pc(A.a)+'</p><h3>樣本外各股</h3>';used.sort((a,b)=>b[1].a-a[1].a).forEach(x=>h+='<div class="mini"><b>'+x[0][1]+' '+x[0][0]+'</b><span>'+x[1].n+'筆｜勝 '+pc(x[1].w)+'｜均 '+pc(x[1].a)+'｜DD '+pc(x[1].dd)+'</span></div>');h+='<p class="foot">固定：≥65分｜持有20交易日｜每筆扣0.585%。歷史結果不保證未來。</p>';$('result').innerHTML=h}function stability(){if(!lastValidation||!lastValidation.trades.length){$('stable').innerHTML='請先按「執行固定規則驗證」。';return}let t=lastValidation.trades,months={};t.forEach(x=>{let m=x.date.slice(0,7);(months[m]||(months[m]=[])).push(x.r)});let ms=Object.entries(months).sort((a,b)=>a[0].localeCompare(b[0])).map(([m,r])=>[m,st(r)]),pm=ms.filter(x=>x[1].a>0).length;let stock={};t.forEach(x=>(stock[x.code]||(stock[x.code]={name:x.name,r:[]})).r.push(x.r));let ss=Object.entries(stock).map(([c,o])=>[c,o.name,st(o.r)]).sort((a,b)=>b[2].a-a[2].a),pos=ss.filter(x=>x[2].a>0).length;let total=t.reduce((s,x)=>s+x.r,0),top=ss.slice(0,5).reduce((s,x)=>s+x[2].a*x[2].n,0),conc=total>0?top/total:0;let h='<div class="grid"><div><b>'+pm+' / '+ms.length+'</b><small>正報酬月份</small></div><div><b>'+pos+' / '+ss.length+'</b><small>正期望股票</small></div><div><b>'+pc(conc)+'</b><small>前5股報酬貢獻度*</small></div><div><b>'+t.length+'</b><small>樣本外交易</small></div></div><h3>樣本外月份</h3>';ms.forEach(x=>h+='<div class="mini"><b>'+x[0]+'</b><span>'+x[1].n+'筆｜勝 '+pc(x[1].w)+'｜均 '+pc(x[1].a)+'</span></div>');h+='<h3>報酬集中度：前 5 檔</h3>';ss.slice(0,5).forEach(x=>h+='<div class="mini"><b>'+x[1]+' '+x[0]+'</b><span>'+x[2].n+'筆｜均 '+pc(x[2].a)+'</span></div>');h+='<p class="foot">*前5股報酬貢獻度是簡化集中度指標，不是投資組合權重。月份樣本很少時不可單獨解讀。規則仍固定為 ≥65 分、持有20交易日、成本0.585%。</p>';$('stable').innerHTML=h}
function riskCompare(){
 if(!lastValidation||!lastValidation.trades.length){$('riskResult').innerHTML='請先按「執行固定規則驗證」。';return}
 const base=lastValidation.trades.slice();
 function stopRet(t,sl){
   for(let p of (t.path||[]))if(p/t.entry-1<=-sl)return -sl-COST;
   return t.r
 }
 function portfolioDD(ts,sl){
   let events={};
   ts.forEach(t=>{
     let d=t.date, r=sl?stopRet(t,sl):t.r;
     (events[d]||(events[d]=[])).push(r)
   });
   let eq=1,peak=1,dd=0;
   Object.keys(events).sort().forEach(d=>{
     let rs=events[d],day=rs.reduce((a,b)=>a+b,0)/rs.length;
     eq*=1+day; peak=Math.max(peak,eq); dd=Math.min(dd,eq/peak-1)
   });
   return dd
 }
 function run(sl){
   let byDate={};base.forEach(t=>(byDate[t.date]||(byDate[t.date]=[])).push(t));
   let arr=[];
   Object.keys(byDate).sort().forEach(d=>{
     byDate[d].slice().sort((a,b)=>b.score-a.score).slice(0,5).forEach(t=>arr.push({...t,rr:stopRet(t,sl)}))
   });
   let s=st(arr.map(x=>x.rr));
   return {sl,n:s.n,w:s.w,a:s.a,seq:s.dd,pdd:portfolioDD(arr,sl),hits:arr.filter(x=>x.rr<=(-sl-COST+1e-9)).length}
 }
 let baseS=st(base.map(t=>t.r)), baseP=portfolioDD(base,0);
 let rows=[.08,.10,.12,.15].map(run);
 let h='<h3>固定風控強度比較</h3><div class="riskTable"><div class="rh">方案</div><div class="rh">筆數</div><div class="rh">勝率</div><div class="rh">平均</div><div class="rh">日期型回撤</div>';
 h+='<div>原策略</div><div>'+baseS.n+'</div><div>'+pc(baseS.w)+'</div><div>'+pc(baseS.a)+'</div><div>'+pc(baseP)+'</div>';
 rows.forEach(x=>{h+='<div>-'+Math.round(x.sl*100)+'%</div><div>'+x.n+'</div><div>'+pc(x.w)+'</div><div>'+pc(x.a)+'</div><div>'+pc(x.pdd)+'</div>'});
 h+='</div>';
 h+='<h3>停損觸發與簡化序列回撤</h3><div class="grid">';
 rows.forEach(x=>{h+='<div><b>-'+Math.round(x.sl*100)+'%</b><small>'+x.hits+' 次停損｜序列DD '+pc(x.seq)+'</small></div>'});
 h+='</div><p class="foot">四個停損門檻在看結果前已固定列出，目的為穩健性比較，不是挑最好看的參數。每個訊號日最多 5 檔、依 Strategy 分數排序。日期型回撤把同日交易先等權平均，再按日期累積成簡化淨值曲線；仍未完整模擬資金占用、重疊持倉、盤中成交、滑價、股利與實際稅費，因此不是券商帳戶真實回撤。歷史結果不保證未來績效。</p>';
 $('riskResult').innerHTML=h
}
async function portfolioSim(stopLoss){
 const initial=100000,maxPos=5;let cash=initial,pos=[],curve=[],done=[],buys=0;
 function nd(s){let a=String(s||'').trim().replace(/\./g,'/').replace(/-/g,'/').split('/');if(a.length<3)return'';let y=+a[0],m=+a[1],d=+a[2];if(y<1911)y+=1911;return y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0')}
 if(!DB)await openDB();let hist={};P.forEach(p=>hist[p[0]]=[]);let mo=0,rn=0;
 for(let p of P)for(let m of M){let r=await idbGet(p[0]+'_'+m);if(r&&r.length){mo++;for(let x of r){let d=nd(Array.isArray(x)?x[0]:x.d),c=+(Array.isArray(x)?x[1]:x.c);if(d&&c>0){hist[p[0]].push({d,c});rn++}}}}
 let px={},ds=new Set(),stocks=0;for(let [code,r] of Object.entries(hist)){if(!r.length)continue;stocks++;let dm=new Map(r.map(x=>[x.d,x.c]));for(let [d,c] of dm){(px[d]||(px[d]={}))[code]=c;ds.add(d)}}let dates=[...ds].sort(),sig={};for(let t of lastValidation.trades){let d=nd(t.date);if(d)(sig[d]||(sig[d]=[])).push(t)}
 const eq=d=>cash+pos.reduce((z,p)=>z+((px[d]||{})[p.code]||p.last)*p.shares,0);
 for(let d of dates){let td=px[d]||{};for(let i=pos.length-1;i>=0;i--){let p=pos[i],pr=td[p.code];if(!pr)continue;p.last=pr;p.days++;let st=stopLoss&&pr/p.entry-1<=-stopLoss;if(st||p.days>=HOLD){let g=p.shares*pr;cash+=g-g*COST;done.push({r:pr/p.entry-1-COST*2,stop:!!st});pos.splice(i,1)}}for(let t of (sig[d]||[]).sort((a,b)=>b.score-a.score)){if(pos.length>=maxPos)break;if(pos.some(p=>p.code===t.code))continue;let pr=td[t.code]||+t.entry,b=Math.min(cash,eq(d)/maxPos),sh=Math.floor(b/pr);if(sh<1)continue;let c=sh*pr,f=c*COST;if(c+f>cash)continue;cash-=c+f;buys++;pos.push({code:t.code,entry:pr,last:pr,shares:sh,days:0})}curve.push({d,e:eq(d)})}
 if(curve.length){let td=px[curve[curve.length-1].d]||{};for(let p of pos){let pr=td[p.code]||p.last,g=p.shares*pr;cash+=g-g*COST;done.push({r:pr/p.entry-1-COST*2,stop:false})}curve[curve.length-1].e=cash}
 let peak=initial,dd=0;for(let x of curve){peak=Math.max(peak,x.e);dd=Math.min(dd,x.e/peak-1)}let wins=done.filter(x=>x.r>0).length;
 return{final:cash,ret:cash/initial-1,dd,n:done.length,w:done.length?wins/done.length:0,stops:done.filter(x=>x.stop).length,signalCount:lastValidation.trades.length,buyCount:buys,marketDays:dates.length,stocksWithData:stocks,monthObjects:mo,rowCount:rn}
}
async function portfolioCompare(){
 if(!lastValidation||!lastValidation.trades.length){$('portfolioResult').innerHTML='請先執行第二步固定規則驗證。';return}
 $('portfolioResult').innerHTML='正在直接讀取 IndexedDB 永久行情…';let a=await portfolioSim(0),b=await portfolioSim(.10);
 function card(n,x){return '<div><h4>'+n+'</h4><b>NT$ '+Math.round(x.final).toLocaleString()+'</b><span>總報酬 '+pc(x.ret)+'</span><span>最大回撤 '+pc(x.dd)+'</span><span>'+x.n+'筆｜勝率 '+pc(x.w)+'</span><span>停損 '+x.stops+'次</span><span>訊號 '+x.signalCount+'｜實際買進 '+x.buyCount+'</span><span>行情日 '+x.marketDays+'｜有行情 '+x.stocksWithData+'/50</span><span>DB月份 '+x.monthObjects+'/1800｜有效日列 '+x.rowCount+'</span></div>'}
 $('portfolioResult').innerHTML='<h3>NT$100,000 資金型模擬</h3><div class="compare">'+card('無停損',a)+card('固定 -10%',b)+'</div><p class="foot">v3.8.5 已依實際 IndexedDB 格式 [日期, 收盤價, 成交量] 解析。策略參數不變；歷史模擬不代表未來績效。</p>'
}
async function inspectIndexedDB(){
 const el=$('inspectResult');
 el.textContent='正在讀取 IndexedDB 原始資料…';
 try{
  if(!DB)await openDB();
  let found=null,keyUsed='';
  // Prefer TSMC, scan available 36 month keys.
  for(let m of M){
   let k='2330_'+m, v=await idbGet(k);
   if(v!=null){found=v;keyUsed=k;break}
  }
  if(found==null){el.textContent='找不到台積電 IndexedDB 月份資料。';return}
  const type=Array.isArray(found)?'Array':typeof found;
  const keys=(found&&typeof found==='object'&&!Array.isArray(found))?Object.keys(found):[];
  let sample=Array.isArray(found)?found[0]:found;
  let sampleKeys=(sample&&typeof sample==='object')?Object.keys(sample):[];
  let preview='';
  try{preview=JSON.stringify(sample,null,2)}catch(e){preview=String(sample)}
  if(preview.length>1800)preview=preview.slice(0,1800)+'…';
  el.innerHTML='<h3>IndexedDB 原始格式診斷</h3>'+
   '<p>Key：<b>'+keyUsed+'</b></p>'+
   '<p>最外層型態：<b>'+type+'</b>'+(Array.isArray(found)?'｜長度 <b>'+found.length+'</b>':'')+'</p>'+
   (keys.length?'<p>最外層欄位：'+keys.join(', ')+'</p>':'')+
   '<p>第一筆欄位：<b>'+(sampleKeys.join(', ')||'無')+'</b></p>'+
   '<pre style="white-space:pre-wrap;word-break:break-all;font-size:12px">'+
   preview.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+
   '</pre><p class="foot">請把這一區截圖給我；下一版會依照實際欄位一次修正第五步解析器。</p>';
 }catch(e){
  el.textContent='診斷失敗：'+(e&&e.message?e.message:String(e));
 }
}

const PAPER_KEY='ssa39paper';
const PAPER_FEE=COST; // Compatibility: legacy account charged 0.585% on each fill.
let paperBusy=false;
const STOCK_NAME=Object.fromEntries(P.map(([c,n])=>[c,n]));
function paperEsc(x){return String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function paperMoney(x){return 'NT$ '+Math.round(Number(x)||0).toLocaleString('en-US')}
function paperPct(x){return (100*(Number(x)||0)).toFixed(2)+'%'}
function twDate(){let x=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());return x}
function paperNew(){let d=twDate();return{version:'4.0',started:d,lastDate:null,
 base:{cash:100000,pos:[],trades:[],equity:[{d,e:100000}],pending:{date:null,buys:[],sells:[]},log:[]},
 stop:{cash:100000,pos:[],trades:[],equity:[{d,e:100000}],pending:{date:null,buys:[],sells:[]},log:[]}}}
function paperSave(x){localStorage.setItem(PAPER_KEY,JSON.stringify(x))}
function paperLoad(){let p=null;try{p=JSON.parse(localStorage.getItem(PAPER_KEY)||'null')}catch(e){}if(!p)return null;
 // In-place, non-destructive migration; preserve both already-open v3.9.4 accounts.
 if(!p.paperV4){
  for(let kind of ['base','stop']){
   const a=p[kind];if(!a)continue;
   if(!Array.isArray(a.equity))a.equity=[];
   if(!Array.isArray(a.trades))a.trades=[];
   if(!Array.isArray(a.pos))a.pos=[];
   a.pending={date:null,buys:[],sells:[]};
   a.log=[];
   for(let t of a.trades)a.log.push({date:t.out||p.lastDate||'',type:'sell',code:t.code,shares:t.shares||null,price:t.exit||null,reason:t.reason||'舊版交易',legacy:true});
   for(let x of a.pos){x.legacy=true;x.buyFee=Number(x.entry||0)*Number(x.shares||0)*PAPER_FEE;
    a.log.push({date:x.in||p.lastDate||'',type:'buy',code:x.code,shares:x.shares,price:x.entry,reason:'v3.9.4 已持有（承接）',legacy:true});}
  }
  p.paperV4=true;p.version='4.0';paperSave(p);
 }
 return p;
}
function paperDD(eq){let peak=100000,dd=0;for(let x of eq){peak=Math.max(peak,x.e);if(peak>0)dd=Math.min(dd,x.e/peak-1)}return dd}
function paperAssets(a){let stockValue=a.pos.reduce((s,x)=>s+Number(x.last||x.entry)*x.shares,0);return {cash:a.cash,stockValue,equity:a.cash+stockValue}}
function paperAccountCard(name,a){let z=paperAssets(a),n=a.trades.length,w=a.trades.filter(x=>x.r>0).length;
 return '<div class="accountSummary"><h4>'+name+'</h4><b>'+paperMoney(z.equity)+'</b>'+
 '<span>現金 '+paperMoney(z.cash)+'</span><span>持股市值 '+paperMoney(z.stockValue)+'</span>'+
 '<span>總報酬 '+paperPct(z.equity/100000-1)+'</span><span>最大回撤 '+paperPct(paperDD(a.equity))+'</span>'+
 '<span>持股 '+a.pos.length+' 檔｜已完成 '+n+' 筆</span><span>已完成勝率 '+(n?paperPct(w/n):'—')+'</span>'+
 '<span>下次待成交：買進候選 '+a.pending.buys.length+' 檔、賣出 '+a.pending.sells.length+' 檔</span></div>'}
function paperHoldRows(a){if(!a.pos.length)return '<p class="foot">目前沒有持股。</p>';
 let h='<div class="tableScroll"><table class="paperTable"><thead><tr><th>股票</th><th>買進日</th><th>股數</th><th>買進</th><th>最新收盤</th><th>未實現損益</th><th>持有日數</th></tr></thead><tbody>';
 for(let x of a.pos){let pnl=x.shares*(Number(x.last||x.entry)-x.entry);h+='<tr><td>'+paperEsc(STOCK_NAME[x.code]||x.code)+' '+paperEsc(x.code)+(x.legacy?' <small>承接</small>':'')+'</td><td>'+paperEsc(x.in||'—')+'</td><td>'+x.shares+'</td><td>'+Number(x.entry).toFixed(2)+'</td><td>'+Number(x.last||x.entry).toFixed(2)+'</td><td class="'+(pnl>=0?'gain':'loss')+'">'+paperMoney(pnl)+'</td><td>'+Number(x.days||0)+'</td></tr>'}
 return h+'</tbody></table></div><p class="foot">未實現損益未扣除未來賣出成本；「承接」代表保留 v3.9.4 已有持股。</p>'}
function paperLedger(a){let log=(a.log||[]).slice().sort((x,y)=>String(y.date).localeCompare(String(x.date))).slice(0,50);
 if(!log.length)return '<p class="foot">尚無交易紀錄；有買進或賣出時會自動記錄。</p>';
 let h='<div class="tableScroll"><table class="paperTable"><thead><tr><th>日期</th><th>動作</th><th>股票</th><th>股數</th><th>價格</th><th>備註</th></tr></thead><tbody>';
 for(let x of log)h+='<tr><td>'+paperEsc(x.date)+'</td><td>'+ (x.type==='buy'?'買進':'賣出')+'</td><td>'+paperEsc(STOCK_NAME[x.code]||x.code)+' '+paperEsc(x.code)+'</td><td>'+paperEsc(x.shares??'—')+'</td><td>'+ (Number.isFinite(Number(x.price))?Number(x.price).toFixed(2):'—')+'</td><td>'+paperEsc(x.reason||'')+'</td></tr>';
 return h+'</tbody></table></div><p class="foot">最多顯示最近50筆，完整交易紀錄包含於備份檔。</p>'}
function paperChart(a){let eq=a.equity||[];
 if(eq.length<2)return '<p class="foot">尚不足兩個更新日，暫無績效曲線。</p>';
 let points=eq.map(x=>Number(x.e)||100000),lo=Math.min(...points),hi=Math.max(...points),range=hi-lo||1;
 const pts=points.map((v,i)=>(8+i*344/Math.max(1,points.length-1)).toFixed(1)+','+(100-(v-lo)*85/range).toFixed(1)).join(' ');
 return '<svg class="paperChart" viewBox="0 0 360 120" role="img" aria-label="帳戶歷史總資產走勢"><polyline points="'+pts+'" fill="none" stroke="#64c4fa" stroke-width="2.5" stroke-linejoin="round"/></svg><div class="paperDates">'+paperEsc(eq[0].d)+' → '+paperEsc(eq[eq.length-1].d)+'｜'+eq.length+' 個資產記錄</div>'}
function paperRender(msg=''){
 let p=paperLoad();if(!p){$('paperResult').textContent='尚未啟用紙上模擬。';return}
 $('paperResult').innerHTML=(msg?'<p class="statusText">'+paperEsc(msg)+'</p>':'')+
 '<p>啟用日：<b>'+paperEsc(p.started)+'</b>｜最後更新：<b>'+paperEsc(p.lastDate||'尚未更新')+'</b></p>'+
 '<div class="compare">'+paperAccountCard('基準：無停損',p.base)+paperAccountCard('對照：固定 -10%',p.stop)+'</div>'+
 '<h3>兩組持股明細</h3><h4>無停損</h4>'+paperHoldRows(p.base)+'<h4>固定 -10%</h4>'+paperHoldRows(p.stop)+
 '<h3>買賣交易紀錄</h3><h4>無停損</h4>'+paperLedger(p.base)+'<h4>固定 -10%</h4>'+paperLedger(p.stop)+
 '<h3>每日資產變化</h3><h4>無停損</h4>'+paperChart(p.base)+'<h4>固定 -10%</h4>'+paperChart(p.stop)+
 '<p class="foot">v4.0：收盤後產生訊號，下一交易日以官方開盤價進行假設成交。-10%為收盤價觸發、下一交易日開盤價賣出，不保證能以-10%成交。' +
 '沿用舊版每次買進／賣出各扣0.585%的費用設定（總計約1.17%，不是原先所稱往返0.585%）。未來新增交易不改費率，避免破壞帳戶連續性。' +
 '若漏掉交易日，系統為避免倒填而暫停交易更新。歷史與紙上模擬皆不保證未來績效。</p>';
}
function paperInit(){let p=paperLoad();if(!p){p=paperNew();paperSave(p)}paperRender('紙上帳戶已啟用，原有持股與餘額保留。')}
function paperBackup(){let p=paperLoad();if(!p){paperRender('尚未啟用帳戶，無資料可備份。');return}
 const payload={format:'SmartStockAI-paper-v4',exportedAt:new Date().toISOString(),account:p};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='SmartStockAI_紙上帳戶_'+twDate()+'.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);paperRender('已產生紙上帳戶 JSON 備份。')}
async function paperRestore(ev){const f=ev.target.files&&ev.target.files[0];if(!f)return;
 try{const obj=JSON.parse(await f.text());if(obj.format!=='SmartStockAI-paper-v4'||!obj.account||!obj.account.base||!obj.account.stop||!Array.isArray(obj.account.base.pos)||!Array.isArray(obj.account.stop.pos))throw Error('備份格式不符合 v4.0');
 if(!confirm('匯入會覆蓋目前手機裡的兩個紙上模擬帳戶。確定要繼續嗎？'))return;
 paperSave(obj.account);paperRender('已匯入備份，原有資料已由備份取代。');
 }catch(e){paperRender('匯入失敗：'+String(e.message||e))}finally{ev.target.value=''}}
// Reuse the same, proven one-stock × one-month TWSE fetch; 4th field is the official open.
async function paperLatestHistory(code){
 if(!DB)await openDB();
 let parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 let y=+parts.find(x=>x.type==='year').value,m=+parts.find(x=>x.type==='month').value,ym=String(y)+String(m).padStart(2,'0')+'01';
 let all=[],err='';for(let month of M){let x=await idbGet(code+'_'+month);if(Array.isArray(x))all.push(...x)}
 let fresh=null;
 for(let attempt=1;attempt<=3;attempt++){
  let ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);
  try{let r=await fetch('https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?date='+ym+'&stockNo='+code+'&response=json&_='+Date.now(),{cache:'no-store',signal:ctl.signal});
   if(!r.ok)throw Error('HTTP '+r.status);let j=await r.json();if(j.stat!=='OK')throw Error('TWSE '+j.stat);
   fresh=(j.data||[]).map(q=>[dk(q[0]),n(q[6]),n(q[1]),n(q[3])]).filter(q=>q[1]>0);if(!fresh.length)throw Error('空月份');break;
  }catch(e){err=e.message||String(e);if(attempt<3)await sleep(attempt*700)}finally{clearTimeout(timer)}
 }
 if(fresh){all.push(...fresh);await idbPut(code+'_'+ym,fresh)}
 let daymap=new Map();for(let x of all){let d=Array.isArray(x)?x[0]:x.d,c=+(Array.isArray(x)?x[1]:x.c),v=+(Array.isArray(x)?x[2]:x.v),op=+(Array.isArray(x)?x[3]:x.o);
 if(/^\d{4}-\d\d-\d\d$/.test(d)&&c>0){let prev=daymap.get(d);daymap.set(d,[d,c,Number.isFinite(v)?v:0,op>0?op:(prev?prev[3]:0)])}}
 return {rows:[...daymap.values()].sort((a,b)=>a[0].localeCompare(b[0])),error:fresh?'':err};
}
// Daily event order: prior-close orders at next open; new signal at this close, never same-day fill.
function paperApplyDay(a,date,prices,opens,signals,stopEnabled){
 let actions={buys:0,sells:0,missingOpen:0};
 let pending=a.pending||{date:null,buys:[],sells:[]};
 let sellCarry=[];
 if(pending.date&&pending.date<date){
  for(let code of pending.sells){let i=a.pos.findIndex(x=>x.code===code);if(i<0)continue;let x=a.pos[i],op=opens[code];
   if(!(op>0)){actions.missingOpen++;sellCarry.push(code);continue}
   let gross=x.shares*op,fee=gross*PAPER_FEE;a.cash+=gross-fee;
   let pnl=gross-fee-x.shares*x.entry-(x.buyFee||0);
   a.trades.push({code,in:x.in,out:date,entry:x.entry,exit:op,shares:x.shares,fee,pnl,r:pnl/(x.shares*x.entry),reason:x.queuedReason||'time'});
   a.log.push({date,type:'sell',code,shares:x.shares,price:op,reason:x.queuedReason==='stop'?'前日收盤觸發停損': '持有20日到期'});
   a.pos.splice(i,1);actions.sells++;
  }
  for(let s of pending.buys){if(a.pos.length>=5)break;if(a.pos.some(x=>x.code===s.code))continue;let op=opens[s.code];if(!(op>0)){actions.missingOpen++;continue}
   let val=a.cash+a.pos.reduce((t,x)=>t+(opens[x.code]||x.last||x.entry)*x.shares,0);
   let budget=Math.min(a.cash,val/5);let qty=Math.floor(budget/(op*(1+PAPER_FEE)));
   if(qty<1)continue;let principal=qty*op,fee=principal*PAPER_FEE;
   if(principal+fee>a.cash)continue;a.cash-=principal+fee;
   a.pos.push({code:s.code,entry:op,last:op,shares:qty,days:0,in:date,score:s.score,buyFee:fee});
   a.log.push({date,type:'buy',code:s.code,shares:qty,price:op,reason:'前一交易日收盤訊號'});
   actions.buys++;
  }
 }
 for(let x of a.pos){if(prices[x.code]>0)x.last=prices[x.code];if(x.in!==date)x.days=Number(x.days||0)+1;}
 let sell=sellCarry.slice();for(let x of a.pos){if(sell.includes(x.code))continue;if(stopEnabled&&x.last/x.entry-1<=-.10){sell.push(x.code);x.queuedReason='stop'}else if(x.days>=20){sell.push(x.code);x.queuedReason='time'}}
 a.pending={date,buys:signals.map(s=>({code:s.code,score:s.score})),sells:sell};
 let val=paperAssets(a).equity;a.equity.push({d:date,e:val});
 return actions;
}
async function paperRun(){if(paperBusy)return;paperBusy=true;const button=$('paperRun');button.disabled=true;
 try{
  let p=paperLoad();if(!p){p=paperNew();paperSave(p)}
  $('paperResult').textContent='正在取得最新官方收盤與開盤資料… 0/50';
  let hs={},recent={},opens={},close={},datecount={},errors={},valid=0;
  for(let i=0;i<P.length;i++){
   let code=P[i][0],r;
   try{r=await paperLatestHistory(code)}catch(e){r={rows:[],error:String(e.message||e)}}
   hs[code]=r.rows;errors[code]=r.error;
   if(r.rows.length){let last=r.rows[r.rows.length-1];recent[code]=last[0];datecount[last[0]]=(datecount[last[0]]||0)+1}
   $('paperResult').textContent='行情取得中 '+(i+1)+'/50｜最新日期：'+Object.keys(datecount).sort().slice(-1)[0];await sleep(180);
  }
  let dates=Object.keys(datecount).sort(),candidate=dates[dates.length-1];
  if(!candidate){paperRender('沒有取得有效的收盤資料，兩個帳戶保持原狀。');return}
  for(let [code] of P){let h=hs[code],row=h[h.length-1];if(!row||row[0]!==candidate)continue;
   close[code]=row[1];if(row[3]>0)opens[code]=row[3];valid++;
  }
  const excluded=P.filter(([c])=>recent[c]!==candidate).map(([c,n])=>n+' '+c+': '+(recent[c]||'無資料')+(errors[c]?' ('+errors[c]+')':''));
  const diagnostics='最新日 '+candidate+'：收盤 '+valid+'/50、開盤 '+Object.keys(opens).length+'/50。'+(excluded.length?'未納入：'+excluded.join('；'):'');
  if(candidate<p.started){paperRender('最新收盤日早於啟用日，不回填。'+diagnostics);return}
  if(p.lastDate&&candidate<=p.lastDate){paperRender('當日已處理，不會重複交易。'+diagnostics);return}
  if(valid<45){paperRender('當日不足45檔，兩個帳戶未更動。'+diagnostics);return}
  // Future-only discipline: do not silently backdate simulated fills for missed market days.
  if(p.lastDate){let allDays=new Set();for(let h of Object.values(hs))for(let r of h)if(r[0]>p.lastDate&&r[0]<=candidate)allDays.add(r[0]);
   if(allDays.size>1){paperRender('發現漏掉 '+(allDays.size-1)+' 個交易日。為免事後補入虛構成交，暫不更新帳戶。請保留備份並回報此畫面。'+diagnostics);return}
  }
  // Never overwrite a position's latest price with stale data; refuse a day with missing held closes.
  let held=[...p.base.pos,...p.stop.pos].map(x=>x.code),missingHeld=[...new Set(held)].filter(c=>!close[c]);
  if(missingHeld.length){paperRender('持有股票缺少當日收盤價（'+missingHeld.join('、')+'），暫停以避免錯算淨值。'+diagnostics);return}
  let signals=[];for(let [code] of P){if(!close[code])continue;let h=hs[code].filter(x=>x[0]<=candidate);if(h.length<21)continue;
   let v=score(h.map(x=>({d:x[0],c:x[1],v:x[2]})),h.length-1);
   if(v!==null&&v>=TH)signals.push({code,score:v});}
  signals.sort((a,b)=>b.score-a.score);
  let A=paperApplyDay(p.base,candidate,close,opens,signals,false),B=paperApplyDay(p.stop,candidate,close,opens,signals,true);
  p.lastDate=candidate;p.lastFetch={available:valid,signals:signals.length,openAvailable:Object.keys(opens).length};paperSave(p);
  paperRender('完成 '+candidate+'；今日收盤訊號 '+signals.length+' 檔（下一交易日才可買進）。無停損：買 '+A.buys+'／賣 '+A.sells+'；-10%：買 '+B.buys+'／賣 '+B.sells+'。'+
   (A.missingOpen||B.missingOpen?'部分缺少官方開盤價，未假設成交。':'')+diagnostics);
 }catch(e){paperRender('更新失敗、帳戶未確認變更：'+String(e.message||e))}
 finally{paperBusy=false;button.disabled=false}
}

 $('start').onclick=()=>go(false);$('retry').onclick=()=>go(true);$('stop').onclick=()=>{stop=true;if(ctl)ctl.abort()};$('validate').onclick=validate;$('stability').onclick=stability;$('risk').onclick=riskCompare;$('portfolio').onclick=portfolioCompare;$('inspectDB').onclick=inspectIndexedDB;$('paperInit').onclick=paperInit;$('paperRun').onclick=paperRun;$('paperBackup').onclick=paperBackup;$('paperRestore').onchange=paperRestore;paperRender();draw();load();})();