(function(){"use strict";
var month=document.getElementById("month"),btn=document.getElementById("test"),step=document.getElementById("step"),result=document.getElementById("result"),log=document.getElementById("log");
function add(s){var d=document.createElement("div");d.textContent=new Date().toLocaleTimeString()+"｜"+s;log.prepend(d)}
function fill(){var d=new Date(),i,x,o;for(i=0;i<18;i++){x=new Date(d.getFullYear(),d.getMonth()-i,1);o=document.createElement("option");o.value=String(x.getFullYear())+String(x.getMonth()+1).padStart(2,"0")+"01";o.textContent=x.getFullYear()+" / "+String(x.getMonth()+1).padStart(2,"0");month.appendChild(o)}}
function timeoutFetch(url,ms){var ctl=new AbortController(),t=setTimeout(function(){ctl.abort()},ms);return fetch(url,{cache:"no-store",signal:ctl.signal}).finally(function(){clearTimeout(t)})}
btn.onclick=async function(){
 btn.disabled=true;month.disabled=true;result.textContent="尚無結果";
 var m=month.value,url="https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?date="+m+"&stockNo=2330&response=json&_="+Date.now();
 try{
  step.textContent="步驟 1/4：按鈕正常，準備連線";add("開始測試 "+m.slice(0,6));
  await new Promise(function(r){setTimeout(r,150)});
  step.textContent="步驟 2/4：正在連線 TWSE（最多 8 秒）";add("開始 fetch");
  var r=await timeoutFetch(url,8000);add("收到 HTTP 回應："+r.status);
  if(!r.ok)throw new Error("HTTP "+r.status);
  step.textContent="步驟 3/4：解析 JSON";
  var j=await r.json();add("JSON 解析完成，stat="+(j.stat||"無"));
  if(j.stat!=="OK")throw new Error("TWSE "+(j.stat||"回應異常"));
  step.textContent="步驟 4/4：檢查資料";
  var rows=j.data||[];if(!rows.length)throw new Error("本月份沒有交易資料");
  var last=rows[rows.length-1];
  result.innerHTML="<b>✓ 測試成功</b><br>台積電 2330<br>月份："+m.slice(0,6)+"<br>取得交易日："+rows.length+" 筆<br>最新資料日期："+last[0]+"<br>收盤價："+last[6];
  step.textContent="完成：這個月份取得成功";add("測試成功");
 }catch(e){
  var msg=e&&e.name==="AbortError"?"連線超過 8 秒":((e&&e.message)||String(e));
  result.innerHTML="<b class='bad'>✕ 測試失敗</b><br>"+msg;step.textContent="診斷停止";add("錯誤："+msg);
 }finally{btn.disabled=false;month.disabled=false}
};
fill();add("v2.6 JavaScript 已啟動");
})();