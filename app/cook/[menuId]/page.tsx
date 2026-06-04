import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const DAY_HI = ['सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार', 'रविवार']
const DAY_MR = ['सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार', 'रविवार']
const ACC_HI: Record<string, string> = { 'steamed-rice': 'चावल', 'roti': 'रोटी', 'bhakri': 'भाकरी', 'pav': 'पाव', 'paratha': 'पराठा', 'naan': 'नान' }
const ACC_MR: Record<string, string> = { 'steamed-rice': 'भात', 'roti': 'चपाती', 'bhakri': 'भाकरी', 'pav': 'पाव', 'paratha': 'पराठा', 'naan': 'नान' }
const MEAL_HI: Record<string, string> = { breakfast: 'नाश्ता', lunch: 'दोपहर', dinner: 'रात' }
const MEAL_MR: Record<string, string> = { breakfast: 'नाश्ता', lunch: 'दुपार', dinner: 'रात्र' }
const MEAL_EMOJI: Record<string, string> = { breakfast: '🌅', lunch: '🌞', dinner: '🌙' }
const MEAL_ORDER = ['breakfast', 'lunch', 'dinner']
const HINDI_NUMS = ['०','१','२','३','४','५','६','७','८','९']
function toHindiNum(n: number | string): string {
  return String(n).replace(/[0-9]/g, d => HINDI_NUMS[parseInt(d)])
}
const UNIT_HI: Record<string, string> = { 'cup': 'कप', 'cups': 'कप', 'tbsp': 'बड़ा चम्मच', 'tsp': 'छोटा चम्मच', 'g': 'ग्राम', 'kg': 'किलो', 'mL': 'मिली', 'L': 'लीटर', 'pieces': 'पीस', 'to taste': 'स्वादानुसार', 'as needed': 'ज़रूरत अनुसार', 'packets': 'पैकेट' }
const UNIT_MR: Record<string, string> = { 'cup': 'कप', 'cups': 'कप', 'tbsp': 'मोठा चमचा', 'tsp': 'छोटा चमचा', 'g': 'ग्रॅम', 'kg': 'किलो', 'mL': 'मिली', 'L': 'लिटर', 'pieces': 'नग', 'to taste': 'चवीनुसार', 'as needed': 'गरजेनुसार', 'packets': 'पॅकेट' }

export default async function CookViewPage({
  params, searchParams,
}: {
  params: Promise<{ menuId: string }>
  searchParams: Promise<{ lang?: string; day?: string; meal?: string; view?: string }>
}) {
  const { menuId } = await params
  const { lang: lp, day: dp, meal: mp, view: vp } = await searchParams
  const lang = lp === 'mr' ? 'mr' : 'hi'
  const days = lang === 'mr' ? DAY_MR : DAY_HI
  const acc = lang === 'mr' ? ACC_MR : ACC_HI
  const units = lang === 'mr' ? UNIT_MR : UNIT_HI
  const mealLabels = lang === 'mr' ? MEAL_MR : MEAL_HI
  const isWeekView = vp === 'week'

  // Fetch all menu items + shopping list in parallel
  const [{ data: menuItems }, { data: shopItems }] = await Promise.all([
    supabase.from('menu_items').select('*, dish:dishes(*)').eq('menu_id', menuId).order('day_of_week'),
    supabase.from('shopping_lists').select('*, ingredient:ingredients(*)').eq('menu_id', menuId),
  ])
  if (!menuItems?.length) return notFound()

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const selDay = dp !== undefined ? parseInt(dp) : null

  const activeDay = selDay !== null ? selDay
    : menuItems.find(i => i.date === todayStr)?.day_of_week ?? menuItems[0].day_of_week

  const dayItems = menuItems
    .filter(i => i.day_of_week === activeDay)
    .sort((a, b) => MEAL_ORDER.indexOf(a.meal_type || 'dinner') - MEAL_ORDER.indexOf(b.meal_type || 'dinner'))

  const activeMeal = mp || dayItems[0]?.meal_type || 'dinner'
  const active = dayItems.find(i => (i.meal_type || 'dinner') === activeMeal) || dayItems[0]
  if (!active?.dish) return notFound()

  const dish = active.dish

  const [{ data: ingredients }, { data: steps }] = await Promise.all([
    supabase.from('dish_ingredients').select('*, ingredient:ingredients(*)').eq('dish_id', dish.id),
    supabase.from('recipe_steps').select('*').eq('dish_id', dish.id).order('step_number'),
  ])

  const isToday = menuItems.find(i => i.day_of_week === activeDay)?.date === todayStr

  // Today's shopping: ingredients for today's dishes that need to be bought
  const todayDishIds = dayItems.map(di => di.dish?.id).filter(Boolean)
  const { data: todayIngredients } = await supabase
    .from('dish_ingredients').select('quantity, unit, ingredient:ingredients(name_en, name_hi, name_mr)')
    .in('dish_id', todayDishIds)

  // Filter shopping items for today's dishes (items not purchased + to_buy > 0)
  const todayShopItems = shopItems?.filter(si =>
    !si.is_purchased && si.to_buy_qty > 0
  ) || []

  // Match today's ingredients against shopping list
  const toBuyToday: { name: string; qty: string }[] = []
  if (todayIngredients) {
    for (const ti of todayIngredients) {
      const ing = (ti as any).ingredient
      if (!ing) continue
      const inShopList = todayShopItems.find(si => si.ingredient?.name_en === ing.name_en)
      if (inShopList) {
        const n = lang === 'mr' ? (ing.name_mr || ing.name_hi || ing.name_en) : (ing.name_hi || ing.name_en)
        const localUnit = units[inShopList.unit] || inShopList.unit
        toBuyToday.push({ name: n, qty: `${toHindiNum(inShopList.to_buy_qty)} ${localUnit}` })
      }
    }
  }
  // Dedup
  const seenBuy = new Set<string>()
  const uniqueBuyToday = toBuyToday.filter(i => { if (seenBuy.has(i.name)) return false; seenBuy.add(i.name); return true })

  function localQty(qty: number, unit: string): string {
    if (unit === 'to taste') return units['to taste'] || 'स्वादानुसार'
    if (unit === 'as needed') return units['as needed'] || 'ज़रूरत अनुसार'
    return `${toHindiNum(qty)} ${units[unit] || unit}`
  }

  const name = (lang === 'mr' ? (dish.name_mr || dish.name_hi) : dish.name_hi) || dish.name_en
  const makeLabel = lang === 'mr' ? 'आज बनवायचे' : 'आज बनाना'
  const buyLabel = lang === 'mr' ? 'आज खरेदी' : 'आज ख़रीदना'
  const weekLabel = lang === 'mr' ? 'आठवडा' : 'हफ़्ता'
  const todayLabel = lang === 'mr' ? 'आज' : 'आज'
  const ingLabel = lang === 'mr' ? 'साहित्य' : 'सामग्री'
  const stepLabel = lang === 'mr' ? 'कृती' : 'विधि'
  const videoLabel = lang === 'mr' ? 'व्हिडिओ' : 'वीडियो'

  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <title>{name}</title>
        <style>{`
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#F5F0EA;color:#2D2A26;line-height:1.8;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent}
.c{max-width:500px;margin:0 auto;padding:12px 16px 48px}
.hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.lang{display:flex;gap:4px;background:#FFFDF9;border-radius:12px;padding:3px;box-shadow:0 1px 3px rgba(45,42,38,0.06)}
.lb{padding:8px 16px;border-radius:10px;text-decoration:none;font-size:18px;font-weight:600;color:#8C8680}
.lb.on{background:#2D2A26;color:#fff}
.vt{padding:8px 16px;border-radius:10px;text-decoration:none;font-size:18px;font-weight:600;color:#8C8680;background:#FFFDF9;box-shadow:0 1px 3px rgba(45,42,38,0.06)}
.vt.on{background:#2D2A26;color:#fff}
.sec{font-size:24px;font-weight:800;margin-bottom:12px;margin-top:24px;display:flex;align-items:center;gap:10px}
.card{background:#FFFDF9;border-radius:16px;padding:16px;margin-bottom:12px;box-shadow:0 1px 4px rgba(45,42,38,0.06)}
.dn{font-size:36px;font-weight:800;line-height:1.2;margin-bottom:4px}
.ac{font-size:22px;color:#8C8680;margin-bottom:0;font-weight:500}
.mt{display:flex;gap:6px;margin-bottom:16px}
.mb{padding:10px 16px;border-radius:12px;text-decoration:none;font-size:18px;font-weight:600;color:#8C8680;background:#FFFDF9;box-shadow:0 1px 3px rgba(45,42,38,0.06);display:flex;align-items:center;gap:6px}
.mb.on{background:#2D2A26;color:#fff}
.ir{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #F0EDE8;font-size:22px}
.ir:last-child{border:none}
.iq{color:#8C8680;white-space:nowrap;margin-left:10px;font-size:20px}
.st{display:flex;gap:14px;margin-bottom:20px;align-items:flex-start}
.sn{width:40px;height:40px;border-radius:12px;background:#2D2A26;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;flex-shrink:0}
.sx{font-size:22px;line-height:1.7;padding-top:4px}
.yt{display:inline-flex;align-items:center;gap:8px;background:#FF0000;color:#fff;padding:10px 20px;border-radius:12px;text-decoration:none;font-size:18px;font-weight:600;margin-top:8px;margin-bottom:8px}
.yt svg{width:22px;height:22px;fill:#fff}
.nb{display:flex;gap:8px;margin-top:24px;padding-top:20px;border-top:2px solid #E5DFD6}
.na{flex:1;text-align:center;padding:14px;background:#FFFDF9;border-radius:14px;text-decoration:none;color:#2D2A26;font-size:22px;font-weight:600;box-shadow:0 1px 3px rgba(45,42,38,0.06)}
.bi{font-size:20px;padding:8px 0;border-bottom:1px solid #F0EDE8;display:flex;justify-content:space-between}
.bi:last-child{border:none}
.bq{color:#8C8680;font-size:18px}
.wg{margin-top:12px}
.wi{display:block;padding:14px;margin-bottom:6px;background:#FFFDF9;border-radius:14px;text-decoration:none;color:#2D2A26;box-shadow:0 1px 3px rgba(45,42,38,0.06)}
.wi.on{background:#2D2A26;color:#fff}
.wd{font-size:16px;opacity:0.7}
.wn{font-size:22px;font-weight:600}
.empty{text-align:center;padding:20px;color:#8C8680;font-size:20px}
        `}</style>
      </head>
      <body>
        <div className="c">
          {/* Header: language + week toggle */}
          <div className="hdr">
            <div className="lang">
              <a href={`/cook/${menuId}?lang=hi&day=${activeDay}${mp ? `&meal=${mp}` : ''}${isWeekView ? '&view=week' : ''}`} className={`lb ${lang==='hi'?'on':''}`}>हि</a>
              <a href={`/cook/${menuId}?lang=mr&day=${activeDay}${mp ? `&meal=${mp}` : ''}${isWeekView ? '&view=week' : ''}`} className={`lb ${lang==='mr'?'on':''}`}>म</a>
            </div>
            <a href={`/cook/${menuId}?lang=${lang}&day=${activeDay}${isWeekView ? '' : '&view=week'}`} className={`vt ${isWeekView ? 'on' : ''}`}>
              {isWeekView ? todayLabel : weekLabel}
            </a>
          </div>

          {isWeekView ? (
            /* ===== WEEK VIEW ===== */
            <div>
              <div className="sec">📅 {weekLabel}</div>
              <div className="wg">
                {Array.from(new Set(menuItems.map(i => i.day_of_week))).sort().map(dayNum => {
                  const dm = menuItems.filter(i => i.day_of_week === dayNum).sort((a, b) =>
                    MEAL_ORDER.indexOf(a.meal_type || 'dinner') - MEAL_ORDER.indexOf(b.meal_type || 'dinner')
                  )
                  const isActiveDay = dayNum === activeDay
                  return dm.map(item => {
                    const n = lang==='mr' ? (item.dish?.name_mr||item.dish?.name_hi||item.dish?.name_en) : (item.dish?.name_hi||item.dish?.name_en)
                    const mt = item.meal_type || 'dinner'
                    return (
                      <a key={item.id} href={`/cook/${menuId}?lang=${lang}&day=${dayNum}&meal=${mt}`} className={`wi ${isActiveDay && mt === activeMeal ? 'on' : ''}`}>
                        <div className="wd">{days[dayNum]} {dayItems.length > 1 ? MEAL_EMOJI[mt] : ''} {item.date === todayStr ? `← ${todayLabel}` : ''}</div>
                        <div className="wn">{n}</div>
                      </a>
                    )
                  })
                })}
              </div>
            </div>
          ) : (
            /* ===== DAY VIEW (DEFAULT) ===== */
            <div>
              {/* Meal tabs */}
              {dayItems.length > 1 && (
                <div className="mt">
                  {dayItems.map(di => {
                    const mt = di.meal_type || 'dinner'
                    return (
                      <a key={mt} href={`/cook/${menuId}?lang=${lang}&day=${activeDay}&meal=${mt}`} className={`mb ${mt === activeMeal ? 'on' : ''}`}>
                        {MEAL_EMOJI[mt]} {mealLabels[mt]}
                      </a>
                    )
                  })}
                </div>
              )}

              {/* === आज बनाना === */}
              <div className="sec">🍳 {makeLabel}</div>

              <div className="card">
                <div className="dn">{name}</div>
                {dish.default_accompaniment && <div className="ac">+ {acc[dish.default_accompaniment] || dish.default_accompaniment}</div>}
              </div>

              {/* YouTube */}
              {dish.youtube_url && (
                <a href={dish.youtube_url} target="_blank" rel="noopener noreferrer" className="yt">
                  <svg viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.5 31.5 0 000 12a31.5 31.5 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.5 31.5 0 0024 12a31.5 31.5 0 00-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>
                  {videoLabel}
                </a>
              )}

              {/* Ingredients */}
              <div className="sec">{ingLabel}</div>
              <div className="card">
                {ingredients?.map(ing => {
                  const n = lang==='mr' ? (ing.ingredient?.name_mr||ing.ingredient?.name_hi||ing.ingredient?.name_en) : (ing.ingredient?.name_hi||ing.ingredient?.name_en)
                  return (
                    <div key={ing.id} className="ir">
                      <span>{n}</span>
                      <span className="iq">{localQty(ing.quantity, ing.unit)}</span>
                    </div>
                  )
                })}
              </div>

              {/* Steps */}
              <div className="sec">{stepLabel}</div>
              {steps?.map(step => {
                const t = lang==='mr' ? (step.instruction_mr||step.instruction_hi||step.instruction_en) : (step.instruction_hi||step.instruction_en)
                return (
                  <div key={step.id} className="st">
                    <div className="sn">{toHindiNum(step.step_number)}</div>
                    <div className="sx">{t}</div>
                  </div>
                )
              })}

              {/* === आज ख़रीदना === */}
              <div className="sec">🛒 {buyLabel}</div>
              {uniqueBuyToday.length > 0 ? (
                <div className="card">
                  {uniqueBuyToday.map((item, i) => (
                    <div key={i} className="bi">
                      <span>{item.name}</span>
                      <span className="bq">{item.qty}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card empty">
                  {lang === 'mr' ? 'सर्व साहित्य घरात आहे ✓' : 'सब सामान घर पर है ✓'}
                </div>
              )}

              {/* Day navigation */}
              <div className="nb">
                {activeDay > 0 && (
                  <a href={`/cook/${menuId}?lang=${lang}&day=${activeDay-1}`} className="na">← {days[activeDay-1]}</a>
                )}
                {activeDay < 6 && (
                  <a href={`/cook/${menuId}?lang=${lang}&day=${activeDay+1}`} className="na">{days[activeDay+1]} →</a>
                )}
              </div>
            </div>
          )}
        </div>
      </body>
    </html>
  )
}
