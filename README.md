# P4 — Delivery Copilot

Quattro snapshot settimanali sintetici di Jira: WIP, blocker, età dei blocker, capacità. Il report in italiano mette un numero accanto a ogni frase.

```bash
wrangler deploy --config projects/delivery-copilot/wrangler.toml
```

Endpoint: `/health`, `/api/metrics?week=1..4`, `/api/report?week=1..4`, `POST /api/eval`. La dashboard ha un selettore di settimana: genera il report, lo salva in D1 (`p4_reports`) e permette di scaricarlo in Markdown.

## Metriche misurate

- 4 report generati
- 4 con numeri verificabili
- 4 con fonte dichiarata
- Nessun fallback silenzioso

Nessun dato Jira reale. Nessuna misura di ore risparmiate da persone.

## Link pubblici

- Demo live: https://delivery-copilot.riccardobozzato.workers.dev/
- Caso con metodo e limiti: https://riccardobozzato.com/casi/delivery-copilot
- Riproduzione eval: `POST /api/eval` sulla demo (4 snapshot sintetici, 12 issue ciascuno).
- Autore: https://riccardobozzato.com/ — dati sintetici dichiarati, nessun cliente reale.
