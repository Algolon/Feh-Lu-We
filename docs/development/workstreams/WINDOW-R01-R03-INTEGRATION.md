# WINDOW-R01-R03 — aparte productie-integratiereview

Basis: huidig productiecommit `be9a9e223da13bd51d599a1b9f00dc82a0b60e35`. Originele, gevalideerde pilot: `daec867bae989df56f1f89757848edb9ce3dc3d7`.
De 39 pilotbestanden zijn overgenomen bovenop productie. De overlappende `arch.ts`,
`exteriorStudy.ts` en `manor.ts` zijn met een driewegvergelijking van hun gemeenschappelijke
basis `76f410a31cc80e2617267bd3693e52aa9f55ae96` samengevoegd; productie-afwerkingen en alle windowfixes blijven behouden.

Deze branch heeft geen productie-effect. De screenshotworkflow vergelijkt met `be9a9e223da13bd51d599a1b9f00dc82a0b60e35`,
niet met de oude ontwikkelbasis. Eerst typecheck, tests, build, head-on en schuine
beelden en eventueel mobiel controleren. Geen merge/deploy zonder review.
