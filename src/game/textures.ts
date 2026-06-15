// @ts-nocheck
// Small canvas-drawing helpers for Leo + particle/prompt textures — verbatim from the prototype.

export function rrPath(ctx, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath() }
export function fillStroke(ctx, fill, oc, ow) { if (fill) { ctx.fillStyle = fill; ctx.fill() } if (oc) { ctx.lineJoin = 'round'; ctx.strokeStyle = oc; ctx.lineWidth = ow || 2; ctx.stroke() } }
// pixel-art Leo (small black lab) — drawn low-res so it sits in the Sunny Land style
export function leoTex(ctx, w, h, phase) {
  const O = '#15120f', furB = '#3c3a35', furS = '#2a2824', furH = '#6f6a61', gray = '#aab0b8', tan = '#d8b45a'
  const base = h - 1
  let ty = phase === 1 ? -4 : (phase === 2 ? 2 : -1); ctx.save(); ctx.translate(5, base - 14); ctx.rotate(ty * 0.08); rrPath(ctx, -3, -1, 5, 12, 2); fillStroke(ctx, furB, O, 2); ctx.restore()
  const A = phase === 1, B = phase === 2; const leg = (x, f) => { rrPath(ctx, x + f, base - 8, 5, 8, 2); fillStroke(ctx, furS, O, 1.6) }
  leg(10, A ? 1 : (B ? -1 : 0)); leg(15, A ? -1 : (B ? 1 : 0)); leg(22, A ? 1 : (B ? -1 : 0)); leg(27, A ? -1 : (B ? 1 : 0))
  rrPath(ctx, 6, base - 18, 28, 12, 6); fillStroke(ctx, furB, O, 2); ctx.fillStyle = furH; rrPath(ctx, 9, base - 17, 18, 3, 2); ctx.fill()
  ctx.beginPath(); ctx.arc(32, base - 20, 8, 0, 7); fillStroke(ctx, furB, O, 2)
  rrPath(ctx, 37, base - 19, 6, 6, 3); fillStroke(ctx, furB, O, 1.6); ctx.beginPath(); ctx.arc(43, base - 16, 1.7, 0, 7); fillStroke(ctx, '#0c0c0c', O, 1)
  rrPath(ctx, 27, base - 27, 6, 9, 3); fillStroke(ctx, furS, O, 2)
  const eye = ex => { ctx.beginPath(); ctx.arc(ex, base - 21, 2.4, 0, 7); fillStroke(ctx, '#fff', O, 1.4); ctx.beginPath(); ctx.arc(ex + .4, base - 20.6, 1.3, 0, 7); ctx.fillStyle = '#3a2a18'; ctx.fill() }
  eye(31); eye(37)
  ctx.fillStyle = 'rgba(255,150,160,.6)'; ctx.beginPath(); ctx.arc(29, base - 16, 1.8, 0, 7); ctx.fill()
  rrPath(ctx, 28, base - 14, 6, 4, 2); fillStroke(ctx, gray, O, 1.4); ctx.beginPath(); ctx.arc(31, base - 10, 1.2, 0, 7); fillStroke(ctx, tan, O, .8)
}
export function dotTex(c) { c.fillStyle = '#fff'; c.beginPath(); c.arc(4, 4, 4, 0, 7); c.fill() }
export function star4Tex(c, w, h) {
  const cx = w / 2, cy = h / 2; c.fillStyle = '#fff'
  c.beginPath(); c.moveTo(cx, 1); c.lineTo(cx + 2, cy); c.lineTo(cx, h - 1); c.lineTo(cx - 2, cy); c.closePath(); c.fill()
  c.beginPath(); c.moveTo(1, cy); c.lineTo(cx, cy - 2); c.lineTo(w - 1, cy); c.lineTo(cx, cy + 2); c.closePath(); c.fill()
  c.beginPath(); c.arc(cx, cy, 1.7, 0, 7); c.fill()
}
export function haloTex(c, w, h) { const cx = w / 2, cy = h / 2;[[60, .10], [46, .16], [33, .24], [22, .34]].forEach(([r, a]) => { c.fillStyle = 'rgba(255,255,255,' + a + ')'; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill() }) }
export function shadowTex(c, w, h) { c.fillStyle = 'rgba(20,18,30,.28)'; c.beginPath(); c.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, 7); c.fill() }
