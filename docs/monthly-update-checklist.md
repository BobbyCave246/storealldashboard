# Monthly update checklist

Run on the 1st of each month, for the month just closed. Pull every export below for each of the three sites: Central, South and Lears (15 files in all).

## SiteLink exports

| # | Export | Range | Feeds |
|---|--------|-------|-------|
| 1 | Rent roll | As of last day of month | Occupancy, units by type, rent roll value, delinquency watch, current cycle |
| 2 | Rental activity | Whole month | Move-ins, move-outs |
| 3 | Receipts | Whole month | Payment trend, payment methods, autopay share |
| 4 | Mgmt_InquiryTracking (one workbook per site) | Leads placed in the window | Lead funnel |
| 5 | Marketing Summary | Current active base | Customer profile, how they found us, enquiry channel |

## Payment labels

SiteLink's tender names do not match what the money is. Map them as below (June 2026 convention):

| SiteLink label | Dashboard label | Bucket |
|----------------|-----------------|--------|
| Money Order | CIBC (bank transfer) | Online / bank |
| Bank Transfer (system-posted) | Website (Pay Now) | Online / bank |
| Internet | Republic (bank transfer) | Online / bank |
| Plug & Pay | Plug & Pay | Autopay |
| Visa, Master Card, Debit Card | Same | Manual card |
| Cash, Cheque | Same | Cash / cheque |

Leave out account credits and applied refunds. They are not money collected.

## Checks

- Pull soon after month end, so paid-through dates and arrears are clean.
- Corporate accounts: SiteLink's corporate flag was blank in the August 2026 export, so corporate is read from a company name on the account. Check if the flag is still blank.
- The Marketing Summary counts ledgers and the rent roll counts units. Small gaps between them are expected.
- Update the "As of" dates and period labels in `index.html`.
