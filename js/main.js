/* MEGACITY — theme config: the live city, light through the blinds, the analysis
   overlay on game pages, the city readout and the opening. */
const THEME = {
    name: "Megacity",
    tilt: 0,
    hudEvery: 1000,
    hud(d, ctx) {
        const p = (n) => String(n).padStart(2, "0");
        const t = d.getTime() / 1000;
        const rain = (3.2 + Math.sin(t / 97) * 1.6 + Math.sin(t / 13) * .4).toFixed(1);
        const vis = (0.6 + Math.sin(t / 211) * .25).toFixed(2);
        const hum = Math.round(91 + Math.sin(t / 71) * 4);
        const pct = document.querySelector(".BottomBar .DownloadStatus .DetailedDownloadProgress .Percentage");
        const tx = document.querySelector(".BottomBar .DownloadStatus .DetailedDownloadProgress") ? "<span class='tx'>TRANSFER " + (pct ? pct.textContent.trim() : "ACTIVE") + "</span>" : "<span>TRANSFERS IDLE</span>";
        const w = ctx.flag("--mg-weather") || "rain";
        const sky = w === "snow" ? "SNOW" : w === "dry" ? "DRY" : "RAIN <b>" + rain + "</b> MM/H";
        return "<span class='live'>SECTOR 9</span><b>" + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds()) + "</b><span>" + sky + "</span><span class='opt'>VIS <b>" + vis + "</b> KM</span><span class='opt'>HUM <b>" + hum + "</b>%</span>" + tx;
    },
    boot() {
        return { className: "mg-eye", ms: 4300,
            html: "<div class='eye'><div class='iris'></div><div class='pupil'></div><div class='glint'></div><div class='flare'></div><div class='lid'></div></div>" +
                  "<div class='t'>MEGACITY</div><div class='r'>SUBJECT RESPONSE · PUPIL 2.4 MM · IRIS PATTERN LOGGED</div>" };
    },
    init(api) {
        const root = document.documentElement;
        document.body.insertAdjacentHTML("beforeend", "<div class='mg-blinds'></div><div class='mg-grain'></div>");
        const keep = () => { for (const c of ["mg-blinds", "mg-grain"]) if (!document.querySelector("." + c)) document.body.insertAdjacentHTML("beforeend", "<div class='" + c + "'></div>"); };
        setInterval(keep, 3000);

        /* ---- analysis overlay on the game artwork ---- */
        api.onMove((e) => {
            const cap = e.target.closest && e.target.closest(".AppDetailsMain .TopCapsule");
            document.querySelectorAll(".AppDetailsMain .TopCapsule.mg-aim").forEach((c) => { if (c !== cap) c.classList.remove("mg-aim"); });
            if (!cap) return;
            const r = cap.getBoundingClientRect();
            const x = e.clientX - r.left, y = e.clientY - r.top;
            cap.classList.add("mg-aim");
            cap.style.setProperty("--mg-cx", x + "px"); cap.style.setProperty("--mg-cy", y + "px");
            const esp = cap.querySelector(".mg-esp");
            if (esp) esp.innerHTML = "<span class='rec'>● TRACK</span><span>X <b>" + (x * 3.21 + 1000).toFixed(2) + "</b></span><span>Y <b>" + (y * 3.21 + 1000).toFixed(2) + "</b></span><span>ZOOM <b>" + (1 + (x / r.width) * 3).toFixed(1) + "×</b></span>";
        });
        setInterval(() => {
            root.classList.toggle("mg-esp-off", api.flag("--mg-esp") === "off");
            const cap = document.querySelector(".AppDetailsMain .TopCapsule");
            if (cap && !cap.querySelector(".mg-esp")) { const d = document.createElement("div"); d.className = "mg-esp"; d.innerHTML = "<span class='rec'>● LIVE</span><span>ANALYSIS READY</span><span>GRID <b>64</b></span>"; cap.appendChild(d); }
        }, 900);

        /* ---- the city ---- */
        const cv = document.createElement("canvas"); cv.id = "mg-city"; document.body.prepend(cv);
        const g = cv.getContext("2d");
        let W = 0, H = 0, layers = null, seed = 7;
        const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
        const css = (n, f) => (getComputedStyle(root).getPropertyValue(n).trim() || f);
        const pal = () => ({ haze: css("--mg-haze", "#0C1A22"), cyan: css("--mg-cyan", "#3FE6F2"), pink: css("--mg-pink", "#FF3D8B"), amber: css("--mg-amber", "#FFB454"), fire: css("--mg-fire", "#FF7424") });
        let P = pal(), palKey = "";
        const off = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
        const winColor = () => { const k = rnd(); return k < .55 ? "rgba(255,196,120," : k < .8 ? "rgba(200,235,255," : k < .92 ? P.cyan : P.pink; };
        function building(x2, bx, by, bw, bh, dark, lit) {
            x2.fillStyle = dark; x2.fillRect(bx, by, bw, bh);
            for (let wy = by + 6; wy < by + bh - 4; wy += 6) for (let wx = bx + 3; wx < bx + bw - 3; wx += 5) {
                if (rnd() > lit) continue;
                const c = winColor();
                x2.fillStyle = c.startsWith("rgba") ? c + (0.35 + rnd() * .6).toFixed(2) + ")" : c;
                x2.globalAlpha = c.startsWith("rgba") ? 1 : .55;
                x2.fillRect(wx, wy, 2, 2); x2.globalAlpha = 1;
            }
        }
        function build() {
            W = cv.width = innerWidth; H = cv.height = innerHeight; seed = 7; P = pal();
            const far = off(W, H), mid = off(W, H), near = off(W, H);
            const hz = H * .72;
            // far: haze bands, the stepped megastructure, a low skyline
            let x = far.getContext("2d");
            const smog = x.createLinearGradient(0, 0, 0, H); smog.addColorStop(0, "#04070B"); smog.addColorStop(.38, "#0A161D"); smog.addColorStop(.62, "#1E2A2E"); smog.addColorStop(.72, "#4A3526"); smog.addColorStop(.82, "#2A1A12"); smog.addColorStop(1, "#0A0705");
            x.fillStyle = smog; x.fillRect(0, 0, W, H);
            const hg = x.createRadialGradient(W * .5, hz, 10, W * .5, hz, W * .75); hg.addColorStop(0, "rgba(255,150,80,.26)"); hg.addColorStop(.4, "rgba(255,120,60,.12)"); hg.addColorStop(1, "rgba(255,120,60,0)"); x.fillStyle = hg; x.fillRect(0, 0, W, H);
            const tg = x.createRadialGradient(W * .2, hz - H * .12, 10, W * .2, hz - H * .12, W * .45); tg.addColorStop(0, "rgba(80,150,170,.18)"); tg.addColorStop(1, "rgba(80,150,170,0)"); x.fillStyle = tg; x.fillRect(0, 0, W, H);
            for (let bx = 0; bx < W; bx += 14 + rnd() * 18) { const bh = 40 + rnd() * 110; building(x, bx, hz - bh, 10 + rnd() * 16, bh + H, "#121C22", .14); }
            const px = W * .68, pw = Math.min(820, W * .46), ph = pw * .5;
            x.save(); x.globalCompositeOperation = "lighter";
            for (const a of [-.55, -.25, .2, .5]) { x.save(); x.translate(px, hz - ph); x.rotate(a); const sg = x.createLinearGradient(0, 0, 0, -H); sg.addColorStop(0, "rgba(255,200,120,.1)"); sg.addColorStop(1, "rgba(255,200,120,0)"); x.fillStyle = sg; x.beginPath(); x.moveTo(-6, 0); x.lineTo(6, 0); x.lineTo(90, -H); x.lineTo(-90, -H); x.closePath(); x.fill(); x.restore(); }
            x.restore();
            for (let i = 0; i < 9; i++) { const sw = pw * (1 - i / 10), sh = ph / 9; x.fillStyle = i % 2 ? "#0B1318" : "#0D171D"; x.fillRect(px - sw / 2, hz - (i + 1) * sh, sw, sh + 1);
                for (let wx = px - sw / 2 + 4; wx < px + sw / 2 - 4; wx += 6) if (rnd() < .6) { x.fillStyle = "rgba(255,196,120," + (.4 + rnd() * .55).toFixed(2) + ")"; x.fillRect(wx, hz - (i + 1) * sh + sh * .35, 3, 2); if (rnd() < .3) x.fillRect(wx, hz - (i + 1) * sh + sh * .7, 3, 2); } }
            x.fillStyle = "rgba(255,220,160,.9)"; x.fillRect(px - pw * .05, hz - ph - 3, pw * .1, 3);
            const glow = x.createRadialGradient(px, hz - ph, 4, px, hz - ph, pw * .45); glow.addColorStop(0, "rgba(255,190,120,.5)"); glow.addColorStop(1, "rgba(255,190,120,0)"); x.fillStyle = glow; x.fillRect(px - pw, hz - ph * 2, pw * 2, ph * 2);
            // mid: towers with windows and neon panels
            x = mid.getContext("2d");
            const towers = [];
            for (let bx = -20; bx < W; bx += 40 + rnd() * 70) {
                const bw = 34 + rnd() * 60, bh = H * (.25 + rnd() * .45);
                building(x, bx, H - bh, bw, bh, "#070D12", .28);
                if (rnd() < .35) { const ny = H - bh + 20 + rnd() * bh * .5, nh = 30 + rnd() * 60, c = rnd() < .5 ? P.pink : P.cyan;
                    x.fillStyle = c; x.globalAlpha = .18; x.fillRect(bx + bw * .25 - 10, ny - 10, 27, nh + 20); x.globalAlpha = .3; x.fillRect(bx + bw * .25, ny, 7, nh);
                    x.globalAlpha = .7; for (let k = ny + 4; k < ny + nh - 4; k += 9) x.fillRect(bx + bw * .25 + 1.5, k, 4, 5); x.globalAlpha = 1; }
                if (rnd() < .5) towers.push({ x: bx + bw / 2, y: H - bh - 14 - rnd() * 20, ph: rnd() * 6 });
                x.fillStyle = "#060C11"; if (towers.length && towers[towers.length - 1].x === bx + bw / 2) x.fillRect(bx + bw / 2 - 1, towers[towers.length - 1].y, 2, H - bh - towers[towers.length - 1].y);
            }
            // near: dark foreground blocks
            x = near.getContext("2d");
            for (let bx = -30; bx < W; bx += 90 + rnd() * 140) { const bw = 80 + rnd() * 140, bh = H * (.08 + rnd() * .16); x.fillStyle = "#020408"; x.fillRect(bx, H - bh, bw, bh); }
            const stacks = [{ x: W * .08, y: H * .6 }, { x: W * .93, y: H * .56 }, { x: W * .34, y: H * .7 }, { x: W * .58, y: H * .74 }];
            for (const s of stacks) { x.fillStyle = "#020408"; x.beginPath(); x.moveTo(s.x - 4, s.y); x.lineTo(s.x + 4, s.y); x.lineTo(s.x + 11, H); x.lineTo(s.x - 11, H); x.closePath(); x.fill(); x.fillRect(s.x - 8, s.y, 16, 4); for (let k = s.y + 30; k < H; k += 46) x.fillRect(s.x - 10, k, 20, 2); }
            const rain = []; for (let i = 0; i < 320; i++) rain.push({ x: rnd() * W, y: rnd() * H, l: 10 + rnd() * 22, v: 9 + rnd() * 9, a: .08 + rnd() * .22 });
            const cars = []; for (let i = 0; i < 4; i++) cars.push({ t: rnd(), sp: .00025 + rnd() * .0004, y: H * (.15 + rnd() * .45), dir: rnd() < .5 ? 1 : -1, bob: rnd() * 6 });
            layers = { far, mid, near, stacks, rain, cars, towers, hz, flares: stacks.map(() => ({ next: performance.now() + 1500 + rnd() * 6000, t0: -1 })), win: [] };
        }
        let last = 0;
        function frame(now) {
            requestAnimationFrame(frame);
            const city = api.flag("--mg-city") || "live";
            if (document.hidden || city === "off") { if (city === "off" && cv.style.display !== "none") cv.style.display = "none"; return; }
            if (cv.style.display === "none") cv.style.display = "";
            const still = city === "still" || api.motion() === 0 || api.flag("--mr-ambient") === "paused";
            if (now - last < (still ? 2000 : 33)) return;
            last = now;
            const k = api.flag("--mg-haze") + api.flag("--mg-cyan") + api.flag("--mg-pink");
            if (!layers || W !== innerWidth || H !== innerHeight || k !== palKey) { palKey = k; build(); }
            const L = layers, t = now / 1000;
            g.clearRect(0, 0, W, H);
            // sky haze with a glow from the stacks
            let fireGlow = 0;
            for (const f of L.flares) { if (f.t0 > 0) { const a = (now - f.t0) / 2200; if (a > 1) { f.t0 = -1; f.next = now + 2500 + Math.random() * 6000; } else fireGlow = Math.max(fireGlow, Math.sin(a * Math.PI)); } else if (!still && now > f.next) f.t0 = now; }
            const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "rgba(4,8,12,0)"); sky.addColorStop(.75, "rgba(255,116,36," + (.05 + fireGlow * .12).toFixed(3) + ")"); sky.addColorStop(1, "rgba(255,116,36," + (.08 + fireGlow * .2).toFixed(3) + ")");
            g.drawImage(L.far, 0, 0);
            g.fillStyle = sky; g.fillRect(0, 0, W, H);
            // drifting fog
            for (let i = 0; i < 2; i++) { const fy = L.hz - 60 + i * 120, fx = ((t * (6 + i * 4)) % (W + 600)) - 300;
                const fg = g.createRadialGradient(fx, fy, 10, fx, fy, 420); fg.addColorStop(0, "rgba(140,180,195,.12)"); fg.addColorStop(1, "rgba(120,170,190,0)"); g.fillStyle = fg; g.fillRect(fx - 420, fy - 420, 840, 840); }
            // the blimp: a dark hull, a scrolling ad panel and searchlights
            const bp = ((t / 140) % 1), bx = -260 + bp * (W + 520), by = H * .16 + Math.sin(t / 7) * 6;
            g.save(); g.globalAlpha = .9;
            for (let i = 0; i < 2; i++) { const ang = Math.sin(t / 3 + i * 2) * .35; g.save(); g.translate(bx - 40 + i * 80, by + 26); g.rotate(ang);
                const beam = g.createLinearGradient(0, 0, 0, H); beam.addColorStop(0, "rgba(220,240,255,.16)"); beam.addColorStop(1, "rgba(220,240,255,0)"); g.fillStyle = beam;
                g.beginPath(); g.moveTo(-4, 0); g.lineTo(4, 0); g.lineTo(120, H); g.lineTo(-120, H); g.closePath(); g.fill(); g.restore(); }
            const hull = g.createLinearGradient(0, by - 34, 0, by + 34); hull.addColorStop(0, "#3A4650"); hull.addColorStop(.18, "#121A21"); hull.addColorStop(1, "#05080C"); g.fillStyle = hull; g.beginPath(); g.ellipse(bx, by, 170, 38, 0, 0, Math.PI * 2); g.fill();
            for (let k = -120; k <= 120; k += 30) { g.fillStyle = (Math.floor(t * 3 + k) % 3) ? "rgba(255,220,170,.85)" : "rgba(255,220,170,.2)"; g.fillRect(bx + k, by + 30, 3, 2); }
            const ad = g.createLinearGradient(bx - 90, 0, bx + 90, 0); ad.addColorStop(0, P.pink); ad.addColorStop(.5, P.amber); ad.addColorStop(1, P.cyan);
            g.globalAlpha = .55 + .25 * Math.sin(t * 2.3); g.fillStyle = ad; g.fillRect(bx - 90, by - 12, 180, 24);
            g.globalAlpha = .9; g.fillStyle = "#05080C"; const sh = (t * 30) % 24;
            for (let gx = bx - 90 - sh; gx < bx + 90; gx += 24) { g.fillRect(gx + 6, by - 8, 3, 16); g.fillRect(gx + 12, by - 8, 7, 3); g.fillRect(gx + 12, by + 5, 7, 3); }
            g.globalAlpha = 1; g.fillStyle = (Math.floor(t * 2) % 2) ? "#ff3030" : "#3a0a0a"; g.fillRect(bx + 140, by - 2, 3, 3);
            g.restore();
            g.drawImage(L.mid, 0, 0);
            // aerial warning lights on the masts
            for (const tw of L.towers) { const on = Math.sin(t * 2 + tw.ph) > .6; g.fillStyle = on ? "rgba(255,50,50,.95)" : "rgba(120,20,20,.4)"; g.fillRect(tw.x - 1.5, tw.y - 1.5, 3, 3); if (on) { g.fillStyle = "rgba(255,50,50,.15)"; g.beginPath(); g.arc(tw.x, tw.y, 8, 0, 7); g.fill(); } }
            // flying cars: a white headlight, a blinking blue/red light bar
            if (!still) for (const c of L.cars) { c.t += c.sp * 33; if (c.t > 1.1) { c.t = -.1; c.y = H * (.12 + Math.random() * .45); c.dir = Math.random() < .5 ? 1 : -1; }
                const cx = c.dir > 0 ? c.t * W : (1 - c.t) * W, cy = c.y + Math.sin(t + c.bob) * 4;
                g.fillStyle = "rgba(255,250,235,.95)"; g.fillRect(cx, cy, 3, 2);
                const hl = g.createRadialGradient(cx, cy, 0, cx, cy, 14); hl.addColorStop(0, "rgba(255,245,220,.35)"); hl.addColorStop(1, "rgba(255,245,220,0)"); g.fillStyle = hl; g.fillRect(cx - 14, cy - 14, 28, 28);
                g.fillStyle = (Math.floor(t * 4 + c.bob) % 2) ? "#3d7dff" : "#ff3048"; g.fillRect(cx - c.dir * 6, cy - 2, 2, 2); }
            // window flicker
            if (!still && Math.random() < .3) L.win.push({ x: Math.random() * W, y: L.hz + Math.random() * (H - L.hz), life: 30 + Math.random() * 60, c: Math.random() < .5 ? "rgba(255,196,120,.9)" : "rgba(200,235,255,.8)" });
            L.win = L.win.filter((w) => --w.life > 0); for (const w of L.win) { if (w.life % 7 < 5) { g.fillStyle = w.c; g.fillRect(w.x, w.y, 2, 2); } }
            // flare stacks
            for (let i = 0; i < L.stacks.length; i++) { const s = L.stacks[i], f = L.flares[i];
                const pf = 7 + Math.sin(t * 9 + i) * 2 + Math.sin(t * 23 + i * 3) * 1.5, pg = g.createRadialGradient(s.x, s.y - 6, 1, s.x, s.y - 6, pf * 2.4); pg.addColorStop(0, "rgba(255,230,170,.95)"); pg.addColorStop(.35, "rgba(255,140,50,.6)"); pg.addColorStop(1, "rgba(255,90,20,0)"); g.fillStyle = pg; g.beginPath(); g.arc(s.x, s.y - 6, pf * 2.4, 0, 7); g.fill();
                if (f.t0 > 0) { const a = (now - f.t0) / 2200, r = 30 + Math.sin(a * Math.PI) * 110, yy = s.y - 10 - a * 40;
                    const fb = g.createRadialGradient(s.x, yy, 2, s.x, yy, r); fb.addColorStop(0, "rgba(255,240,200," + (.9 * (1 - a)).toFixed(2) + ")"); fb.addColorStop(.25, "rgba(255,150,50," + (.7 * (1 - a)).toFixed(2) + ")"); fb.addColorStop(1, "rgba(255,90,20,0)");
                    g.fillStyle = fb; g.beginPath(); g.arc(s.x, yy, r, 0, 7); g.fill(); } }
            for (let i = 0; i < 5; i++) { const sx = (i * .23 + .07) * W, cyc = ((t / (14 + i * 3)) + i * .37) % 1, sy = H - cyc * H * .45, sr = 60 + cyc * 160;
                const st = g.createRadialGradient(sx, sy, 4, sx, sy, sr); st.addColorStop(0, "rgba(170,190,200," + (.1 * (1 - cyc)).toFixed(3) + ")"); st.addColorStop(1, "rgba(170,190,200,0)"); g.fillStyle = st; g.fillRect(sx - sr, sy - sr, sr * 2, sr * 2); }
            g.drawImage(L.near, 0, 0);
            // rain or snow
            const wx = api.flag("--mg-weather") || "rain";
            if (wx !== "dry") {
                const heavy = wx === "heavy", snow = wx === "snow", n = heavy ? L.rain.length : snow ? 160 : 200;
                g.strokeStyle = snow ? "rgba(230,240,245,.7)" : "rgba(170,205,220,1)"; g.lineWidth = 1;
                for (let i = 0; i < n; i++) { const r = L.rain[i];
                    if (!still) { r.y += snow ? r.v * .12 : r.v * (heavy ? 1.4 : 1); r.x += snow ? Math.sin(t + i) * .6 : -r.v * .18; if (r.y > H) { r.y = -r.l; r.x = Math.random() * (W + 100); } if (r.x < -20) r.x = W + 10; }
                    if (snow) { g.globalAlpha = r.a * 2.2; g.fillStyle = "rgba(235,242,248,1)"; g.fillRect(r.x, r.y, 2, 2); }
                    else { g.globalAlpha = r.a; g.beginPath(); g.moveTo(r.x, r.y); g.lineTo(r.x - r.l * .18, r.y + r.l); g.stroke(); } }
                g.globalAlpha = 1;
            }
        }
        requestAnimationFrame(frame);
        addEventListener("resize", () => { layers = null; }, { passive: true });
    }
};


/* ==========================================================================
   Shared theme engine (main Steam window).
   The theme's own config (THEME) is prepended to this file by the builder:
     THEME.name             theme name (guards against double loading)
     THEME.hud(date, ctx)   -> html string for the readout beside the menus, or null
     THEME.hudEvery         ms between readout refreshes (default 1000)
     THEME.boot()           -> { html, ms, className } for the startup screen, or null
     THEME.tilt             cover tilt strength in degrees (default 12; 0 disables)
     THEME.init(api)        theme extras; api = { flag, motion, onMove, onClick }
   Everything degrades to plain CSS if this never runs (html.mr-js gates JS styles).
   ========================================================================== */
(function () {
    "use strict";
    const KEY = "__theme_" + (THEME.name || "x").replace(/\W/g, "");
    if (window[KEY]) return;
    window[KEY] = true;

    const root = document.documentElement;
    root.classList.add("mr-js");
    const cs = () => getComputedStyle(root);
    const motion = () => { const v = parseFloat(cs().getPropertyValue("--mr-motion")); return isNaN(v) ? 1 : v; };
    const flag = (name) => cs().getPropertyValue(name).trim();
    const moveHooks = [], clickHooks = [];

    /* ---- Navigator indicator ------------------------------------------- */
    let indicator = null, lastKey = "";
    function placeIndicator(force) {
        const nav = document.querySelector(".SuperNav");
        if (!nav) return;
        if (!indicator || !nav.contains(indicator)) {
            indicator = document.createElement("div");
            indicator.className = "mr-nav-indicator";
            nav.insertBefore(indicator, nav.firstChild);
            force = true;
        }
        const sel = nav.querySelector(".SuperNavMenu.Selected > .MenuButton");
        if (!sel) { indicator.style.opacity = "0"; return; }
        const n = nav.getBoundingClientRect(), r = sel.getBoundingClientRect();
        const x = r.left - n.left, key = Math.round(x) + ":" + Math.round(r.width) + ":" + Math.round(r.top - n.top);
        if (!force && key === lastKey) return;
        const first = lastKey === "";
        lastKey = key;
        if (first) indicator.style.transition = "none";
        indicator.style.opacity = "1";
        indicator.style.top = (r.top - n.top) + "px";
        indicator.style.height = r.height + "px";
        indicator.style.width = r.width + "px";
        indicator.style.transform = "translateX(" + x + "px)";
        if (first) requestAnimationFrame(() => { indicator.style.transition = ""; });
    }

    /* ---- Cursor light + cover tilt -------------------------------------- */
    const ISLANDS = ".MainPanel, .Library > .Container > div:not(.MainPanel)";
    let pending = null, lastIsland = null, tilted = null, raf = 0;
    function resetTilt(el) {
        ["--mr-rx", "--mr-ry", "--mr-gx", "--mr-gy"].forEach((p) => el.style.removeProperty(p));
        if (tilted === el) tilted = null;
    }
    function onMove(e) {
        pending = e;
        if (raf) return;
        raf = requestAnimationFrame(() => {
            raf = 0;
            const ev = pending;
            if (!ev || !ev.target || !ev.target.closest) return;
            if (flag("--mr-cursor-light") !== "off") {
                const island = ev.target.closest(ISLANDS);
                if (lastIsland && lastIsland !== island) { lastIsland.style.removeProperty("--mr-mx"); lastIsland.style.removeProperty("--mr-my"); }
                if (island) {
                    const r = island.getBoundingClientRect();
                    island.style.setProperty("--mr-mx", (ev.clientX - r.left) + "px");
                    island.style.setProperty("--mr-my", (ev.clientY - r.top) + "px");
                }
                lastIsland = island;
            }
            const box = ev.target.closest(".LibraryItemBox");
            if (tilted && tilted !== box) resetTilt(tilted);
            const amt = THEME.tilt === undefined ? 12 : THEME.tilt;
            if (box && amt && motion() > 0 && flag("--mr-tilt") !== "off") {
                const r = box.getBoundingClientRect();
                const px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
                box.style.setProperty("--mr-ry", ((px - 0.5) * amt).toFixed(2));
                box.style.setProperty("--mr-rx", ((0.5 - py) * amt).toFixed(2));
                box.style.setProperty("--mr-gx", (px * 100).toFixed(1) + "%");
                box.style.setProperty("--mr-gy", (py * 100).toFixed(1) + "%");
                tilted = box;
            }
            for (const h of moveHooks) { try { h(ev); } catch (err) {} }
        });
    }

    /* ---- Readout beside the menus --------------------------------------- */
    function placeHud() {
        if (!THEME.hud) return;
        const bar = document.querySelector(".RootMenuBar");
        if (!bar || flag("--od-hud") === "off") return;
        let hud = bar.parentElement.querySelector(":scope > .od-hud");
        const fresh = !hud;
        if (!hud) { hud = document.createElement("div"); hud.className = "od-hud"; bar.after(hud); }
        // Steam re-renders the title bar now and then; the readout is re-added within a second,
        // while its content only refreshes at the theme's own pace.
        const now = Date.now();
        if (!fresh && now - (placeHud.at || 0) < (THEME.hudEvery || 1000)) return;
        placeHud.at = now;
        const html = THEME.hud(new Date(), { flag });
        if (html != null && (fresh || hud.__last !== html)) { hud.innerHTML = html; hud.__last = html; }
    }

    /* ---- Startup screen, once per Steam start --------------------------- */
    function bootScreen(force) {
        if (!THEME.boot || flag("--od-boot") === "off" || motion() === 0) return;
        const k = "boot-" + KEY;
        if (!force) { try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch (e) {} }
        const b = THEME.boot();
        if (!b) return;
        const el = document.createElement("div");
        el.className = "od-boot " + (b.className || "");
        el.innerHTML = b.html;
        document.body.appendChild(el);
        if (b.after) { try { b.after(el); } catch (e) {} }
        setTimeout(() => el.remove(), b.ms || 3000);
    }

    function start() {
        document.addEventListener("pointermove", onMove, { passive: true });
        document.addEventListener("pointerleave", () => { if (tilted) resetTilt(tilted); }, { passive: true });
        document.addEventListener("click", (e) => { for (const h of clickHooks) { try { h(e); } catch (err) {} } }, true);
        window.addEventListener("resize", () => placeIndicator(true), { passive: true });
        let queued = false;
        new MutationObserver(() => {
            if (queued) return;
            queued = true;
            requestAnimationFrame(() => { queued = false; placeIndicator(false); });
        }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => placeIndicator(true));
            setInterval(() => { const nav = document.querySelector(".SuperNav"); if (nav && !nav.__mrRO) { nav.__mrRO = true; ro.observe(nav); } }, 1500);
        }
        placeHud();
        setInterval(placeHud, Math.min(1000, THEME.hudEvery || 1000));
        bootScreen(false);
        window.__themeReplayBoot = () => bootScreen(true);
        placeIndicator(true);
        setTimeout(() => placeIndicator(true), 600);
        if (THEME.init) {
            try {
                THEME.init({ flag, motion, root, onMove: (f) => moveHooks.push(f), onClick: (f) => clickHooks.push(f) });
            } catch (e) { console.warn("[theme] init failed", e); }
        }
    }
    if (document.body) start();
    else document.addEventListener("DOMContentLoaded", start, { once: true });
})();
