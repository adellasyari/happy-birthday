document.addEventListener('DOMContentLoaded', () => {
  try {
    // --- Utilities -------------------------------------------------
    window.tutupModal = function (id) {
      try {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add('hidden');
        el.classList.remove('activate');
        console.log('[ui] tutupModal:', id);
      } catch (err) {
        console.warn('tutupModal error', err);
      }
    };

    // Hide loading screen after 3.5s
    setTimeout(() => {
      try {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
          loadingScreen.classList.add('hidden');
          console.log('Timeout: menambahkan class .hidden ke #loading-screen');
        }
      } catch (err) { console.error('Error saat mencoba menyembunyikan loading screen:', err); }
    }, 3500);

    // --- Shared content -------------------------------------------------
    // Shared message used for the gift (keep as original birthday text)
    const sharedMessage = `happy birthday ya ndutt

  nggak kerasa sekarang kamu udah 21 tahun aja. semoga di umur yang baru ini kamu jadi pribadi yang makin dewasa, makin kuat ngejalanin semuanya, dan semua yang kamu cita-citain bisa pelan-pelan tercapai.

  aku cuma mau bilang, terima kasih udah jadi bagian dari hidup aku sampai sekarang. makasih juga udah selalu ada, sabar, dan nerima aku apa adanya. semoga ke depannya kita bisa terus bareng-bareng, saling support, dan tumbuh jadi versi terbaik dari diri kita masing-masing.

  semoga hari ini kamu bahagia, dapet banyak hal baik, dan selalu dikelilingi orang-orang yang sayang sama kamu (termasuk aku).

  lov u, selalu

  - adell`;

    // Final card message (show only in modal-final)
    const finalMessage = `happy anniversary ya ndutt 🤍

  nggak kerasa ya, dari 2024 sampai sekarang 2026 kita masih bareng-bareng. banyak banget hal yang udah kita lewatin, dari yang seneng banget sampai yang kadang bikin capek juga, tapi kita masih tetep milih buat stay.

  aku cuma mau bilang, terima kasih ya udah bertahan sejauh ini sama aku. makasih udah selalu ada, nemenin aku, dan nggak ninggalin aku walaupun aku banyak kurangnya.

  semoga ke depannya kita bisa terus bareng, lebih dewasa, lebih ngerti satu sama lain, dan bisa ngelewatin apa pun yang ada di depan kita.

  aku harap hubungan kita nggak cuma sampai di sini, tapi bisa terus jalan lebih lama lagi.

  lov u, selalu

  - adell`;

    // Ensure modal-final shows finalMessage immediately (covers cached HTML)
    try {
      const modalFinal = document.getElementById('modal-final');
      if (modalFinal) {
        const cardContent = modalFinal.querySelector('.card-content');
        if (cardContent) {
          const paragraphs = finalMessage.split(/\n\s*\n/).map(p => p.replace(/</g,'&lt;').trim()).filter(Boolean);
          cardContent.innerHTML = paragraphs.map(p => `<p>${p.replace(/\n/g,'<br>')}</p>`).join('');
        }
      }
    } catch (err) { console.warn('Could not set modal-final content on load', err); }

    // bagianKado as requested by user (exact items)
    const bagianKado = ['gift','Cube','Bow','Knot','tape','up','down','Tape_Vertical','Tape_Horizontal','Group 2','Rectangle 2'];

    // --- Spline event attachment & handler ----------------------------
    function attachSplineListener(viewer) {
      if (!viewer) return;
      try {
        console.log('Memasang listener pada <spline-viewer> (fallback berlapis untuk diagnosis)');

        const tryHandleEvent = (e, label) => {
          try {
            console.log(`[spline-event:${label}]`, e && e.detail ? e.detail : e);
            let name = e && e.detail ? e.detail.name : null;

            if (!name) {
              // diagnostic: scan composedPath for possible identifiers
              try {
                const path = (e.composedPath && typeof e.composedPath === 'function') ? e.composedPath() : [];
                console.log('[diagnostic] event has no detail.name — scanning composedPath (first 12 items)');
                for (const node of path.slice(0, 12)) {
                  try {
                    if (!node) continue;
                    if (node.dataset && node.dataset.name) { name = node.dataset.name; break; }
                    if (node.getAttribute) {
                      const a = node.getAttribute('name') || node.getAttribute('data-name');
                      if (a) { name = a; break; }
                    }
                    if (node && node.name && typeof node.name === 'string') { name = node.name; break; }
                  } catch (_){}
                }
              } catch (diagErr) { console.warn('diagnostic scan failed', diagErr); }
            }

            if (!name) return;
            console.log('Nama objek terklik:', name);
            const lower = String(name).toLowerCase();
            const isRedGift = bagianKado.map(x => String(x).toLowerCase()).includes(lower) || lower.includes('gift') || lower.includes('red') || name === 'Cube';
            if (isRedGift) { openGiftModal(name); return; }
            if (lower === 'cake' || lower.includes('cake')) { openCakeModal(name); return; }
          } catch (handlerErr) { console.error('Error di handler spline event:', handlerErr); }
        };

        // register several event names (include kebab-case 'mouse-down')
        const eventNames = ['mouseDown','mouse-down','pointerdown','mousedown','click'];
        eventNames.forEach(evName => {
          try { viewer.addEventListener(evName, (ev) => tryHandleEvent(ev, evName), { capture: true }); }
          catch (err) { /* ignore */ }
        });

        // region fallback (pointerdown) if Spline doesn't provide detail.name
        const regionHandler = (e) => {
          try {
            if (e.button && e.button !== 0) return;
            const rect = viewer.getBoundingClientRect ? viewer.getBoundingClientRect() : null;
            if (!rect) return;
            const cx = e.clientX - rect.left; const cy = e.clientY - rect.top;
            const nx = cx / rect.width; const ny = cy / rect.height;
            console.log('[region-pointerdown] normalized coords:', { nx: nx.toFixed(3), ny: ny.toFixed(3) });

            const activeModal = document.querySelector('.modal.activate, .modal:not(.hidden)');
            if (activeModal) return;

            const giftRegion = { xMin: 0.60, xMax: 0.92, yMin: 0.10, yMax: 0.62 };
            const cakeRegion = { xMin: 0.08, xMax: 0.40, yMin: 0.56, yMax: 0.86 };

            if (nx >= giftRegion.xMin && nx <= giftRegion.xMax && ny >= giftRegion.yMin && ny <= giftRegion.yMax) { console.log('[region] gift'); openGiftModal('region'); }
            else if (nx >= cakeRegion.xMin && nx <= cakeRegion.xMax && ny >= cakeRegion.yMin && ny <= cakeRegion.yMax) { console.log('[region] cake'); openCakeModal('region'); }
          } catch (err) { console.error('Error di region pointerdown handler:', err); }
        };
        document.addEventListener('pointerdown', regionHandler, { capture: true });
      } catch (attachErr) { console.error('Gagal memasang listener pada viewer:', attachErr); }
    }

    // wait for spline-viewer or observe
    const splineEl = document.querySelector('spline-viewer');
    if (splineEl) { attachSplineListener(splineEl); createRegionOverlays(splineEl); }
    else {
      const mo = new MutationObserver((records, obs) => {
        const found = document.querySelector('spline-viewer');
        if (found) { console.log('MutationObserver: menemukan <spline-viewer> — memasang listener'); attachSplineListener(found); createRegionOverlays(found); obs.disconnect(); }
      });
      mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
    }

    // --- Overlays to ensure clickable areas when Spline is unreliable --------
    function createRegionOverlays(viewer) {
      try {
        if (!viewer) return;
        ['overlay-gift','overlay-cake'].forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
        const giftOverlay = document.createElement('div'); giftOverlay.id = 'overlay-gift';
        const cakeOverlay = document.createElement('div'); cakeOverlay.id = 'overlay-cake';
        [giftOverlay,cakeOverlay].forEach(o => {
          Object.assign(o.style, { position:'fixed', background:'transparent', border:'0', zIndex:2147483647, cursor:'pointer', pointerEvents:'auto', touchAction:'manipulation' });
          document.body.appendChild(o);
        });

        const centers = { gift:{nx:0.85,ny:0.37,w:0.18,h:0.18}, cake:{nx:0.36,ny:0.64,w:0.10,h:0.12} };

        function positionOverlays(){
          try {
            const rect = viewer.getBoundingClientRect(); if (!rect || rect.width===0) return;
            const g = centers.gift, c = centers.cake;
            const gw = rect.width * g.w, gh = rect.height * g.h;
            const gx = rect.left + rect.width * g.nx - gw/2, gy = rect.top + rect.height * g.ny - gh/2;
            Object.assign(giftOverlay.style, { left: `${gx}px`, top: `${gy}px`, width:`${gw}px`, height:`${gh}px` });
            const cw = rect.width * c.w, ch = rect.height * c.h;
            const cx = rect.left + rect.width * c.nx - cw/2, cy = rect.top + rect.height * c.ny - ch/2;
            Object.assign(cakeOverlay.style, { left: `${cx}px`, top: `${cy}px`, width:`${cw}px`, height:`${ch}px` });
          } catch (err) { console.warn('positionOverlays error', err); }
        }

        const onGift = (ev) => { try { ev.preventDefault(); ev.stopPropagation(); console.log('[overlay-click] gift', ev.type); openGiftModal('overlay'); } catch(_){} };
        const onCake = (ev) => { try { ev.preventDefault(); ev.stopPropagation(); console.log('[overlay-click] cake', ev.type); openCakeModal('overlay'); } catch(_){} };
        giftOverlay.addEventListener('pointerdown', onGift); giftOverlay.addEventListener('click', onGift); giftOverlay.addEventListener('touchstart', onGift, { passive:false });
        cakeOverlay.addEventListener('pointerdown', onCake); cakeOverlay.addEventListener('click', onCake); cakeOverlay.addEventListener('touchstart', onCake, { passive:false });

        window.addEventListener('resize', positionOverlays); window.addEventListener('scroll', positionOverlays, true);
        const intervalId = setInterval(positionOverlays, 500); setTimeout(positionOverlays, 50);
        const mo2 = new MutationObserver((recs, obs) => { if (!document.contains(viewer)) { giftOverlay.remove(); cakeOverlay.remove(); clearInterval(intervalId); obs.disconnect(); } });
        mo2.observe(document.documentElement || document.body, { childList:true, subtree:true });
      } catch (err) { console.error('createRegionOverlays error', err); }
    }

    // --- Modal openers that use sharedMessage --------------------------
    function openGiftModal(sourceName) {
      try {
        const modal = document.getElementById('modal-gift');
        if (!modal) return console.warn('openGiftModal: #modal-gift tidak ditemukan');
        const textarea = modal.querySelector('#gift-message');
        if (textarea) { textarea.value = sharedMessage; textarea.readOnly = true; textarea.style.whiteSpace = 'pre-wrap'; }
        else {
          const contentArea = modal.querySelector('.glass') || modal.querySelector('.modal-content') || modal;
          contentArea.innerHTML = `<div class="letter-content" style="white-space:pre-wrap;">${sharedMessage.replace(/</g,'&lt;')}</div>`;
        }
        // remove send/cancel buttons if present
        try { const buttons = modal.querySelectorAll('button'); buttons.forEach(b => { const t = (b.textContent||'').trim().toLowerCase(); if (['kirim','batal','send','cancel','kirimkan'].includes(t)) b.remove(); }); } catch(_){}
        modal.classList.remove('hidden'); modal.classList.add('activate'); console.log('openGiftModal: menampilkan modal (sumber:', sourceName || 'fallback', ')');
      } catch (err) { console.error('openGiftModal error:', err); }
    }

    function openCakeModal(sourceName) {
      try {
        const modalIds = ['modal-final','modal-cake','modal-gift'];
        let modal = null; for (const id of modalIds) { const m = document.getElementById(id); if (m) { modal = m; break; } }
        if (!modal) return console.warn('openCakeModal: tidak menemukan modal untuk cake');
        const titleEl = modal.querySelector('h2') || modal.querySelector('.modal-title'); if (titleEl) titleEl.textContent = 'Kartu ucapan';
        const cardContent = modal.querySelector('.card-content');
        if (cardContent) {
          const messageToUse = (modal.id === 'modal-final') ? finalMessage : sharedMessage;
          const paragraphs = messageToUse.split(/\n\s*\n/).map(p => p.replace(/</g,'&lt;').trim()).filter(Boolean);
          cardContent.innerHTML = paragraphs.map(p => `<p>${p.replace(/\n/g,'<br>')}</p>`).join('');
        } else {
          const textarea = modal.querySelector('#gift-message');
          if (textarea) { textarea.value = sharedMessage; textarea.readOnly = true; textarea.style.whiteSpace = 'pre-wrap'; }
          else {
            const contentArea = modal.querySelector('.glass') || modal.querySelector('.modal-content') || modal;
            const existing = contentArea.querySelector('.cake-message');
            if (existing) existing.textContent = sharedMessage; else contentArea.insertAdjacentHTML('beforeend', `<div class="cake-message" style="white-space:pre-wrap;margin-top:12px;">${sharedMessage.replace(/</g,'&lt;')}</div>`);
          }
        }
        try { const buttons = modal.querySelectorAll('button'); buttons.forEach(b => { const t=(b.textContent||'').trim().toLowerCase(); if (['kirim','batal','send','cancel'].includes(t)) b.remove(); }); } catch(_){}
        modal.classList.remove('hidden'); modal.classList.add('activate'); console.log('openCakeModal: menampilkan kartu (sumber:', sourceName || 'event', ')');
      } catch (err) { console.error('openCakeModal error:', err); }
    }

    // --- Close handlers ------------------------------------------------
    function attachCloseHandlersFor(modalId) {
      const modal = document.getElementById(modalId); if (!modal) return;
      const specific = modal.querySelector('#close-gift-btn') || modal.querySelector('#close-cake-btn') || modal.querySelector('.close-btn');
      if (specific) specific.addEventListener('click', () => { modal.classList.add('hidden'); modal.classList.remove('activate'); console.log(`#${modalId} disembunyikan oleh tombol tutup`); });
      const fallbackBtns = modal.querySelectorAll('.btn-close, [data-close], .modal .btn');
      if (fallbackBtns && fallbackBtns.length) { fallbackBtns.forEach(b => b.addEventListener('click', () => { modal.classList.add('hidden'); modal.classList.remove('activate'); })); }
    }
    ['modal-gift','modal-cake','modal-final'].forEach(id => attachCloseHandlersFor(id));

    // explicit close-x for modal-final
    try {
      const closeXBtn = document.getElementById('close-x-btn'); const modalFinal = document.getElementById('modal-final');
      if (closeXBtn && modalFinal) closeXBtn.addEventListener('click', () => { modalFinal.classList.add('hidden'); modalFinal.classList.remove('activate'); console.log('[ui] close-x clicked — modal-final hidden'); });
    } catch (_){}

    // delegated fallback
    try {
      document.addEventListener('click', (ev) => {
        try {
          const t = ev.target; if (!t) return; const btn = (t.id === 'close-x-btn') ? t : (t.closest ? t.closest('#close-x-btn') : null);
          if (btn) { const modalFinal = document.getElementById('modal-final'); if (modalFinal) { modalFinal.classList.add('hidden'); modalFinal.classList.remove('activate'); console.log('[ui] delegated close-x clicked — modal-final hidden'); } }
        } catch (inner) {}
      }, true);
    } catch (_){}

  } catch (err) { console.error('Inisialisasi script gagal:', err); }
});

/* End of script */
