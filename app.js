(function(){"use strict";
var P=[["2330","台積電"],["2454","聯發科"],["2308","台達電"],["2382","廣達"],["3231","緯創"]],$=x=>document.getElementById(x),running=false,stop=false,ctl=null;
function months(){var d=new Date(),a=[];for(var i=0;i<18;i++){var x=new Date(d.getFullYear(),d.getMonth()-i,1);a.push(""+x.getFullYear()+String(x.getMonth()+1).padStart(2,"0")+"01")}return a}
var M=months(),S={};P.forEach(p=>M.forEach(m=>S[p[0]+"_"+m]={s:"等待",msg:""}));
function log(x){var d=document.createElement("div");d.textContent=new Date().toLocaleTimeString()+"｜"+x;$("log").prepend(d);while($("log").children.length>30)$("log").removeChild($("log").lastChild)}
function draw(){var ok=0,fail=0,html="";P.forEach(p=>{var po=0,pf=0,active="";M.forEach(m=>{var x=S[p[0]+"_"+m];if(x.s==="成功"){ok++;po++}if(x.s==="失敗"){fail++;pf++}if(x.s==="處理中")active=m.slice(0,6)});html+='<div class="card"><b>'+p[1]+' '+p[0]+'</b><span>成功 '+po+'/18'+(pf?'｜失敗 '+pf:'')+(active?'｜處理 '+active:'')+'</span></div>'});var done=ok+fail;$("summary").textContent="完成 "+done+" / 90｜成功 "+ok+"｜失敗 "+fail;$("bar").style.width=(done/90*100)+"%";$("stocks").innerHTML=html}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
async function one(p,m){var k=p[0]+"_"+m;S[k]={s:"處理中",msg:""};draw();$("work").innerHTML="正在處理 <b>"+p[1]+" "+p[0]+"</b><br>"+m.slice(0,4)+" / "+m.slice(4,6);ctl=new AbortController();var t=setTimeout(()=>ctl.abort(),8000);
try{var r=await fetch("https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?date="+m+"&stockNo="+p[0]+"&response=json&_="+Date.now(),{cache:"no-store",signal:ctl.signal});if(!r.ok)throw Error("HTTP "+r.status);var j=await r.json();if(j.stat!=="OK")throw Error(j.stat||"TWSE異常");var a=j.data||[];if(!a.length)throw Error("無交易資料");S[k]={s:"成功",msg:a.length+"筆"};log("✓ "+p[1]+" "+m.slice(0,6)+" "+a.length+"筆")}
catch(e){var msg=e.name==="AbortError"?(stop?"已停止":"逾時"):e.message;if(stop){S[k]={s:"等待",msg:""}}else{S[k]={s:"失敗",msg:msg};log("✕ "+p[1]+" "+m.slice(0,6)+" "+msg)}}finally{clearTimeout(t);ctl=null;draw()}}
$("start").onclick=async function(){if(running)return;running=true;stop=false;$("start").disabled=true;$("stop").disabled=false;
for(var pi=0;pi<P.length&&!stop;pi++){for(var mi=0;mi<M.length&&!stop;mi++){var k=P[pi][0]+"_"+M[mi];if(S[k].s==="成功"||S[k].s==="失敗")continue;await one(P[pi],M[mi]);if(!stop)await wait(700)}if(!stop)await wait(1200)}
running=false;$("start").disabled=false;$("stop").disabled=true;var left=Object.values(S).filter(x=>x.s==="等待").length;$("work").textContent=stop?"已停止，可按開始繼續。":left===0?"✓ 90 個月股任務全部處理完成":"本輪結束。";draw()};
$("stop").onclick=function(){stop=true;if(ctl)ctl.abort();$("work").textContent="正在停止…"};
draw();log("v2.9 JavaScript 已啟動");
})();