# Obstetric Drugs (archived 17 Nov 2026)

The owner moved the Obstetric drugs section out of Obstetrics Master Review; it is kept here for the future
House Officer handbook (as Surgery's drugs are in surgery-rapid-review/archive/house-officer-handbook/surgical-drugs).

- `drugs.json`: the source (intro, 6 groups of drugs with name, use, mechanism, dose, side effects, cautions; reference
  parts by trimester, safe drugs, breastfeeding, drugs to avoid).
- `pages/`: the 15 finished book pages as they were (y00_drcover … y14_dr14), `meta_pages.json`: their meta entries.
- `img/`: the section cover (drcover.jpg) and the cover-page picture (drpic.jpg).
- `tools/`: drugs.py, drugs_layout.js, drugs_write.py (copies; the originals stay in tools/).

## Way back into the book
1. Copy `drugs.json` to `content/`, `img/*` to `assets/img/`.
2. Add a page `y00_drcover` after the last Rapid Review page (tools/insert_page.py) and run
   `python3 tools/drugs.py && python3 build.py && node tools/drugs_layout.js && python3 tools/drugs_write.py && python3 tools/poster_pages.py && python3 build.py`.
   The app shows the Resources row, the search place, the help line and the contents rows again by itself once `y0…` pages exist.
