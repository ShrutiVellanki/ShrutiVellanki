import type { Classification, SplitResponse, Page, Document } from "../types"

/**
 * Pre-defined document distribution for a realistic 300-page HNW tax bundle.
 * Brokerage / consolidated 1099s dominate page count, small forms round it out.
 */
const BUNDLE_MANIFEST: {
  prefix: string
  classification: Classification
  descTemplate: string
  pages: number
}[] = [
  // --- Big brokerage / consolidated statements ---
  { prefix: "1099-COMP", classification: "brokerage",               pages: 62, descTemplate: "Consolidated 1099 — Morgan Stanley" },
  { prefix: "1099-COMP", classification: "brokerage",               pages: 48, descTemplate: "Consolidated 1099 — Charles Schwab" },
  { prefix: "1099-B",    classification: "brokerage",               pages: 24, descTemplate: "1099-B Proceeds from Broker — Fidelity" },
  { prefix: "1099-B",    classification: "brokerage",               pages: 18, descTemplate: "1099-B Proceeds from Broker — Vanguard" },
  { prefix: "1099-B",    classification: "brokerage",               pages: 12, descTemplate: "1099-B Proceeds from Broker — JP Morgan" },
  // --- Medium business / deduction docs ---
  { prefix: "SchedC",    classification: "schedule_c_business",     pages: 14, descTemplate: "Schedule C — Archer Capital LLC" },
  { prefix: "SchedC",    classification: "schedule_c_business",     pages: 8,  descTemplate: "Schedule C — Lighthouse Ventures" },
  { prefix: "SchedA",    classification: "schedule_a_deductions",   pages: 10, descTemplate: "Schedule A itemized deductions backup" },
  { prefix: "K-1",       classification: "schedule_c_business",     pages: 6,  descTemplate: "Schedule K-1 — Peak Advisory Group LP" },
  { prefix: "K-1",       classification: "schedule_c_business",     pages: 5,  descTemplate: "Schedule K-1 — Riverside Fund II" },
  // --- Wages ---
  { prefix: "W2",        classification: "wages",                   pages: 2,  descTemplate: "W-2 Wage and Tax Statement — Goldman Sachs" },
  { prefix: "W2",        classification: "wages",                   pages: 2,  descTemplate: "W-2 Wage and Tax Statement — Citadel LLC" },
  { prefix: "W2",        classification: "wages",                   pages: 1,  descTemplate: "W-2 Wage and Tax Statement — Board Advisory Fee" },
  // --- Interest ---
  { prefix: "1099-INT",  classification: "schedule_b_interest",     pages: 2,  descTemplate: "1099-INT Interest Income — JP Morgan" },
  { prefix: "1099-INT",  classification: "schedule_b_interest",     pages: 1,  descTemplate: "1099-INT Interest Income — Bank of America" },
  { prefix: "1099-INT",  classification: "schedule_b_interest",     pages: 1,  descTemplate: "1099-INT Interest Income — Wells Fargo" },
  { prefix: "1099-INT",  classification: "schedule_b_interest",     pages: 2,  descTemplate: "1099-INT Interest Income — Merrill Lynch" },
  { prefix: "1099-INT",  classification: "schedule_b_interest",     pages: 1,  descTemplate: "1099-INT Interest Income — Goldman Sachs Bank" },
  // --- Dividends ---
  { prefix: "1099-DIV",  classification: "schedule_b_interest",     pages: 3,  descTemplate: "1099-DIV Dividends — Vanguard" },
  { prefix: "1099-DIV",  classification: "schedule_b_interest",     pages: 2,  descTemplate: "1099-DIV Dividends — Fidelity" },
  { prefix: "1099-DIV",  classification: "schedule_b_interest",     pages: 2,  descTemplate: "1099-DIV Dividends — Charles Schwab" },
  { prefix: "1099-DIV",  classification: "schedule_b_interest",     pages: 1,  descTemplate: "1099-DIV Dividends — JP Morgan" },
  // --- Retirement ---
  { prefix: "1099-R",    classification: "pensions_annuities_iras", pages: 2,  descTemplate: "1099-R Distribution — Fidelity 401(k)" },
  { prefix: "1099-R",    classification: "pensions_annuities_iras", pages: 2,  descTemplate: "1099-R Distribution — Schwab IRA" },
  { prefix: "1099-R",    classification: "pensions_annuities_iras", pages: 1,  descTemplate: "1099-R Distribution — TIAA" },
  { prefix: "5498",      classification: "pensions_annuities_iras", pages: 1,  descTemplate: "IRA Contribution Information — Fidelity" },
  { prefix: "5498",      classification: "pensions_annuities_iras", pages: 1,  descTemplate: "IRA Contribution Information — Schwab" },
  // --- 1099-NEC ---
  { prefix: "1099-NEC",  classification: "schedule_c_business",     pages: 1,  descTemplate: "1099-NEC Nonemployee Compensation — Consulting Group A" },
  { prefix: "1099-NEC",  classification: "schedule_c_business",     pages: 1,  descTemplate: "1099-NEC Nonemployee Compensation — Board of Directors XYZ" },
  { prefix: "1099-NEC",  classification: "schedule_c_business",     pages: 1,  descTemplate: "1099-NEC Nonemployee Compensation — Summit Partners" },
  // --- Mortgage ---
  { prefix: "1098",      classification: "schedule_a_deductions",   pages: 2,  descTemplate: "1098 Mortgage Interest Statement — Chase Home Lending" },
  { prefix: "1098",      classification: "schedule_a_deductions",   pages: 2,  descTemplate: "1098 Mortgage Interest Statement — Rocket Mortgage" },
  { prefix: "1098-T",    classification: "schedule_a_deductions",   pages: 1,  descTemplate: "1098-T Tuition Statement — Columbia University" },
  // --- Charitable ---
  { prefix: "Charity",   classification: "charitable_contributions", pages: 1,  descTemplate: "Charitable donation receipt — Red Cross" },
  { prefix: "Charity",   classification: "charitable_contributions", pages: 1,  descTemplate: "Charitable donation receipt — Doctors Without Borders" },
  { prefix: "Charity",   classification: "charitable_contributions", pages: 1,  descTemplate: "Charitable donation receipt — United Way" },
  { prefix: "Charity",   classification: "charitable_contributions", pages: 1,  descTemplate: "Charitable donation receipt — Habitat for Humanity" },
  { prefix: "Charity",   classification: "charitable_contributions", pages: 1,  descTemplate: "Charitable donation receipt — St. Jude" },
  { prefix: "Charity",   classification: "charitable_contributions", pages: 1,  descTemplate: "Charitable donation receipt — Sierra Club Foundation" },
  { prefix: "Charity",   classification: "charitable_contributions", pages: 1,  descTemplate: "Charitable donation receipt — Metropolitan Museum of Art" },
  // --- Additional small brokerage / misc ---
  { prefix: "1099-B",    classification: "brokerage",               pages: 6,  descTemplate: "1099-B Proceeds from Broker — UBS" },
  { prefix: "1099-B",    classification: "brokerage",               pages: 4,  descTemplate: "1099-B Proceeds from Broker — Merrill Lynch" },
  { prefix: "1099-MISC", classification: "unclassified",            pages: 2,  descTemplate: "1099-MISC Other Income — Rental Property Trust" },
  { prefix: "1099-MISC", classification: "unclassified",            pages: 1,  descTemplate: "1099-MISC Other Income — Jury Duty Pay" },
  { prefix: "1099-SA",   classification: "unclassified",            pages: 1,  descTemplate: "1099-SA HSA Distributions — Fidelity" },
  { prefix: "5498-SA",   classification: "unclassified",            pages: 1,  descTemplate: "5498-SA HSA Contribution Info — Fidelity" },
  // --- More interest / div to round out ---
  { prefix: "1099-INT",  classification: "schedule_b_interest",     pages: 1,  descTemplate: "1099-INT Interest Income — Ally Bank" },
  { prefix: "1099-INT",  classification: "schedule_b_interest",     pages: 1,  descTemplate: "1099-INT Interest Income — Marcus by Goldman" },
  { prefix: "1099-OID",  classification: "schedule_b_interest",     pages: 2,  descTemplate: "1099-OID Original Issue Discount — Treasury Direct" },
  { prefix: "1099-DIV",  classification: "schedule_b_interest",     pages: 1,  descTemplate: "1099-DIV Dividends — T. Rowe Price" },
  { prefix: "1099-DIV",  classification: "schedule_b_interest",     pages: 1,  descTemplate: "1099-DIV Dividends — BlackRock" },
  // --- Property tax / state ---
  { prefix: "PropTax",   classification: "schedule_a_deductions",   pages: 3,  descTemplate: "Property tax statement — Greenwich CT" },
  { prefix: "PropTax",   classification: "schedule_a_deductions",   pages: 2,  descTemplate: "Property tax statement — Aspen CO" },
  { prefix: "State",     classification: "unclassified",            pages: 3,  descTemplate: "State estimated tax payments — CT DRS" },
  { prefix: "State",     classification: "unclassified",            pages: 2,  descTemplate: "State estimated tax payments — CO DOR" },
  // --- Brokerage supplement ---
  { prefix: "1099-COMP", classification: "brokerage",               pages: 8,  descTemplate: "Consolidated 1099 Supplement — Morgan Stanley (corrected)" },
  // --- Additional to reach 300 ---
  { prefix: "Charity",   classification: "charitable_contributions", pages: 1,  descTemplate: "Charitable donation receipt — ACLU Foundation" },
  { prefix: "Charity",   classification: "charitable_contributions", pages: 1,  descTemplate: "Charitable donation receipt — Nature Conservancy" },
  { prefix: "1099-INT",  classification: "schedule_b_interest",     pages: 1,  descTemplate: "1099-INT Interest Income — Capital One" },
  { prefix: "K-1",       classification: "schedule_c_business",     pages: 4,  descTemplate: "Schedule K-1 — Meridian Real Estate Partners" },
  { prefix: "1099-R",    classification: "pensions_annuities_iras", pages: 1,  descTemplate: "1099-R Distribution — Vanguard Roth IRA" },
  { prefix: "1098",      classification: "schedule_a_deductions",   pages: 2,  descTemplate: "1098 Mortgage Interest Statement — Wells Fargo Mortgage" },
  { prefix: "Charity",   classification: "charitable_contributions", pages: 1,  descTemplate: "Charitable donation receipt — Wikimedia Foundation" },
  { prefix: "1099-DIV",  classification: "schedule_b_interest",     pages: 1,  descTemplate: "1099-DIV Dividends — PIMCO Funds" },
]
// Total: 62+48+24+18+12+14+8+10+6+5+2+2+1+2+1+1+2+1+3+2+2+1+2+2+1+1+1+1+1+1+2+2+1+1+1+1+1+1+1+6+4+2+1+1+1+1+1+2+1+1+3+2+3+2+8 = 300

const FORM_TITLES: Record<string, string> = {
  "W2":        "FORM W-2 · WAGE AND TAX STATEMENT",
  "1099-INT":  "FORM 1099-INT · INTEREST INCOME",
  "1099-DIV":  "FORM 1099-DIV · DIVIDENDS AND DISTRIBUTIONS",
  "1099-B":    "FORM 1099-B · PROCEEDS FROM BROKER",
  "1099-COMP": "CONSOLIDATED TAX STATEMENT",
  "1099-NEC":  "FORM 1099-NEC · NONEMPLOYEE COMPENSATION",
  "1099-R":    "FORM 1099-R · DISTRIBUTIONS",
  "1099-MISC": "FORM 1099-MISC · MISCELLANEOUS INCOME",
  "1099-OID":  "FORM 1099-OID · ORIGINAL ISSUE DISCOUNT",
  "1099-SA":   "FORM 1099-SA · HSA DISTRIBUTIONS",
  "1098":      "FORM 1098 · MORTGAGE INTEREST",
  "1098-T":    "FORM 1098-T · TUITION STATEMENT",
  "5498":      "FORM 5498 · IRA CONTRIBUTION INFORMATION",
  "5498-SA":   "FORM 5498-SA · HSA CONTRIBUTION INFORMATION",
  "SchedA":    "SCHEDULE A · ITEMIZED DEDUCTIONS",
  "SchedC":    "SCHEDULE C · PROFIT OR LOSS FROM BUSINESS",
  "K-1":       "SCHEDULE K-1 · PARTNER'S SHARE OF INCOME",
  "Charity":   "CHARITABLE DONATION RECEIPT",
  "PropTax":   "PROPERTY TAX STATEMENT",
  "State":     "STATE ESTIMATED TAX PAYMENT RECORD",
}

const PAGE_SUBTITLES: Record<string, string[]> = {
  "1099-COMP": [
    "Summary of Income",
    "Interest Income Detail",
    "Dividend Income Detail",
    "Short-Term Capital Gains",
    "Long-Term Capital Gains",
    "Proceeds — Covered Securities",
    "Proceeds — Noncovered Securities",
    "Cost Basis Adjustments",
    "Wash Sale Adjustments",
    "Options Transactions",
    "Bond Premium Amortization",
    "Accrued Market Discount",
    "Foreign Tax Paid Detail",
    "Tax-Exempt Interest Detail",
    "State Tax Withheld",
    "Supplemental Information",
    "Account Activity Cont.",
    "Realized Gain/Loss Detail",
    "Unrealized Gain/Loss Summary",
    "Transaction Detail Cont.",
  ],
  "1099-B": [
    "Summary of Proceeds",
    "Short-Term — Basis Reported to IRS",
    "Short-Term — Basis Not Reported",
    "Long-Term — Basis Reported to IRS",
    "Long-Term — Basis Not Reported",
    "Wash Sales Disallowed",
    "Options & Futures Transactions",
    "Transaction Detail Cont.",
    "Cost Basis Reconciliation",
    "Undetermined Term Transactions",
  ],
  "SchedC": [
    "Gross Income",
    "Cost of Goods Sold",
    "Business Expenses",
    "Vehicle & Travel Expenses",
    "Home Office Deduction",
    "Depreciation Detail",
    "Other Expenses Cont.",
  ],
  "SchedA": [
    "Medical & Dental Expenses",
    "Taxes Paid",
    "Interest Paid",
    "Charitable Contributions",
    "Casualty & Theft Losses",
    "Job Expenses & Misc.",
    "Other Deductions",
    "Total Itemized Deductions",
  ],
}

function rng(seed: number) { return ((seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff }

const C = {
  black: "#1a1a1a",
  dark: "#333",
  mid: "#555",
  label: "#666",
  light: "#999",
  rule: "#ccc",
  ruleLight: "#ddd",
  ruleFaint: "#e8e8e8",
  bgAlt: "#f7f7f7",
  bgBox: "#f2f2f2",
  formBlue: "#003366",
  formRed: "#8b0000",
}

const TICKERS = ["AAPL","MSFT","GOOGL","AMZN","TSLA","NVDA","META","BRK.B","JPM","V","JNJ","WMT","PG","UNH","HD",
  "MA","DIS","BAC","PYPL","ADBE","NFLX","CMCSA","PFE","TMO","ABBV","AVGO","CSCO","PEP","COST","NKE",
  "MRK","ABT","DHR","ACN","LLY","TXN","MDT","HON","UPS","PM","NEE","RTX","QCOM","LOW","INTC",
  "SBUX","IBM","CAT","GS","BLK","SPGI","ISRG","AXP","MMM","GE","BA","SCHW","AMT","SYK","BKNG",
  "CVX","XOM","COP","EOG","SLB","OXY","MPC","PSX","VLO","HAL"]
const CUSIPS = TICKERS.map((_, i) => `${String(100 + i * 7).padStart(3,"0")}${String.fromCharCode(65 + i % 26)}${String.fromCharCode(75 - i % 10)}${(1000 + i * 37) % 9999}`)

const BROKERAGE_SECTIONS: string[][] = [
  ["Short-Term Capital Gains — Covered", "Short-Term Capital Gains — Noncovered", "Short-Term — Summary"],
  ["Long-Term Capital Gains — Covered", "Long-Term Capital Gains — Noncovered", "Long-Term — Summary"],
  ["Proceeds from Broker Transactions", "Wash Sales Disallowed", "Options Transactions"],
  ["Interest Income Detail", "Tax-Exempt Interest", "Bond Premium Amortization"],
  ["Dividend Income Detail", "Qualified Dividends Detail", "Section 199A Dividends"],
  ["Foreign Tax Paid Detail", "Foreign Source Income", "Treaty Benefits"],
  ["State Tax Information", "State Tax Withheld", "Supplemental Information"],
  ["Accrued Market Discount", "Original Issue Discount", "Market Discount Detail"],
  ["Realized Gain/Loss Reconciliation", "Unrealized Gain/Loss Summary", "Cost Basis Adjustments"],
  ["Options & Futures — Section 1256", "Regulated Futures Contracts", "Straddle Positions"],
]

function securityRow(seed: number, y: number, idx: number): string {
  const t = TICKERS[(seed + idx * 3) % TICKERS.length]
  const cusip = CUSIPS[(seed + idx * 3) % CUSIPS.length]
  const qty = Math.floor(rng(seed + idx * 7) * 500) + 1
  const price = 20 + Math.floor(rng(seed + idx * 11) * 480)
  const proceeds = qty * price
  const basis = proceeds + Math.floor((rng(seed + idx * 13) - 0.5) * proceeds * 0.3)
  const gl = proceeds - basis
  const bg = idx % 2 === 0 ? `<rect x="56" y="${y - 2}" width="500" height="18" fill="${C.bgAlt}"/>` : ""
  return `${bg}
    <text x="66" y="${y + 9}" font-family="monospace" font-size="7.5" fill="${C.dark}">${t}</text>
    <text x="170" y="${y + 9}" font-family="monospace" font-size="6.5" fill="${C.light}">${cusip}</text>
    <text x="270" y="${y + 9}" font-family="monospace" font-size="7" fill="${C.mid}" text-anchor="end">${qty}</text>
    <text x="310" y="${y + 9}" font-family="monospace" font-size="6.5" fill="${C.label}" text-anchor="end">${(1 + (seed + idx) % 11).toString().padStart(2,"0")}/${(10 + idx % 20).toString().padStart(2,"0")}/2${idx % 2 === 0 ? "1" : "3"}</text>
    <text x="370" y="${y + 9}" font-family="monospace" font-size="6.5" fill="${C.label}" text-anchor="end">${(1 + (seed + idx * 2) % 11).toString().padStart(2,"0")}/${(5 + idx % 25).toString().padStart(2,"0")}/24</text>
    <text x="440" y="${y + 9}" font-family="monospace" font-size="7.5" fill="${C.black}" text-anchor="end">$${proceeds.toLocaleString()}</text>
    <text x="510" y="${y + 9}" font-family="monospace" font-size="7.5" fill="${C.black}" text-anchor="end">$${basis.toLocaleString()}</text>
    <text x="556" y="${y + 9}" font-family="monospace" font-size="7.5" fill="${gl >= 0 ? C.dark : C.formRed}" text-anchor="end">${gl >= 0 ? "" : "("}$${Math.abs(gl).toLocaleString()}${gl >= 0 ? "" : ")"}</text>`
}

function subtotalRow(seed: number, y: number, label: string): string {
  const val = Math.floor(rng(seed) * 800000) + 10000
  return `<line x1="56" y1="${y - 4}" x2="556" y2="${y - 4}" stroke="${C.rule}" stroke-width="0.5"/>
    <rect x="56" y="${y - 2}" width="500" height="20" fill="${C.bgBox}"/>
    <text x="66" y="${y + 11}" font-family="sans-serif" font-size="7.5" font-weight="700" fill="${C.dark}">${label}</text>
    <text x="440" y="${y + 11}" font-family="monospace" font-size="8" font-weight="700" fill="${C.black}" text-anchor="end">$${val.toLocaleString()}</text>
    <text x="556" y="${y + 11}" font-family="monospace" font-size="8" font-weight="700" fill="${rng(seed + 1) > 0.5 ? C.dark : C.formRed}" text-anchor="end">${rng(seed + 1) > 0.5 ? "" : "("}$${Math.floor(val * 0.08).toLocaleString()}${rng(seed + 1) > 0.5 ? "" : ")"}</text>`
}

function textRows(seed: number, startY: number, count: number, cols: number): string {
  const rows = []
  for (let i = 0; i < count; i++) {
    const y = startY + i * 20
    const bg = i % 2 === 0 ? `<rect x="56" y="${y}" width="500" height="20" fill="${C.bgAlt}"/>` : ""
    const cells = []
    for (let c = 0; c < cols; c++) {
      const x = 56 + c * (500 / cols)
      const w = 30 + Math.floor(rng(seed + i * 17 + c * 31) * (400 / cols - 30))
      const opacity = 0.12 + rng(seed + i + c) * 0.18
      cells.push(`<rect x="${x + 4}" y="${y + 6}" width="${w}" height="7" rx="1" fill="${C.dark}" opacity="${opacity.toFixed(2)}"/>`)
    }
    rows.push(bg + cells.join(""))
  }
  return rows.join("\n    ")
}

function irsHeader(formTitle: string, issuer: string, pageInDoc: number, docPages: number, prefix: string): string {
  const isW2 = prefix === "W2"
  const isIRS = prefix.startsWith("1099") || prefix.startsWith("1098") || prefix.startsWith("5498") || prefix === "W2"
  const formNum = prefix.replace("1099-COMP", "1099").replace("SchedC", "Schedule C").replace("SchedA", "Schedule A")

  if (isW2) {
    return `<rect x="40" y="36" width="532" height="56" fill="white" stroke="${C.rule}" stroke-width="0.75" rx="0"/>
    <rect x="40" y="36" width="532" height="20" fill="${C.formBlue}"/>
    <text x="56" y="50" font-family="sans-serif" font-size="8" font-weight="700" letter-spacing="2" fill="white">FORM W-2</text>
    <text x="558" y="50" font-family="sans-serif" font-size="7" fill="white" text-anchor="end">WAGE AND TAX STATEMENT</text>
    <text x="56" y="72" font-family="sans-serif" font-size="9" fill="${C.dark}">${issuer}</text>
    <text x="558" y="72" font-family="monospace" font-size="8" fill="${C.label}" text-anchor="end">2024 · Copy B — Employee</text>
    <text x="558" y="82" font-family="sans-serif" font-size="7" fill="${C.light}" text-anchor="end">Department of the Treasury — IRS</text>`
  }

  if (prefix === "Charity") {
    return `<line x1="56" y1="52" x2="556" y2="52" stroke="${C.dark}" stroke-width="1.5"/>
    <text x="56" y="46" font-family="serif" font-size="14" font-weight="700" fill="${C.black}">${issuer}</text>
    <line x1="56" y1="56" x2="556" y2="56" stroke="${C.rule}" stroke-width="0.5"/>
    <text x="556" y="46" font-family="sans-serif" font-size="7" fill="${C.light}" text-anchor="end">Tax-Deductible Contribution Receipt</text>`
  }

  if (prefix === "PropTax" || prefix === "State") {
    return `<rect x="40" y="36" width="532" height="48" fill="${C.bgBox}" stroke="${C.rule}" stroke-width="0.5"/>
    <text x="306" y="56" font-family="sans-serif" font-size="10" font-weight="700" fill="${C.black}" text-anchor="middle">${formTitle}</text>
    <text x="306" y="72" font-family="sans-serif" font-size="8" fill="${C.label}" text-anchor="middle">${issuer} · Tax Year 2024</text>`
  }

  if (prefix === "K-1") {
    return `<rect x="40" y="36" width="200" height="48" fill="${C.bgBox}" stroke="${C.rule}" stroke-width="0.5"/>
    <text x="50" y="54" font-family="sans-serif" font-size="8" font-weight="700" fill="${C.formBlue}">SCHEDULE K-1</text>
    <text x="50" y="68" font-family="sans-serif" font-size="7" fill="${C.label}">(Form 1065)</text>
    <rect x="240" y="36" width="332" height="48" fill="white" stroke="${C.rule}" stroke-width="0.5"/>
    <text x="250" y="54" font-family="sans-serif" font-size="8" fill="${C.dark}">Partner's Share of Income, Deductions, Credits, etc.</text>
    <text x="250" y="68" font-family="sans-serif" font-size="8" fill="${C.label}">${issuer}</text>
    <text x="558" y="68" font-family="monospace" font-size="7" fill="${C.light}" text-anchor="end">2024</text>`
  }

  return `<rect x="40" y="36" width="100" height="48" fill="white" stroke="${C.rule}" stroke-width="0.5"/>
    <text x="56" y="54" font-family="sans-serif" font-size="${isIRS ? "7" : "8"}" fill="${C.formRed}">${isIRS ? "OMB 1545" : ""}</text>
    <text x="56" y="68" font-family="sans-serif" font-size="9" font-weight="700" fill="${C.formBlue}">${formNum}</text>
    <rect x="140" y="36" width="292" height="48" fill="white" stroke="${C.rule}" stroke-width="0.5"/>
    <text x="286" y="56" font-family="sans-serif" font-size="8" font-weight="600" fill="${C.dark}" text-anchor="middle">${formTitle}</text>
    <text x="286" y="70" font-family="sans-serif" font-size="8" fill="${C.label}" text-anchor="middle">${issuer}</text>
    <rect x="432" y="36" width="140" height="48" fill="white" stroke="${C.rule}" stroke-width="0.5"/>
    <text x="502" y="54" font-family="sans-serif" font-size="7" fill="${C.light}" text-anchor="middle">Tax Year 2024</text>
    <text x="502" y="70" font-family="monospace" font-size="8" fill="${C.label}" text-anchor="middle">Page ${pageInDoc + 1} of ${docPages}</text>`
}

function generateW2Body(seed: number): string {
  const labels = ["1 Wages, tips, other", "2 Federal income tax", "3 Social security wages", "4 Social security tax",
    "5 Medicare wages", "6 Medicare tax withheld", "7 Social security tips", "8 Allocated tips",
    "9 (blank)", "10 Dependent care benefits", "11 Nonqualified plans", "12a See instructions",
    "12b", "12c", "12d", "13 Stat Retire 3rd party"]
  const cells = []
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const x = 56 + col * 125
      const y = 140 + row * 95
      const i = row * 4 + col
      const val = Math.floor(rng(seed + i * 7) * 180000)
      cells.push(`<rect x="${x}" y="${y}" width="120" height="88" fill="none" stroke="${C.rule}" stroke-width="0.5"/>
      <rect x="${x}" y="${y}" width="120" height="16" fill="${C.bgAlt}"/>
      <text x="${x + 3}" y="${y + 12}" font-family="sans-serif" font-size="6.5" fill="${C.label}">${labels[i]}</text>
      <text x="${x + 60}" y="${y + 56}" font-family="monospace" font-size="13" fill="${C.black}" text-anchor="middle">${i < 8 && i !== 6 && i !== 7 ? "$" + val.toLocaleString() : ""}</text>`)
    }
  }
  cells.push(`<rect x="56" y="530" width="500" height="60" fill="none" stroke="${C.rule}" stroke-width="0.5"/>
    <text x="66" y="548" font-family="sans-serif" font-size="7" fill="${C.label}">15 State / Employer's state ID no.</text>
    <text x="66" y="575" font-family="monospace" font-size="10" fill="${C.dark}">CT / ${(10000000 + seed * 73) % 99999999}</text>
    <text x="340" y="548" font-family="sans-serif" font-size="7" fill="${C.label}">16 State wages</text>
    <text x="340" y="575" font-family="monospace" font-size="10" fill="${C.dark}">$${Math.floor(rng(seed + 99) * 180000).toLocaleString()}</text>
    <text x="460" y="548" font-family="sans-serif" font-size="7" fill="${C.label}">17 State income tax</text>
    <text x="460" y="575" font-family="monospace" font-size="10" fill="${C.dark}">$${Math.floor(rng(seed + 100) * 12000).toLocaleString()}</text>`)
  return cells.join("\n    ")
}

function brokerageColHeader(y: number): string {
  return `<text x="66" y="${y}" font-family="sans-serif" font-size="6.5" font-weight="600" fill="${C.label}">SECURITY</text>
    <text x="170" y="${y}" font-family="sans-serif" font-size="6.5" font-weight="600" fill="${C.label}">CUSIP</text>
    <text x="270" y="${y}" font-family="sans-serif" font-size="6.5" font-weight="600" fill="${C.label}" text-anchor="end">QTY</text>
    <text x="310" y="${y}" font-family="sans-serif" font-size="6.5" font-weight="600" fill="${C.label}" text-anchor="end">ACQUIRED</text>
    <text x="370" y="${y}" font-family="sans-serif" font-size="6.5" font-weight="600" fill="${C.label}" text-anchor="end">SOLD</text>
    <text x="440" y="${y}" font-family="sans-serif" font-size="6.5" font-weight="600" fill="${C.label}" text-anchor="end">PROCEEDS</text>
    <text x="510" y="${y}" font-family="sans-serif" font-size="6.5" font-weight="600" fill="${C.label}" text-anchor="end">COST BASIS</text>
    <text x="556" y="${y}" font-family="sans-serif" font-size="6.5" font-weight="600" fill="${C.label}" text-anchor="end">GAIN/LOSS</text>
    <line x1="56" y1="${y + 4}" x2="556" y2="${y + 4}" stroke="${C.rule}" stroke-width="0.5"/>`
}

function generateBrokerageBody(seed: number, pageInDoc: number, docPages: number): string {
  if (pageInDoc === 0) {
    const summaryItems = ["Interest Income", "Ordinary Dividends", "Qualified Dividends",
      "Short-Term Capital Gains", "Long-Term Capital Gains", "Federal Tax Withheld",
      "Foreign Tax Paid", "Tax-Exempt Interest", "State Tax Withheld",
      "Total Reportable Income"]
    const summaryLines = summaryItems.map((label, i) => {
      const y = 170 + i * 22
      const val = Math.floor(rng(seed + i * 3) * 500000)
      const isBold = i === summaryItems.length - 1
      return `${i % 2 === 0 ? `<rect x="56" y="${y - 4}" width="500" height="22" fill="${C.bgAlt}"/>` : ""}
      <text x="66" y="${y + 10}" font-family="sans-serif" font-size="8" ${isBold ? 'font-weight="700"' : ""} fill="${isBold ? C.black : C.dark}">${label}</text>
      <text x="540" y="${y + 10}" font-family="monospace" font-size="8" ${isBold ? 'font-weight="700"' : ""} fill="${C.black}" text-anchor="end">$${val.toLocaleString()}.${String((seed + i) % 100).padStart(2, "0")}</text>`
    }).join("\n    ")
    return `<text x="56" y="155" font-family="sans-serif" font-size="9" font-weight="700" fill="${C.black}">SUMMARY OF INCOME</text>
    <line x1="56" y1="160" x2="556" y2="160" stroke="${C.dark}" stroke-width="0.75"/>
    ${summaryLines}
    <line x1="56" y1="396" x2="556" y2="396" stroke="${C.rule}" stroke-width="0.5"/>
    <text x="56" y="416" font-family="sans-serif" font-size="8" font-weight="600" fill="${C.dark}">DETAIL — ${BROKERAGE_SECTIONS[0][0]}</text>
    <line x1="56" y1="422" x2="556" y2="422" stroke="${C.ruleFaint}" stroke-width="0.5"/>
    ${brokerageColHeader(436)}
    ${Array.from({ length: 13 }, (_, i) => securityRow(seed, 448 + i * 18, i)).join("\n    ")}
    <text x="306" y="695" font-family="sans-serif" font-size="7" fill="${C.light}" text-anchor="middle">— Continued on next page —</text>`
  }

  const sectionGroup = BROKERAGE_SECTIONS[(pageInDoc - 1) % BROKERAGE_SECTIONS.length]
  const sectionIdx = Math.floor((pageInDoc - 1) / BROKERAGE_SECTIONS.length) % 3
  const sectionName = sectionGroup[sectionIdx % sectionGroup.length]
  const isLastPage = pageInDoc === docPages - 1
  const secSeed = seed + pageInDoc * 137

  const parts: string[] = []
  let y = 100

  parts.push(`<text x="56" y="${y}" font-family="sans-serif" font-size="8" font-weight="700" fill="${C.dark}">${sectionName}</text>
    <line x1="56" y1="${y + 4}" x2="556" y2="${y + 4}" stroke="${C.rule}" stroke-width="0.5"/>`)
  y += 12
  parts.push(brokerageColHeader(y))
  y += 10

  const hasMidBreak = rng(secSeed) > 0.6
  const firstBlockRows = hasMidBreak ? (6 + Math.floor(rng(secSeed + 1) * 10)) : (14 + Math.floor(rng(secSeed + 2) * 14))

  for (let i = 0; i < firstBlockRows && y < 680; i++) {
    parts.push(securityRow(secSeed + i * 50, y, i))
    y += 18
  }

  if (hasMidBreak && y < 580) {
    parts.push(subtotalRow(secSeed + 999, y, `Subtotal — ${sectionName}`))
    y += 28

    const nextSection = sectionGroup[(sectionIdx + 1) % sectionGroup.length]
    parts.push(`<text x="56" y="${y}" font-family="sans-serif" font-size="8" font-weight="700" fill="${C.dark}">${nextSection}</text>
      <line x1="56" y1="${y + 4}" x2="556" y2="${y + 4}" stroke="${C.rule}" stroke-width="0.5"/>`)
    y += 12
    parts.push(brokerageColHeader(y))
    y += 10

    const secondBlockRows = 6 + Math.floor(rng(secSeed + 3) * 10)
    for (let i = 0; i < secondBlockRows && y < 680; i++) {
      parts.push(securityRow(secSeed + 5000 + i * 50, y, firstBlockRows + i))
      y += 18
    }
  }

  if (isLastPage) {
    if (y < 640) {
      parts.push(subtotalRow(secSeed + 8888, y, "TOTAL — ALL TRANSACTIONS"))
      y += 28
    }
    parts.push(`<line x1="56" y1="${y}" x2="556" y2="${y}" stroke="${C.rule}" stroke-width="0.5"/>
    <text x="56" y="${y + 16}" font-family="sans-serif" font-size="7" fill="${C.label}">* Basis reported to IRS.  ** Basis not reported to IRS.  (W) Wash sale loss disallowed.</text>
    <text x="56" y="${y + 28}" font-family="sans-serif" font-size="7" fill="${C.label}">Amounts may not reflect adjustments for wash sales, accrued market discount, or bond premium.</text>
    <text x="56" y="${y + 44}" font-family="sans-serif" font-size="7" fill="${C.light}">This information is furnished to the IRS. If you are required to file a return, a negligence penalty or</text>
    <text x="56" y="${y + 54}" font-family="sans-serif" font-size="7" fill="${C.light}">other sanction may be imposed on you if taxable income results from these transactions and the IRS</text>
    <text x="56" y="${y + 64}" font-family="sans-serif" font-size="7" fill="${C.light}">determines that it has not been reported.</text>`)
  } else {
    parts.push(`<text x="306" y="710" font-family="sans-serif" font-size="7" fill="${C.light}" text-anchor="middle">— Continued on next page —</text>`)
  }

  return parts.join("\n    ")
}

function generateCharityBody(seed: number, issuer: string): string {
  const amount = Math.floor(rng(seed) * 25000 + 500)
  const month = ["January", "March", "June", "September", "November", "December"][seed % 6]
  const day = 1 + (seed % 28)
  return `<text x="56" y="120" font-family="sans-serif" font-size="9" fill="${C.label}">Date: ${month} ${day}, 2024</text>
    <text x="56" y="160" font-family="sans-serif" font-size="10" fill="${C.dark}">Dear Donor,</text>
    <text x="56" y="185" font-family="sans-serif" font-size="9" fill="${C.mid}">Thank you for your generous tax-deductible contribution to ${issuer}.</text>
    <text x="56" y="200" font-family="sans-serif" font-size="9" fill="${C.mid}">This letter serves as your official receipt for tax purposes.</text>
    <rect x="56" y="230" width="500" height="70" fill="${C.bgAlt}" stroke="${C.rule}" stroke-width="0.5"/>
    <text x="66" y="252" font-family="sans-serif" font-size="8" fill="${C.label}">CONTRIBUTION AMOUNT</text>
    <text x="66" y="280" font-family="monospace" font-size="22" font-weight="700" fill="${C.black}">$${amount.toLocaleString()}.00</text>
    <text x="400" y="252" font-family="sans-serif" font-size="8" fill="${C.label}">DATE RECEIVED</text>
    <text x="400" y="275" font-family="monospace" font-size="11" fill="${C.dark}">${month} ${day}, 2024</text>
    <text x="56" y="330" font-family="sans-serif" font-size="8" fill="${C.mid}">No goods or services were provided in exchange for this contribution.</text>
    <text x="56" y="348" font-family="sans-serif" font-size="8" fill="${C.mid}">EIN: ${10 + seed % 80}-${(1000000 + seed * 137) % 9999999}</text>
    <text x="56" y="366" font-family="sans-serif" font-size="8" fill="${C.mid}">Donation Type: Cash</text>
    <line x1="56" y1="420" x2="556" y2="420" stroke="${C.ruleFaint}" stroke-width="0.5"/>
    <text x="56" y="440" font-family="sans-serif" font-size="8" fill="${C.label}">Please retain this receipt for your tax records.</text>
    <line x1="340" y1="540" x2="540" y2="540" stroke="${C.rule}" stroke-width="0.5"/>
    <text x="440" y="555" font-family="sans-serif" font-size="8" fill="${C.label}" text-anchor="middle">Authorized Signature</text>
    <text x="440" y="570" font-family="sans-serif" font-size="7" fill="${C.light}" text-anchor="middle">${issuer}</text>`
}

function generateRetirementBody(seed: number): string {
  const fields = ["1 Gross distribution", "2a Taxable amount", "2b Taxable amount not determined", "3 Capital gain (included in 2a)",
    "4 Federal income tax withheld", "5 Employee contributions/insurance", "6 Net unrealized appreciation", "7 Distribution code(s)",
    "8 Other", "9a Your % of total distribution", "9b Total employee contributions", "10 Amount allocable to IRR"]
  return fields.map((label, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 56 + col * 250
    const y = 140 + row * 75
    const val = Math.floor(rng(seed + i * 11) * 80000)
    return `<rect x="${x}" y="${y}" width="245" height="68" fill="none" stroke="${C.rule}" stroke-width="0.5"/>
    <rect x="${x}" y="${y}" width="245" height="15" fill="${C.bgAlt}"/>
    <text x="${x + 4}" y="${y + 11}" font-family="sans-serif" font-size="6.5" fill="${C.label}">${label}</text>
    <text x="${x + 122}" y="${y + 45}" font-family="monospace" font-size="14" fill="${C.black}" text-anchor="middle">${i < 6 ? "$" + val.toLocaleString() : i === 7 ? ["G", "7", "1A", "J"][seed % 4] : ""}</text>`
  }).join("\n    ")
}

function generatePropertyTaxBody(seed: number): string {
  const isGreenwich = seed % 2 === 0
  return `<text x="56" y="110" font-family="sans-serif" font-size="8" fill="${C.label}">Parcel ID: ${(100000 + seed * 73) % 999999}-${(1000 + seed) % 9999}</text>
    <text x="56" y="126" font-family="sans-serif" font-size="9" fill="${C.dark}">Property: ${isGreenwich ? "42 Round Hill Rd, Greenwich, CT 06831" : "315 Snowmass Club Cir, Aspen, CO 81611"}</text>
    <text x="56" y="142" font-family="sans-serif" font-size="8" fill="${C.label}">Owner: Anderson Family Trust</text>
    <line x1="56" y1="155" x2="556" y2="155" stroke="${C.rule}" stroke-width="0.5"/>
    <rect x="56" y="165" width="500" height="20" fill="${C.bgBox}"/>
    <text x="66" y="179" font-family="sans-serif" font-size="8" font-weight="600" fill="${C.dark}">DESCRIPTION</text>
    <text x="440" y="179" font-family="sans-serif" font-size="8" font-weight="600" fill="${C.dark}" text-anchor="end">ASSESSED VALUE</text>
    <text x="540" y="179" font-family="sans-serif" font-size="8" font-weight="600" fill="${C.dark}" text-anchor="end">TAX AMOUNT</text>
    ${["Land Value", "Improvement Value", "Total Assessed Value", "Mill Rate", "Property Tax Due", "Payments Received", "BALANCE DUE"].map((label, i) => {
      const y = 192 + i * 24
      const isBold = i === 2 || i === 6
      return `${i % 2 === 0 ? `<rect x="56" y="${y - 2}" width="500" height="24" fill="${C.bgAlt}"/>` : ""}
      <text x="66" y="${y + 12}" font-family="sans-serif" font-size="8" ${isBold ? 'font-weight="700"' : ""} fill="${isBold ? C.black : C.dark}">${label}</text>
      <text x="540" y="${y + 12}" font-family="monospace" font-size="9" ${isBold ? 'font-weight="700"' : ""} fill="${C.black}" text-anchor="end">${i === 3 ? (28 + seed % 15).toFixed(4) : "$" + Math.floor(rng(seed + i * 19) * 200000 + 10000).toLocaleString()}</text>`
    }).join("\n    ")}`
}

function generateK1Body(seed: number): string {
  const parts = []
  parts.push(`<rect x="56" y="100" width="200" height="140" fill="none" stroke="${C.rule}" stroke-width="0.5"/>
    <rect x="56" y="100" width="200" height="16" fill="${C.bgBox}"/>
    <text x="66" y="112" font-family="sans-serif" font-size="7" font-weight="600" fill="${C.dark}">PART I — INFORMATION ABOUT THE PARTNERSHIP</text>
    <text x="66" y="135" font-family="sans-serif" font-size="7" fill="${C.label}">A  Partnership's EIN</text>
    <text x="66" y="148" font-family="monospace" font-size="9" fill="${C.dark}">${(10 + seed % 80)}-${(1000000 + seed * 73) % 9999999}</text>
    <text x="66" y="168" font-family="sans-serif" font-size="7" fill="${C.label}">B  Partnership's name</text>
    <text x="66" y="185" font-family="sans-serif" font-size="8" fill="${C.dark}">See attached</text>`)

  parts.push(`<rect x="260" y="100" width="312" height="140" fill="none" stroke="${C.rule}" stroke-width="0.5"/>
    <rect x="260" y="100" width="312" height="16" fill="${C.bgBox}"/>
    <text x="270" y="112" font-family="sans-serif" font-size="7" font-weight="600" fill="${C.dark}">PART II — INFORMATION ABOUT THE PARTNER</text>
    <text x="270" y="135" font-family="sans-serif" font-size="7" fill="${C.label}">E  Partner's SSN or TIN</text>
    <text x="270" y="148" font-family="monospace" font-size="9" fill="${C.dark}">***-**-${(1000 + seed * 3) % 9999}</text>
    <text x="270" y="168" font-family="sans-serif" font-size="7" fill="${C.label}">F  Partner's name</text>
    <text x="270" y="185" font-family="sans-serif" font-size="8" fill="${C.dark}">Anderson Family Trust</text>`)

  const lines = Array.from({ length: 20 }, (_, i) => {
    const y = 260 + i * 24
    const val = Math.floor(rng(seed + i * 3) * 50000)
    return `${i % 2 === 0 ? `<rect x="56" y="${y - 2}" width="500" height="24" fill="${C.bgAlt}"/>` : ""}
    <text x="66" y="${y + 12}" font-family="sans-serif" font-size="7" fill="${C.label}">Part III Line ${i + 1}</text>
    <text x="200" y="${y + 12}" font-family="sans-serif" font-size="8" fill="${C.dark}">${["Ordinary business income", "Net rental income", "Guaranteed payments", "Interest income", "Dividends", "Royalties", "Net short-term gain", "Net long-term gain", "Net section 1231 gain", "Other income", "Section 179 deduction", "Other deductions", "Self-employment earnings", "Credits", "Foreign transactions", "AMT items", "Tax-exempt income", "Distributions", "Other information", "Multiple activities"][i]}</text>
    <text x="540" y="${y + 12}" font-family="monospace" font-size="8" fill="${C.black}" text-anchor="end">${val > 0 ? "$" + val.toLocaleString() : "—"}</text>`
  }).join("\n    ")

  parts.push(`<rect x="56" y="248" width="500" height="16" fill="${C.bgBox}"/>
    <text x="66" y="260" font-family="sans-serif" font-size="7" font-weight="600" fill="${C.dark}">PART III — PARTNER'S SHARE OF CURRENT YEAR INCOME, DEDUCTIONS, CREDITS</text>
    ${lines}`)

  return parts.join("\n    ")
}

function generateScheduleBody(seed: number, prefix: string): string {
  const isC = prefix === "SchedC"
  const sections = isC
    ? [{ title: "Part I — Gross Income", lines: ["Gross receipts or sales", "Returns and allowances", "Cost of goods sold", "Gross profit", "Other income", "Gross income"] },
       { title: "Part II — Expenses", lines: ["Advertising", "Car and truck expenses", "Commissions and fees", "Contract labor", "Depreciation", "Insurance", "Interest", "Legal and professional", "Office expense", "Rent or lease", "Supplies", "Taxes and licenses", "Travel", "Utilities", "Wages", "Other expenses"] }]
    : [{ title: "Medical and Dental Expenses", lines: ["Medical and dental expenses", "Amount from Form 1040, line 11", "Multiply line 2 by 7.5%", "Subtract line 3 from line 1"] },
       { title: "Taxes You Paid", lines: ["State and local income taxes", "State and local property taxes", "Other taxes", "Add lines 5 through 7"] },
       { title: "Interest You Paid", lines: ["Home mortgage interest", "Points", "Mortgage insurance premiums", "Investment interest"] },
       { title: "Gifts to Charity", lines: ["Cash contributions", "Other than cash", "Carryover from prior year"] }]

  let y = 100
  const parts = []
  for (const section of sections) {
    parts.push(`<rect x="56" y="${y}" width="500" height="16" fill="${C.bgBox}"/>
    <text x="66" y="${y + 12}" font-family="sans-serif" font-size="7" font-weight="700" fill="${C.dark}">${section.title}</text>`)
    y += 20
    for (let i = 0; i < section.lines.length; i++) {
      const lineY = y + i * 22
      const val = Math.floor(rng(seed + y + i * 7) * 100000)
      if (i % 2 === 0) parts.push(`<rect x="56" y="${lineY - 2}" width="500" height="22" fill="${C.bgAlt}"/>`)
      parts.push(`<text x="66" y="${lineY + 11}" font-family="sans-serif" font-size="8" fill="${C.mid}">${i + 1}. ${section.lines[i]}</text>
      <line x1="420" y1="${lineY + 14}" x2="550" y2="${lineY + 14}" stroke="${C.ruleFaint}" stroke-width="0.5"/>
      <text x="540" y="${lineY + 11}" font-family="monospace" font-size="8" fill="${C.black}" text-anchor="end">${val > 10000 ? "$" + val.toLocaleString() : ""}</text>`)
    }
    y += section.lines.length * 22 + 10
  }
  return parts.join("\n    ")
}

const GENERIC_BOX_LABELS: Record<string, string[]> = {
  "1099-INT": ["1 Interest income", "2 Early withdrawal penalty", "3 Interest on U.S. Savings Bonds", "4 Federal income tax withheld",
    "5 Investment expenses", "6 Foreign tax paid", "7 Foreign country or poss.", "8 Tax-exempt interest",
    "9 Specified private activity bond interest", "10 Market discount", "11 Bond premium", "12 Bond premium on Treasury",
    "13 Bond premium on tax-exempt", "14 Tax-exempt and tax credit bond CUSIP", "15 State", "16 State tax withheld"],
  "1099-DIV": ["1a Total ordinary dividends", "1b Qualified dividends", "2a Total capital gain distr.", "2b Unrecap. Sec. 1250 gain",
    "2c Section 1202 gain", "2d Collectibles (28%) gain", "2e Section 897 ordinary div.", "2f Section 897 capital gain",
    "3 Nondividend distributions", "4 Federal income tax withheld", "5 Section 199A dividends", "6 Investment expenses",
    "7 Foreign tax paid", "8 Foreign country or poss.", "9 Cash liquidation distr.", "10 Noncash liquidation distr."],
  "1099-NEC": ["1 Nonemployee compensation", "2 Payer made direct sales", "4 Federal income tax withheld", "5 State tax withheld",
    "6 State/Payer's state no.", "7 State income"],
  "1099-MISC": ["1 Rents", "2 Royalties", "3 Other income", "4 Federal income tax withheld",
    "5 Fishing boat proceeds", "6 Medical and health care", "7 Payer made direct sales", "8 Substitute payments",
    "9 Crop insurance proceeds", "10 Gross proceeds to attorney", "11 Fish purchased for resale", "12 Section 409A deferrals"],
  "1099-OID": ["1 Original issue discount", "2 Other periodic interest", "3 Early withdrawal penalty", "4 Federal income tax withheld",
    "5 Market discount", "6 Acquisition premium", "8 OID on U.S. Treasury obligations", "11 Bond premium"],
  "1099-SA": ["1 Gross distribution", "2 Earnings on excess contributions", "3 Distribution code", "4 FMV on date of death",
    "5 HSA/Archer MSA/MA MSA", "6 Federal income tax withheld"],
  "5498": ["1 IRA contributions", "2 Rollover contributions", "3 Roth IRA conversion amount", "4 Recharacterized contributions",
    "5 FMV of account", "6 Life insurance cost", "7 IRA type", "8 SEP contributions",
    "9 SIMPLE contributions", "10 Roth IRA contributions", "11 RMD required minimum", "12a RMD date"],
  "5498-SA": ["1 Employee or self-employed contributions", "2 Employer contributions", "3 Total HSA/Archer MSA contributions",
    "4 Rollover contributions", "5 FMV of account", "6 HSA/Archer MSA/MA MSA"],
  "1098": ["1 Mortgage interest received", "2 Outstanding mortgage principal", "3 Mortgage origination date",
    "4 Refund of overpaid interest", "5 Mortgage insurance premiums", "6 Points paid on purchase",
    "7 Property address", "8 Number of properties", "9 Other", "10 Property taxes"],
  "1098-T": ["1 Payments received for qualified tuition", "2 Amounts billed for qualified tuition",
    "3 Change in method", "4 Adjustments made for a prior year", "5 Scholarships or grants",
    "6 Adjustments to scholarships", "7 Checked if amount in box 1 includes payments for periods Jan–Mar",
    "8 At least half-time student", "9 Graduate student"],
}

function generateGenericIRSBody(seed: number, prefix: string, subtitle: string, pageInDoc: number): string {
  const boxLabels = GENERIC_BOX_LABELS[prefix]
  if (!boxLabels || pageInDoc > 0) {
    const rowCount = 8 + Math.floor(rng(seed) * 18)
    return `<text x="56" y="108" font-family="sans-serif" font-size="9" font-weight="600" fill="${C.dark}">${subtitle}</text>
    <line x1="56" y1="115" x2="556" y2="115" stroke="${C.rule}" stroke-width="0.5"/>
    ${textRows(seed, 125, rowCount, 2 + (seed % 3))}`
  }

  const cols = boxLabels.length <= 6 ? 2 : boxLabels.length <= 12 ? 3 : 4
  const boxW = Math.floor(500 / cols) - 4
  const boxH = boxLabels.length <= 6 ? 72 : 56
  const parts: string[] = []
  let y = 100

  parts.push(`<rect x="56" y="${y}" width="500" height="46" fill="${C.bgAlt}" stroke="${C.rule}" stroke-width="0.5"/>
    <text x="66" y="${y + 16}" font-family="sans-serif" font-size="7" fill="${C.label}">PAYER'S name, address, and TIN</text>
    <text x="66" y="${y + 32}" font-family="sans-serif" font-size="9" fill="${C.dark}">See statement attached</text>
    <text x="400" y="${y + 16}" font-family="sans-serif" font-size="7" fill="${C.label}">RECIPIENT'S TIN</text>
    <text x="400" y="${y + 32}" font-family="monospace" font-size="9" fill="${C.dark}">***-**-${(1000 + seed * 3) % 9999}</text>`)
  y += 54

  for (let i = 0; i < boxLabels.length; i++) {
    const col = i % cols
    const x = 56 + col * (boxW + 4)
    if (col === 0 && i > 0) y += boxH + 2
    const val = Math.floor(rng(seed + i * 11) * 80000)
    const hasValue = rng(seed + i * 7) > 0.3
    parts.push(`<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" fill="none" stroke="${C.rule}" stroke-width="0.5"/>
      <rect x="${x}" y="${y}" width="${boxW}" height="14" fill="${C.bgAlt}"/>
      <text x="${x + 4}" y="${y + 10}" font-family="sans-serif" font-size="6" fill="${C.label}">${boxLabels[i]}</text>
      <text x="${x + boxW / 2}" y="${y + boxH * 0.65}" font-family="monospace" font-size="${boxLabels.length <= 6 ? "14" : "11"}" fill="${C.black}" text-anchor="middle">${hasValue ? "$" + val.toLocaleString() : ""}</text>`)
  }

  y += boxH + 16
  if (y < 650) {
    parts.push(`<line x1="56" y1="${y}" x2="556" y2="${y}" stroke="${C.ruleFaint}" stroke-width="0.5"/>
    <text x="56" y="${y + 14}" font-family="sans-serif" font-size="7" fill="${C.light}">This is important tax information and is being furnished to the IRS. If you are required to file a return,</text>
    <text x="56" y="${y + 24}" font-family="sans-serif" font-size="7" fill="${C.light}">a negligence penalty or other sanction may be imposed on you if this income is taxable and the IRS</text>
    <text x="56" y="${y + 34}" font-family="sans-serif" font-size="7" fill="${C.light}">determines that it has not been reported.</text>`)
  }

  return parts.join("\n    ")
}

function generatePageSvg(
  pageNum: number,
  pageInDoc: number,
  docPages: number,
  prefix: string,
  _classification: Classification,
  issuerName: string,
): string {
  const formTitle = FORM_TITLES[prefix] ?? prefix.toUpperCase()
  const subtitles = PAGE_SUBTITLES[prefix]
  const subtitle = subtitles
    ? subtitles[pageInDoc % subtitles.length]
    : pageInDoc === 0
      ? "Taxpayer Copy"
      : `Continuation Sheet ${pageInDoc + 1}`

  const issuer = issuerName.split("—").pop()?.trim() ?? issuerName
  const seed = pageNum * 7 + pageInDoc * 13

  const header = irsHeader(formTitle, issuer, pageInDoc, docPages, prefix)

  let body: string
  if (prefix === "W2") {
    body = generateW2Body(seed)
  } else if (prefix === "1099-COMP" || prefix === "1099-B") {
    body = generateBrokerageBody(seed, pageInDoc, docPages)
  } else if (prefix === "Charity") {
    body = generateCharityBody(seed, issuer)
  } else if (prefix === "1099-R") {
    body = generateRetirementBody(seed)
  } else if (prefix === "PropTax" || prefix === "State") {
    body = generatePropertyTaxBody(seed)
  } else if (prefix === "SchedC" || prefix === "SchedA") {
    body = generateScheduleBody(seed, prefix)
  } else if (prefix === "K-1") {
    body = generateK1Body(seed)
  } else {
    body = generateGenericIRSBody(seed, prefix, subtitle, pageInDoc)
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="612" height="792" viewBox="0 0 612 792">
    <rect width="612" height="792" fill="#fafafa"/>
    <rect x="40" y="30" width="532" height="732" fill="white" stroke="${C.ruleLight}" stroke-width="0.5"/>

    ${header}
    ${body}

    <line x1="56" y1="738" x2="556" y2="738" stroke="${C.ruleFaint}" stroke-width="0.5"/>
    <text x="56" y="752" font-family="sans-serif" font-size="7" fill="${C.light}">${issuer.toUpperCase()}</text>
    <text x="556" y="752" font-family="monospace" font-size="7" fill="${C.light}" text-anchor="end">${pageNum}</text>
  </svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function generateMockBundle(): SplitResponse {
  const documents: Document[] = []
  let pageCounter = 1

  for (let d = 0; d < BUNDLE_MANIFEST.length; d++) {
    const entry = BUNDLE_MANIFEST[d]
    const pages: Page[] = []

    for (let p = 0; p < entry.pages; p++) {
      pages.push({
        pageId: `page-${pageCounter}`,
        originalPageNumber: pageCounter,
        pageImageUrl: generatePageSvg(
          pageCounter,
          p,
          entry.pages,
          entry.prefix,
          entry.classification,
          entry.descTemplate,
        ),
      })
      pageCounter++
    }

    documents.push({
      id: `doc-${d + 1}`,
      fileName: `${entry.prefix}_${(d + 1).toString().padStart(3, "0")}.pdf`,
      name: entry.descTemplate.split("—")[0].trim(),
      classification: entry.classification,
      shortDescription: entry.descTemplate,
      pages,
    })
  }

  return {
    bundleId: "bundle-2024-hnw-001",
    bundleName: "2024 HNW Tax Bundle — Anderson Family Trust",
    totalPages: pageCounter - 1,
    documents,
  }
}
