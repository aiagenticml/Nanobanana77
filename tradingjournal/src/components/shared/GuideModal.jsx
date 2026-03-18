import { useState } from 'react'
import Modal from './Modal'

const sections = [
  {
    title: 'Supabase Setup',
    content: [
      { type: 'p', text: 'The app uses Supabase as its database. You need a free Supabase project to store your trades.' },
      { type: 'steps', items: [
        'Go to supabase.com and create a new project.',
        'Open the SQL Editor and run the SQL shown in Settings > Supabase Table Setup.',
      ]},
      { type: 'steps', start: 3, items: [
        'Go to Settings > API in your Supabase dashboard.',
        'Copy the Project URL and anon/public key.',
        'Create a .env.local file in the tradingjournal/ folder:',
      ]},
      { type: 'code', text: `VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key` },
      { type: 'steps', start: 6, items: [
        'For trade screenshots, create a storage bucket named "uploads" with public access in Supabase > Storage.',
        'Restart the dev server (npm run dev) after adding the env file.',
      ]},
    ],
  },
  {
    title: 'MetaTrader 5 Setup',
    content: [
      { type: 'p', text: 'MT5 trades are exported via an Expert Advisor script that runs inside MetaTrader and auto-generates a CSV file you can import.' },
      { type: 'h3', text: 'Installing the Exporter' },
      { type: 'steps', items: [
        'In MT5, go to File > Open Data Folder.',
        'Copy MT5_TradeExporter.mq5 (from tradingjournal/scripts/) into the MQL5/Experts/ folder.',
        'Back in MT5, right-click Expert Advisors in the Navigator panel > Refresh.',
        'Drag MT5_TradeExporter onto any chart. A settings dialog will appear.',
      ]},
      { type: 'h3', text: 'Exporter Settings' },
      { type: 'table', headers: ['Setting', 'Default', 'Description'], rows: [
        ['ExportIntervalMinutes', '60', 'Auto-export every N minutes. Set to 0 for one-time export.'],
        ['HistoryDays', '90', 'How far back to pull closed trades.'],
        ['FileName', 'trade_history.csv', 'Output CSV file name.'],
      ]},
      { type: 'p', text: 'The CSV is saved to your MT5 data folder under MQL5/Files/. To find this path, check File > Open Data Folder in MT5.' },
      { type: 'h3', text: 'Importing into the Journal' },
      { type: 'steps', items: [
        'Go to Settings > Import CSV in the trading journal app.',
        'Select the trade_history.csv file from your MT5 Files folder.',
        'The app auto-detects it as an MT5 export and shows a preview.',
        'Click Import — duplicates are automatically skipped.',
      ]},
    ],
  },
  {
    title: 'Switching MT5 Accounts',
    content: [
      { type: 'p', text: 'When you switch broker accounts in MT5, the exporter continues working — it reads from whatever account is currently logged in.' },
      { type: 'h3', text: 'Steps' },
      { type: 'steps', items: [
        'In MT5, go to File > Login to Trade Account (or click your account number in the Navigator).',
        'Enter your new account credentials and connect.',
        'The Expert Advisor stays attached to the chart — no need to re-add it.',
        'It will export the trade history of the newly connected account on its next cycle.',
        'Import the new CSV as usual. Trades from your previous account won\'t be duplicated since the symbols, dates, and prices will differ.',
      ]},
      { type: 'h3', text: 'Tips' },
      { type: 'list', items: [
        'Each account has its own trade history, so switching accounts automatically gives you a fresh export.',
        'If you use multiple accounts simultaneously, consider changing the FileName setting to keep exports separate.',
        'When importing via CSV, you can set an account label (e.g. "FTMO", "IC Markets Live") so you can filter trades by account in the Trade Log.',
      ]},
    ],
  },
  {
    title: 'Tradovate Setup',
    content: [
      { type: 'p', text: 'Tradovate trades can be imported two ways: automated via a Playwright script, or manually via CSV export.' },
      { type: 'h3', text: 'Option A: Automated Import (Playwright)' },
      { type: 'steps', items: [
        'Install dependencies from the tradingjournal/ folder:',
      ]},
      { type: 'code', text: `npm install playwright @supabase/supabase-js
npx playwright install chromium` },
      { type: 'steps', start: 2, items: [
        'Add your Tradovate credentials to .env.local:',
      ]},
      { type: 'code', text: `TRADOVATE_EMAIL=your-email@example.com
TRADOVATE_PASSWORD=your-password` },
      { type: 'steps', start: 3, items: [
        'Run the import script:',
      ]},
      { type: 'code', text: 'node scripts/tradovate-import.js' },
      { type: 'steps', start: 4, items: [
        'A browser window opens, logs into Tradovate, and downloads your trade history.',
        'Trades are automatically parsed, deduplicated, and inserted into your journal.',
      ]},
      { type: 'p', text: 'Note: If Tradovate updates their UI, the script selectors may break. Fall back to Option B if this happens.' },
      { type: 'h3', text: 'Option B: Manual CSV Import' },
      { type: 'steps', items: [
        'Log into Tradovate and navigate to your account performance / trade history.',
        'Export or download the trade history as CSV.',
        'In the journal app, go to Settings > Import CSV and upload the file.',
      ]},
    ],
  },
  {
    title: 'Logging Trades Manually',
    content: [
      { type: 'p', text: 'You can always add trades by hand from the Trade Log tab.' },
      { type: 'steps', items: [
        'Go to the Trade Log tab and tap the + button.',
        'Fill in the trade details: date, symbol, direction, entry/exit prices, lot size.',
        'P&L is auto-calculated from your prices, but you can override it by typing in the P&L field.',
        'Optionally add a setup tag, account label, notes, and a screenshot.',
        'Tap Add Trade to save.',
      ]},
      { type: 'h3', text: 'Fields' },
      { type: 'table', headers: ['Field', 'Notes'], rows: [
        ['Instrument', 'Forex or Futures — affects lot/contract label'],
        ['Direction', 'Long (buy) or Short (sell)'],
        ['P&L', 'Auto-calculated unless you manually type a value'],
        ['Setup Tag', 'Categorize your trade strategy for analytics'],
        ['Account', 'Label trades by broker/account for filtering'],
        ['Screenshot', 'Upload a chart screenshot (stored in Supabase Storage)'],
      ]},
    ],
  },
  {
    title: 'Deploying to Vercel',
    content: [
      { type: 'p', text: 'The app can be deployed to Vercel for free so you can access it from any device.' },
      { type: 'steps', items: [
        'Push the repo to GitHub.',
        'Go to vercel.com and import the repository.',
        'Set the Root Directory to tradingjournal in the project settings.',
        'Add the two environment variables in Vercel > Settings > Environment Variables:',
      ]},
      { type: 'code', text: `VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key` },
      { type: 'steps', start: 5, items: [
        'Deploy. Vercel auto-deploys on every push to main.',
      ]},
    ],
  },
]

function renderBlock(block, i) {
  switch (block.type) {
    case 'p':
      return <p key={i} className="text-sm text-text-secondary">{block.text}</p>
    case 'h3':
      return <h3 key={i} className="text-sm font-semibold text-text pt-2">{block.text}</h3>
    case 'steps':
      return (
        <ol key={i} start={block.start ?? 1} className="text-sm text-text-secondary space-y-1 pl-5 list-decimal">
          {block.items.map((item, j) => <li key={j}>{item}</li>)}
        </ol>
      )
    case 'list':
      return (
        <ul key={i} className="text-sm text-text-secondary space-y-1 pl-5 list-disc">
          {block.items.map((item, j) => <li key={j}>{item}</li>)}
        </ul>
      )
    case 'code':
      return (
        <pre key={i} className="bg-surface-50 rounded-lg p-3 text-xs text-text-secondary overflow-x-auto whitespace-pre-wrap font-mono">
          {block.text}
        </pre>
      )
    case 'table':
      return (
        <div key={i} className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-xs">
            <thead className="bg-surface-50">
              <tr>
                {block.headers.map((h, j) => (
                  <th key={j} className="px-3 py-1.5 text-left text-text-muted font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {block.rows.map((row, j) => (
                <tr key={j}>
                  {row.map((cell, k) => (
                    <td key={k} className="px-3 py-1.5 text-text-secondary">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    default:
      return null
  }
}

export default function GuideModal({ onClose }) {
  const [open, setOpen] = useState(null)

  return (
    <Modal title="Getting Started" onClose={onClose}>
      <div className="space-y-2 -mt-1">
        <p className="text-xs text-text-muted mb-3">Tap a section to expand it.</p>
        {sections.map((section, i) => (
          <div key={i} className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text hover:bg-surface-50 transition-colors"
            >
              <span>{section.title}</span>
              <span className={`text-text-muted transition-transform ${open === i ? 'rotate-180' : ''}`}>
                &#9662;
              </span>
            </button>
            {open === i && (
              <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                {section.content.map((block, j) => renderBlock(block, j))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  )
}
