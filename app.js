(function(){"use strict";
var CODE="2330",TIMEOUT=8000,$=function(x){return document.getElementById(x)},busy=false;
function list(){var d=new Date(),a=[],i,x;for(i=17;i>=0;i--){x=new Date(d.getFullYear(),d.getMonth()-i,1);a.push(String(x.getFullYear())+String(x.getMonth()+1).padStart(2,"0")+"01")}return a}
var M=list();
function sk(m){return"ssa25s_"+m} function dk(m){return"ssa25d_"+m}
function gs(m){try{return JSON.parse(localStorage.getItem(sk(m))||'{"s":"等待","msg":""}')}catch(e){return{s:"等待",msg:""}}}
function ss(m,s,msg){localStorage.setItem(sk(m),JSON.stringify({s:s,msg:msg||""}))}
function render(){var done=0,html="",i,x;for(i=0;i<M.length;i++){x=gs(M[i]);if(x.s==="成功")done++;html+='<div class="row '+x.s+'"><b>'+M[i].slice(0,4)+' / '+M[i].slice(4,6)+'</b><span>'+x.s+(x.msg?'｜'+x.msg:'')+'</span></div>'}$("count").textContent="完成 "+done+" / 18";$("bar").style.width=(done/18*100)+"%";$("months").innerHTML=html}
function target(retry){var i,s;if(retry){for(i=0;i<M.length;i++){s=gs(M[i]);if(s.s==="失敗")return M[i]}}else{for(i=0;i<M.length;i++){s=gs(M[i]);if(s.s!=="成功")return M[i]}}return null}
async function run(retry){if(busy)return;busy=true;$("next").disabled=true;$("retry").disabled=true;var m=target(retry);if(!m){$("work").textContent=retry?"目前沒有失敗月份。":"18 個月份已全部成功。";busy=false;$("next").disabled=false;$("retry").disabled=false;return}
ss(m,"處理中","準備連線");render();$("work").innerHTML="已收到指令：<b>"+m.slice(0,4)+" / "+m.slice(4,6)+"</b><br>正在連線 TWSE（最多 8 秒）";
var ctl=new AbortController(),timer=setTimeout(function(){ctl.abort()},TIMEOUT);
try{
 var u="https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?date="+m+"&stockNo="+CODE+"&response=json&_="+Date.now();
 var r=await fetch(u,{cache:"no-store",signal:ctl.signal});if(!r.ok)throw Error("HTTP "+r.status);
 var j=await r.json();if(j.stat!=="OK")throw Error("TWSE "+(j.stat||"異常"));
 var rows=j.data||[];if(!rows.length)throw Error("無交易資料");
 localStorage.setItem(dk(m),JSON.stringify(rows));ss(m,"成功",rows.length+" 筆");
 $("work").innerHTML="<b>✓ 本月成功</b><br>"+m.slice(0,4)+" / "+m.slice(4,6)+"｜取得 "+rows.length+" 個交易日。<br>請再按一次「下載下一個月份」。";
}catch(e){var msg=e&&e.name==="AbortError"?"逾時":((e&&e.message)||"失敗");ss(m,"失敗",msg);$("work").innerHTML="<b>✕ 本月失敗</b><br>"+m.slice(0,4)+" / "+m.slice(4,6)+"｜"+msg+"<br>可按「重試第一個失敗月份」。"}
finally{clearTimeout(timer);busy=false;$("next").disabled=false;$("retry").disabled=false;render()}
}
$("next").onclick=function(){run(false)};$("retry").onclick=function(){run(true)};
$("reset").onclick=function(){if(!confirm("確定清除 v2.5 進度？"))return;for(var i=0;i<M.length;i++){localStorage.removeItem(sk(M[i]));localStorage.removeItem(dk(M[i]))}render();$("work").textContent="已清除，可重新開始。"};
render();
})();