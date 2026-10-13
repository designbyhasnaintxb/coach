# Coach Kwame — media sources & launch checklist (internal)

Not linked from the site; `netlify.toml` returns 404 for this file, for `/_old-client/*` and for `pitch3d.js`.

## Media source

The Facebook profile (https://web.facebook.com/profile.php?id=100095092693624) **could not be audited**: this build environment's network policy blocks facebook.com.
All photos on the site are the **five images the project owner supplied directly** on 2026-10-13.
Originals are not committed. Everything was re-encoded to WebP at responsive sizes (share image: JPG 1200×628).

**No video is used.** No authentic training clip has been supplied yet, so the kept video block ("Training in motion": muted inline preview, pause offscreen, expand-to-viewer, playback line) stays `hidden` in `index.html`. No stock or generated footage was added.

## Curation (A = hero quality · B = strong editorial · C = support · D = not used)

| Supplied photo | Files in `assets/media/` | Grade | Used in |
|---|---|---|---|
| Kwame under the lights, arm out, white #28 kit (match) | kwame-hero-640/1095, kwame-og.jpg, kwame-lights-wide-1095 | A | Hero, share image, footer backdrop |
| Kwame on the ball vs. a Daytona State player (match) | kwame-ball-560/997, kwame-ball-zone-500 (Kwame-only crop) | A/B | Gallery "On the ball", 90-minute pricing zone |
| Kwame in bucket hat coaching two players in bibs (training) | kwame-coaching-560/1000 | B | Gallery "Coaching" |
| Studio headshot in #28 kit | kwame-portrait-480/900 | B | About portrait |
| Empty field with cones (yellow object + photographer's shadow cropped out) | kwame-field-464 | C | Gallery "The ground", 60-minute pricing zone |

## Must confirm before launch

- [ ] **Photo rights.** The headshot and both match photos look like team / athletics-department photography. The copyright usually sits with the photographer or school, not the player. Get permission or replace them.
- [ ] **Minors.** The coaching photo shows several young players' faces. Written parent / guardian permission is needed before live use, or swap in a photo without identifiable minors.
- [ ] **Third parties and school branding.** The match photos show a school kit ("E", #28) and an opposing Daytona State player. The site names no school, team or playing history. Keep it that way until Kwame confirms what may be said.
- [ ] **Training photos.** The site has one true training photo. More 1-on-1 session photos, and ideally one short clip, would make the pricing and gallery sections far more convincing than match photos.
- [ ] Preferred public name and spelling ("Coach Kwame"), and whether the Facebook link should stay.
- [ ] Instagram URL (still "coming soon" on the site; do not invent one).
- [ ] Service area / city, contact details, currency (prices show "$" only).
- [ ] How payment is actually taken. The form says payment is arranged with Kwame; online payment is a labelled, unconnected demo.
- [ ] Netlify Forms notifications switched on so requests actually reach Kwame. "Request received" is shown only after Netlify accepts the submission.
- [ ] Not shown anywhere, and must stay that way until confirmed: certifications, years coaching, team / academy affiliations, playing history, results, placements, guarantees, availability, group pricing / schedule, camps.
