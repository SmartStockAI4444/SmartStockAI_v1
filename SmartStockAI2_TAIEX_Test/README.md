# SmartStockAI 2.0｜TAIEX 大盤資料模組 R1.0

## 本 ZIP 的目的
這是獨立的第一階段資料模組測試版，只負責取得及保存臺灣加權股價指數（TAIEX）36 個月歷史資料。它不是完整選股程式，也不會修改 SmartStockAI v4.8。

## 資料來源
臺灣證券交易所官方歷史指數資料：
- 官方查詢頁：https://www.twse.com.tw/zh/indices/taiex/mi-5min-hist.html
- 歷史資料端點：`https://www.twse.com.tw/rwd/zh/TAIEX/MI_5MINS_HIST?date=YYYYMM01&response=json`
- 政府資料開放平台資料集：https://data.gov.tw/dataset/11755

程式逐月取得官方 JSON，檢查 `日期、開盤指數、最高指數、最低指數、收盤指數` 欄位後才保存。日期轉換為西元 `YYYY-MM-DD`，數值移除千分位逗號。

## 儲存方式
使用全新 IndexedDB：
- Database：`SmartStockAI2_Research`
- Object store：`market`
- Key：`TAIEX_YYYYMM01`

每月資料以物件保存，含月份、來源、保存時間及 rows。每筆 row 為：
`{date, open, high, low, close}`

原有 v4.8 資料庫 `SmartStockAI_MarketData` 完全不讀寫、不刪除、不覆蓋。

## 手機操作
1. 解壓縮 ZIP。
2. 將資料夾內容部署到 GitHub Pages 的獨立測試路徑（不要覆蓋 v4.8 根目錄）。
3. 開啟該測試頁。
4. 按「開始／繼續取得 36 個月大盤資料」。
5. 等待完成；中途離開可回到頁面再按一次，已保存月份會略過。
6. 把「資料完整性檢查」結果截圖回傳。

## 注意
- TWSE 是官方收盤後歷史資料，不是即時行情。
- 手機請保持頁面在前景；瀏覽器背景休眠可能暫停請求。
- 程式每月最多重試 3 次，月份間隔 1.8 秒；若來源服務限制請求，稍後可再續傳。
- 此模組尚未與 v4.8 合併，也尚未開始五大評分計算。
- 資料取得後仍需檢查月份完整性、日期連續性及與官方頁面抽樣核對。
