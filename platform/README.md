# Student Master Review (platform)

One home for the Student Master Note books: **Basic Sciences**, **Clinical** and **House Officer**.
Plain static site (HTML, CSS, JavaScript; no build step, no framework). Deployed by `.github/workflows/platform.yml`
to its own Cloudflare Pages project `student-master-review`.

## How the existing apps are connected
The three live apps open **inside the platform** (owner, 11 Nov 2026): route `#read-<id>` shows the app in a frame under
a slim platform bar (back to the library, the platform seal → Home, the book's name; no separate address is shown, owner 11 Nov 2026).
Each frame stays loaded while the student moves around the platform, so returning resumes where they were.

| Book | App | Address shown in the frame |
|---|---|---|
| Surgery | Surgery Master Review | https://surgery-master-review.jaberarja555.workers.dev/ |
| Obstetrics | Obstetrics Master Review | https://obstetrics-master-review.pages.dev/ |
| Pediatrics | Pediatric Master Review | https://pediatrics-master-review.jaberarja555.workers.dev/ |

The apps themselves are unchanged. Phones keep a frame's storage apart from the same app opened at its own address
(browser storage partitioning), so the first time inside the platform a student activates once more (it counts as another
device of the subscription; Surgery and Pediatrics codes allow 2 devices by default, raise `maxdev` on the admin page when
needed). Notes and progress come back through each app's sync. A first-time note in the book bar says this (`smr-seen`).
If an app ever sends `X-Frame-Options` or `frame-ancestors`, the frame shows a "taking longer" message with "Open at its own address".

## Opening screen and installing (owner, 11 Nov 2026)
Arabic is the default language. Each time the link is opened in a browser (once per visit, `sessionStorage smr-wel`) a greeting offers
«ثبّت التطبيق» or «المتابعة في المتصفح». Install follows the device: the browser's own install window when it offers one
(`beforeinstallprompt`, kept in `window.__bip` from the head; Android Chrome, Chrome/Edge on computers), otherwise the steps:
iPhone/iPad Share → Add to Home Screen (in-app browsers: open in Safari first), Android without the offer (e.g. opened from WhatsApp):
an «افتح في Chrome» button (`intent://…;package=com.android.chrome`) then menu → Install app, Mac Safari File → Add to Dock, Firefox: use Chrome/Edge.
The installed app (standalone) shows only a welcome with «ابدأ». Settings has «تثبيت التطبيق» too. `sw.js` (network first, offline copy of the
platform's own screens) makes it installable.

## Files
- `index.html` shell · `css/app.css` look (day/night tokens, phone/tablet/desktop, right-to-left) · `js/app.js` screens and routing
- `js/catalogue.js` **the book list**: every screen is built from it. To release a book: set `status: 'available'`, add `url`
  (or an internal route), `app`, `edition` and its real `tools`. To add a book: add an entry with its section and cover.
- `js/i18n.js` interface text in English and Arabic (Modern Standard Arabic). Book titles stay in English.
- `img/covers/` covers (480 px WebP; Surgery, Obstetrics and Pediatric are the books' own covers; House Officer handbook covers
  were cut from the owner's design), `img/ui/` logo mark and background pictures. Icons: `icon-192.png`, `icon-512.png`,
  `apple-touch-icon.png`, `favicon.png` (made from the owner's Master Review logo).

## Screens (hash routes)
`#home` · `#basic-sciences` · `#clinical` · `#house-officer` · `#book-<id>` (panel of a planned book) · `#read-<id>` (a book open inside) · `#my-library` ·
`#progress` · `#preferences` (Settings) · `#notifications` · `#search`.

## What is stored on the device (`smr-` keys in localStorage)
`smr-lang`, `smr-theme`, `smr-name`, `smr-photo` (small JPEG), `smr-recent` (books opened from here), `smr-saved` (planned books
saved for later), `smr-seen` (books whose first-time note was closed). Nothing is sent anywhere. There is no shared account yet; progress figures stay inside each app.

## Check after changes
Serve the folder (`python3 -m http.server -d platform 8811`) and look at 390 px, 820 px and 1440 px, day and night, English and Arabic.
