# TEMPLATES — JSON Spec & Catalog (v1.3.1)

## 1) Purpose
Templates define:
- user input shape (forms)
- posting builder rules (balanced entries)

Consumed by:
- apps/twoline-web (forms, validation, UX)
- packages/ledger-kit (builders + invariants)

## 2) Template JSON (conceptual)

```json
{
  "id": "rent_monthly",
  "version": 1,
  "name": { "ko": "월세", "en": "Rent" },
  "category": "housing",
  "input": {
    "fields": [
      { "key": "occurred_at", "type": "date", "required": true },
      { "key": "amount", "type": "money", "required": true },
      { "key": "memo", "type": "string", "required": false }
    ]
  },
  "postings": {
    "rules": [
      { "account": "expense:rent", "direction": "DEBIT", "amount": "{{amount}}" },
      { "account": "asset:cash", "direction": "CREDIT", "amount": "{{amount}}" }
    ]
  },
  "recurring": {
    "supported": true,
    "default_rule": { "freq": "MONTHLY", "by_month_day": 1 }
  }
}
```

Notes:
- money is in the household base currency.
- builder must ensure postings balance.

## 3) Catalog (MVP)
Income:
- salary (월급)
- incentive (인센티브)

Transfers:
- account_transfer (계좌이체)
- atm_withdrawal (ATM 인출)

Spending:
- living_spend (생활비)
- furniture (가구 구매)
- utilities_water (수도세)
- utilities_electric (전기세)
- fees (수수료)
- rent_monthly (월세)
- deposit_rent (보증금: 자산화)
- contract_payment (계약금: 비용 처리)

Cards:
- credit_card_spend (신용카드 지출)
- check_card_spend (체크카드 지출)
- installment_spend (할부)

Loans:
- loan_from_friend (지인 대출)
- loan_repayment_lump (지인 대출 상환)

Investments (base currency only, avg cost):
- stock_buy_domestic (국내주식 매수)
- stock_sell_domestic (국내주식 매도)
- stock_buy_overseas_krw (해외주식 매수: KRW 환산 입력)
- investment_fee (투자 수수료: 비용 분리)

Savings:
- savings_auto_transfer (적금 자동이체)
- savings_maturity (적금 만기)

Work reimbursements:
- work_expense (업무 지출)
- reimbursement_income (가지급금/환급 입금)

## 4) Template-driven UX requirements
- minimal required fields per template
- defaults: last-used accounts, last category
- friendly validation errors with i18n keys
