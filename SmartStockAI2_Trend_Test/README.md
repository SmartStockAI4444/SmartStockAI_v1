# SmartStockAI 2.0｜趨勢分析測試 R1.1

## 用途
獨立讀取原 SmartStockAI 股票行情 IndexedDB，計算第二個評分模組「趨勢分析」25 分。只讀取資料，不寫入、不修改、不刪除任何資料庫，也不連動紙上帳戶。

## 資料來源
- 股票資料庫：`SmartStockAI_MarketData`
- 資料表：`months`
- 月資料 key：`股票代碼_YYYYMM01`
- 日資料格式支援 `[日期, 收盤價, 成交量]`

## 評分規格
五項各 5 分：
1. 收盤價 / MA20 − 1
2. 收盤價 / MA60 − 1
3. 收盤價 / MA120 − 1
4. MA20 / MA60 − 1
5. MA60 / MA120 − 1

MA20/60/120 是截至共同基準日，最近 20/60/120 筆有效股票交易日收盤價的簡單平均。五項指標各自在完整樣本中由弱至強做相對百分位排名，同分採平均名次；每項百分位換算為 5 分。缺資料不當作 0 分、不重分權重；完整樣本少於 10 檔不產生排名。

## 安全界線
- 僅使用 IndexedDB readonly transaction。
- 若資料庫不存在，開啟失敗即停止，不建立空資料庫。
- 不呼叫網路 API。
- 不讀取或更改紙上帳戶 localStorage。
- 不修改舊版 v4.8 或其他測試資料夾。

## 部署
將本資料夾四個檔案放入 Repository 新資料夾 `SmartStockAI2_Trend_Test`，不要覆蓋舊資料夾或根目錄。GitHub Pages 網址：`https://smartstockai4444.github.io/SmartStockAI_v1/SmartStockAI2_Trend_Test/`
