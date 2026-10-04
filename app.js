(function(){
"use strict";
var btn=document.getElementById("test"),step=document.getElementById("step"),result=document.getElementById("result"),log=document.getElementById("log");
function add(s){var d=document.createElement("div");d.textContent=new Date().toLocaleTimeString()+"｜"+s;log.prepend(d);}
function ym(){var d=new Date();return ""+d.getFullYear()+String(d.getMonth()+1).padStart(2,"0")+"01";}
function timeoutFetch(url,ms){var ctl=new AbortController(),t=setTimeout(function(){ctl.abort();},ms);return fetch(url,{cache:"no-store",signal:ctl.signal}).finally(function(){clearTimeout(t);});}
btn.onclick=async function(){
 btn.disabled=true;result.textContent="尚無結果";
 var m=ym(),url="https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?date="+m+"&stockNo=2330&response=json&_="+Date.now();
 try{
   step.textContent="步驟 1/4：按鈕正常，準備連線";add("按鈕事件正常");
   await new Promise(function(r){setTimeout(r,150);});
   step.textContent="步驟 2/4：正在連線 TWSE（最多等待 8 秒）";add("開始 fetch");
   var r=await timeoutFetch(url,8000);add("收到 HTTP 回應："+r.status);
   step.textContent="步驟 3/4：已收到伺服器回應，解析 JSON";
   if(!r.ok)throw new Error("HTTP "+r.status);
   var j=await r.json();add("JSON 解析完成，stat="+(j.stat||"無"));
   step.textContent="步驟 4/4：檢查資料";
   var rows=j.data||[];
   if(!rows.length)throw new Error("TWSE 有回應，但本月份沒有交易資料");
   var last=rows[rows.length-1];
   result.innerHTML="<b>✓ 測試成功</b><br>台積電 2330<br>月份："+m.slice(0,6)+"<br>取得交易日："+rows.length+" 筆<br>最新資料日期："+last[0]+"<br>收盤價："+last[6];
   step.textContent="完成：手機可以直接取得 TWSE 單月資料";add("測試成功");
 }catch(e){
   var msg=(e&&e.name==="AbortError")?"連線超過 8 秒，已自動停止":((e&&e.message)||String(e));
   result.innerHTML="<b>✕ 測試失敗</b><br>"+msg;
   step.textContent="診斷停止";add("錯誤："+msg);
 }finally{btn.disabled=false;}
};
add("v2.3 JavaScript 已啟動");
})();