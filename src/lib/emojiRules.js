// Keyword → emoji rules. First match wins, order matters.
// Use \b for word boundaries where possible to avoid false matches.

export const EMOJI_RULES = [
  // ── Food & Drink ────────────────────────────────────────────────────────────
  { pattern: /es krim|ice cream|gelato/i,                                emoji: '🍦' },
  { pattern: /\bkopi\b|coffee|espresso|latte|cappuccino/i,               emoji: '☕' },
  { pattern: /boba|bubble tea|chatime|\bkoi\b|xing fu/i,                 emoji: '🧋' },
  { pattern: /\bjus\b|juice|smoothie/i,                                  emoji: '🧃' },
  { pattern: /\bteh\b|tehbotol/i,                                        emoji: '🍵' },
  { pattern: /\bmie\b|bakmi|indomie|ramen/i,                             emoji: '🍜' },
  { pattern: /\bpizza\b/i,                                               emoji: '🍕' },
  { pattern: /\bburger\b|\bmcd\b|mcdonalds?|kfc|wendy/i,                emoji: '🍔' },
  { pattern: /\bayam\b|chicken/i,                                        emoji: '🍗' },
  { pattern: /\bsate\b|satay/i,                                          emoji: '🍢' },
  { pattern: /\bbakso\b|\bbaso\b/i,                                      emoji: '🥣' },
  { pattern: /\bnasi\b|nasgor|nasi goreng/i,                             emoji: '🍚' },
  { pattern: /sushi|sashimi/i,                                           emoji: '🍱' },
  { pattern: /\broti\b|bread|toast|sandwich/i,                           emoji: '🍞' },
  { pattern: /\bkue\b|donat|donut|pastry/i,                              emoji: '🎂' },
  { pattern: /coklat|chocolate/i,                                        emoji: '🍫' },
  { pattern: /\bbuah\b|apel|jeruk|pisang|mangga|semangka/i,              emoji: '🍎' },
  { pattern: /seafood|\bikan\b|udang|cumi/i,                             emoji: '🦐' },
  { pattern: /martabak|gorengan|snack|cemilan/i,                         emoji: '🥘' },
  { pattern: /\bmakan\b|restoran?|warteg|warung|\bcafe\b|kafe|kantin/i,  emoji: '🍽️' },

  // ── Transport ────────────────────────────────────────────────────────────────
  { pattern: /bensin|bbm|pertalite|pertamax|pertamina|\bsolar\b|spbu/i,  emoji: '⛽' },
  { pattern: /\btol\b|toll/i,                                            emoji: '🛣️' },
  { pattern: /\bparkir\b/i,                                              emoji: '🅿️' },
  { pattern: /\bgrab\b|gojek|\bojek\b/i,                                 emoji: '🛵' },
  { pattern: /busway|transjakarta|\bmrt\b|\bkrl\b|commuter|kereta|\blrt\b/i, emoji: '🚇' },
  { pattern: /taxi|taksi|bluebird/i,                                     emoji: '🚕' },
  { pattern: /\bservis\b|bengkel|cuci mobil|cuci motor/i,                emoji: '🔧' },

  // ── Shopping & Lifestyle ─────────────────────────────────────────────────────
  { pattern: /\bbaju\b|kaos|kemeja|celana|jaket|dress|pakaian/i,         emoji: '👕' },
  { pattern: /sepatu|sandal|sneaker/i,                                   emoji: '👟' },
  { pattern: /\btas\b|\bdompet\b/i,                                      emoji: '👜' },
  { pattern: /belanja|shopping|tokopedia|shopee|lazada/i,                emoji: '🛍️' },
  { pattern: /skincare|makeup|kosmetik|\bsabun\b|shampoo|parfum/i,       emoji: '🧴' },

  // ── Entertainment ────────────────────────────────────────────────────────────
  { pattern: /bioskop|cinema|xxi|cgv|cinepolis|nonton|\bfilm\b/i,        emoji: '🎬' },
  { pattern: /\bgame\b|gaming|steam|playstation|xbox/i,                  emoji: '🎮' },
  { pattern: /karaoke/i,                                                  emoji: '🎤' },
  { pattern: /\bgym\b|fitnes|fitness|olahraga|renang|futsal|badminton/i, emoji: '💪' },
  { pattern: /konser|\bmusik\b|spotify/i,                                emoji: '🎵' },
  { pattern: /netflix|disney|hbo|prime video|streaming/i,                emoji: '📺' },

  // ── Health ───────────────────────────────────────────────────────────────────
  { pattern: /\bobat\b|apotek|kimia farma/i,                             emoji: '💊' },
  { pattern: /dokter|rumah sakit|\brs\b|klinik|puskesmas|dental|\bgigi\b/i, emoji: '🏥' },

  // ── Bills & Finance ──────────────────────────────────────────────────────────
  { pattern: /listrik|\bpln\b/i,                                         emoji: '⚡' },
  { pattern: /internet|wifi|indihome/i,                                  emoji: '📶' },
  { pattern: /\bpulsa\b|paket data|\bxl\b|\bim3\b|smartfren|axis/i,     emoji: '📱' },
  { pattern: /\bpdam\b/i,                                                emoji: '💧' },
  { pattern: /cicilan|angsuran/i,                                        emoji: '💳' },
  { pattern: /asuransi|insurance/i,                                      emoji: '🛡️' },

  // ── Education ────────────────────────────────────────────────────────────────
  { pattern: /\bbuku\b|\bbook\b/i,                                       emoji: '📚' },
  { pattern: /kursus|\bles\b|pelatihan|seminar|workshop/i,               emoji: '📖' },

  // ── Pets ─────────────────────────────────────────────────────────────────────
  { pattern: /kucing|anjing|\bpet\b|\bpakan\b/i,                         emoji: '🐾' },

  // ── Travel ───────────────────────────────────────────────────────────────────
  { pattern: /\bhotel\b|penginapan|airbnb|\bkost\b/i,                    emoji: '🏨' },
  { pattern: /pesawat|terbang|\bflight\b|airport/i,                      emoji: '✈️' },

  // ── Money ────────────────────────────────────────────────────────────────────
  { pattern: /\bgaji\b|salary|\bhonor\b|\bthr\b|\bbonus\b/i,             emoji: '💰' },
  { pattern: /\btransfer\b|kirim uang/i,                                 emoji: '💸' },
  { pattern: /\batm\b|tarik tunai/i,                                     emoji: '🏧' },
]
