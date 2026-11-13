# SmartStockAI 2.0｜相對大盤強度測試 R1

## 用途
獨立讀取原 SmartStockAI 股票行情 IndexedDB，以及 TAIEX 大盤資料 IndexedDB，計算「相對大盤強度」25 分模組。此版本只讀取資料，不寫入、不修改、不刪除任何資料庫，也不連動紙上帳戶。

## 資料來源
- 股票：`SmartStockAI_MarketData` / `months`，key：`股票代碼_YYYYMM01`，日資料格式支援 `[日期, 收盤價, 成交量]`。
- 大盤：`SmartStockAI2_Research` / `market`，key：`TAIEX_YYYYMM01`，月份物件包含 `rows`，每列有 `date`、`close` 等欄位。

## 評分
- 20 交易日相對強度：5 分
- 60 交易日相對強度：9 分
- 120 交易日相對強度：11 分
- 相對強度＝股票期間報酬率－TAIEX 同期間報酬率。
- 各期間獨立做橫斷面百分位排名，同分採平均名次。
- 缺資料不計 0 分、不重分權重；完整樣本少於 10 檔時不產生排名。

## 安全界線
- 只使用 IndexedDB readonly transaction。
- 若找不到既有資料庫，會中止開啟，不建立空資料庫。
- 不呼叫網路 API。
- 不讀取或更改紙上帳戶 localStorage。
- 不修改舊版 v4.8 檔案。

## 部署
將本資料夾內四個檔案放入 Repository 新資料夾 `SmartStockAI2_RS_Test`，開啟 GitHub Pages 對應網址。
