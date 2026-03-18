//+------------------------------------------------------------------+
//| MT5_TradeExporter.mq5                                            |
//| Expert Advisor — exports closed trade history to CSV             |
//| Place in: MT5 Data Folder > MQL5 > Experts                      |
//| Output:   MQL5/Files/trade_history.csv                           |
//+------------------------------------------------------------------+
#property copyright "TradingJournal"
#property version   "1.00"
#property description "Auto-exports closed trades to CSV for journal import"

//--- Settings
input int    ExportIntervalMinutes = 60;    // How often to export (0 = once on attach)
input int    HistoryDays           = 90;    // How many days of history to export
input string FileName              = "trade_history.csv";

datetime lastExport = 0;

//+------------------------------------------------------------------+
int OnInit()
{
   Export();
   if(ExportIntervalMinutes > 0)
      EventSetTimer(ExportIntervalMinutes * 60);
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
}

//+------------------------------------------------------------------+
void OnTimer()
{
   Export();
}

//+------------------------------------------------------------------+
void Export()
{
   datetime from = TimeCurrent() - HistoryDays * 86400;
   datetime to   = TimeCurrent();

   if(!HistorySelect(from, to))
   {
      Print("Failed to select history");
      return;
   }

   int totalDeals = HistoryDealsTotal();
   if(totalDeals == 0)
   {
      Print("No deals in history");
      return;
   }

   // --- Group deals by position ID to pair entries and exits ---
   // Using simple arrays since MQL5 doesn't have maps
   long   posIds[];
   int    posCount = 0;

   // First pass: collect unique position IDs that have an OUT deal (closed trades only)
   for(int i = 0; i < totalDeals; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;

      long dealEntry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if(dealEntry != DEAL_ENTRY_OUT) continue; // only care about exit deals

      long posId = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
      if(posId == 0) continue;

      // Check if already collected
      bool found = false;
      for(int j = 0; j < posCount; j++)
      {
         if(posIds[j] == posId) { found = true; break; }
      }
      if(!found)
      {
         posCount++;
         ArrayResize(posIds, posCount);
         posIds[posCount - 1] = posId;
      }
   }

   if(posCount == 0)
   {
      Print("No closed trades found in history");
      return;
   }

   // --- Open file ---
   int handle = FileOpen(FileName, FILE_WRITE | FILE_CSV | FILE_ANSI, ',');
   if(handle == INVALID_HANDLE)
   {
      Print("Failed to open file: ", FileName);
      return;
   }

   // Header — matches what csvParser.js expects for MT5
   FileWrite(handle, "Open Time", "Symbol", "Type", "Volume", "Open Price", "Close Price", "Profit");

   int written = 0;

   // For each position, find IN and OUT deals
   for(int p = 0; p < posCount; p++)
   {
      long posId = posIds[p];

      // Find entry deal
      ulong entryTicket = 0;
      ulong exitTicket  = 0;

      for(int i = 0; i < totalDeals; i++)
      {
         ulong ticket = HistoryDealGetTicket(i);
         if(ticket == 0) continue;

         long pid = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
         if(pid != posId) continue;

         long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
         if(entry == DEAL_ENTRY_IN)  entryTicket = ticket;
         if(entry == DEAL_ENTRY_OUT) exitTicket  = ticket;
      }

      if(entryTicket == 0 || exitTicket == 0) continue;

      // Extract fields
      string symbol     = HistoryDealGetString(entryTicket, DEAL_SYMBOL);
      long   dealType   = HistoryDealGetInteger(entryTicket, DEAL_TYPE);
      string typeStr    = (dealType == DEAL_TYPE_BUY) ? "buy" : "sell";
      double volume     = HistoryDealGetDouble(entryTicket, DEAL_VOLUME);
      double openPrice  = HistoryDealGetDouble(entryTicket, DEAL_PRICE);
      double closePrice = HistoryDealGetDouble(exitTicket, DEAL_PRICE);
      double profit     = HistoryDealGetDouble(exitTicket, DEAL_PROFIT)
                        + HistoryDealGetDouble(exitTicket, DEAL_COMMISSION)
                        + HistoryDealGetDouble(exitTicket, DEAL_SWAP);

      datetime openTime = (datetime)HistoryDealGetInteger(entryTicket, DEAL_TIME);
      string timeStr    = TimeToString(openTime, TIME_DATE | TIME_MINUTES);

      FileWrite(handle, timeStr, symbol, typeStr,
                DoubleToString(volume, 2),
                DoubleToString(openPrice, (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS)),
                DoubleToString(closePrice, (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS)),
                DoubleToString(profit, 2));

      written++;
   }

   FileClose(handle);

   string path = TerminalInfoString(TERMINAL_DATA_PATH) + "\\MQL5\\Files\\" + FileName;
   Print("Exported ", written, " trades to ", path);
   lastExport = TimeCurrent();
}
//+------------------------------------------------------------------+
