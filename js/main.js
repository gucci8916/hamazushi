/* ============================================================
   浜寿し打越店 ― 共通スクリプト
   既存機能をすべて維持しつつ、以下を強化：
   - ヘッダーのスクロール連動（トップページで透過→墨色）
   - タブの矢印キー操作（WAI-ARIA準拠）＋選択タブの自動スクロール
   - ギャラリーのタブ非表示時停止 / reduced-motion 時は自動再生オフ
============================================================ */
(() => {
  'use strict';

  /* ----------------------------------------
     ページを開いた瞬間は必ず一番上から始める
     （ブラウザの自動スクロール位置復元により、
     再読み込み時にヘッダーが墨色のまま表示されるのを防ぐ）
  ---------------------------------------- */
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  if (!window.location.hash) {
    window.scrollTo(0, 0);
  }

  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------
     ヘッダー：スクロールで墨色に（トップのみ効果あり）
  ---------------------------------------- */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ----------------------------------------
     ハンバーガーメニュー開閉
  ---------------------------------------- */
  const hamburger = document.getElementById('navHamburger');
  const drawer = document.getElementById('navDrawer');

  if (hamburger && drawer) {
    const closeDrawer = () => {
      hamburger.classList.remove('is-open');
      drawer.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'メニューを開く');
      document.body.style.overflow = '';
    };

    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('is-open');
      drawer.classList.toggle('is-open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      hamburger.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    drawer.querySelectorAll('.nav-drawer-link, .drawer-tel').forEach((link) => {
      link.addEventListener('click', closeDrawer);
    });

    // Escキーで閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeDrawer();
        hamburger.focus();
      }
    });
  }

  /* ----------------------------------------
     メニュータブ切替（クリック＋矢印キー）
  ---------------------------------------- */
  const tabs = Array.from(document.querySelectorAll('.menu-tab'));
  const panels = document.querySelectorAll('.menu-panel');

  if (tabs.length) {
    const activateTab = (tab) => {
      tabs.forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });
      panels.forEach((p) => p.classList.remove('is-active'));

      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');

      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) panel.classList.add('is-active');

      // 選択タブを見える位置へ（横スクロールタブ用）
      tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    };

    tabs.forEach((tab, i) => {
      tab.setAttribute('tabindex', tab.classList.contains('is-active') ? '0' : '-1');

      tab.addEventListener('click', () => activateTab(tab));

      tab.addEventListener('keydown', (e) => {
        let next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') next = tabs[0];
        if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) {
          e.preventDefault();
          activateTab(next);
          next.focus();
        }
      });
    });
  }

  /* ----------------------------------------
     スクロールアニメーション（IntersectionObserver）
  ---------------------------------------- */
  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealElements.forEach((el) => el.classList.add('is-visible'));
    } else {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              revealObserver.unobserve(entry.target); // 一度表示したら監視解除
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );
      revealElements.forEach((el) => revealObserver.observe(el));
    }
  }

  /* ----------------------------------------
     ギャラリー：フェード切替・ループ・自動再生・スワイプ
  ---------------------------------------- */
  const galleryTrack = document.getElementById('galleryTrack');
  if (galleryTrack) {
    const slides = galleryTrack.querySelectorAll('.gallery-slide');
    const dots = document.querySelectorAll('.gallery-dot');
    const prevBtn = document.getElementById('galleryPrev');
    const nextBtn = document.getElementById('galleryNext');
    const viewport = document.querySelector('.gallery-viewport');

    let currentIndex = 0;
    let autoplayTimer = null;

    const showSlide = (index) => {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;

      slides[currentIndex].classList.remove('is-active');
      dots[currentIndex]?.classList.remove('is-active');

      currentIndex = index;

      slides[currentIndex].classList.add('is-active');
      dots[currentIndex]?.classList.add('is-active');
    };

    const nextSlide = () => showSlide(currentIndex + 1);
    const prevSlide = () => showSlide(currentIndex - 1);

    const stopAutoplay = () => {
      if (autoplayTimer) clearInterval(autoplayTimer);
      autoplayTimer = null;
    };
    const startAutoplay = () => {
      stopAutoplay();
      if (prefersReducedMotion) return; // 動きを減らす設定では自動再生しない
      autoplayTimer = setInterval(nextSlide, 5000);
    };

    prevBtn?.addEventListener('click', () => { prevSlide(); startAutoplay(); });
    nextBtn?.addEventListener('click', () => { nextSlide(); startAutoplay(); });

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        showSlide(parseInt(dot.dataset.index, 10));
        startAutoplay();
      });
    });

    // スワイプ対応
    let touchStartX = 0;
    viewport?.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    viewport?.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        diff > 0 ? nextSlide() : prevSlide();
        startAutoplay();
      }
    }, { passive: true });

    // タブが非表示のあいだは停止（無駄な処理を省く）
    document.addEventListener('visibilitychange', () => {
      document.hidden ? stopAutoplay() : startAutoplay();
    });

    startAutoplay();
  }

  /* ----------------------------------------
     お知らせ「もっと見る」（4件以上あるとき自動表示）
  ---------------------------------------- */
  (() => {
    const list = document.getElementById('newsList');
    const btn = document.getElementById('newsMoreBtn');
    if (!list || !btn) return;

    const items = Array.from(list.querySelectorAll('.news-item'));
    const visible = parseInt(list.dataset.visible || '3', 10);
    if (items.length <= visible) { btn.hidden = true; return; }

    items.forEach((el, i) => { if (i >= visible) el.classList.add('news-hidden'); });
    btn.hidden = false;

    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      items.forEach((el, i) => {
        if (i >= visible) el.classList.toggle('news-hidden', expanded);
      });
      btn.setAttribute('aria-expanded', String(!expanded));
      btn.textContent = expanded ? 'もっと見る' : '閉じる';
    });
  })();

  /* ----------------------------------------
     現在ページのナビリンクを強調
  ---------------------------------------- */
  (() => {
    const page = document.body.dataset.page;
    if (!page) return;
    document.querySelectorAll(`[data-nav="${page}"]`).forEach((a) => {
      a.classList.add('is-active');
      a.setAttribute('aria-current', 'page');
    });
  })();

  /* ----------------------------------------
     法要ページ：クーポンだけを印刷
  ---------------------------------------- */
  (() => {
    const printBtn = document.getElementById('houyouCouponPrint');
    if (!printBtn) return;
    printBtn.addEventListener('click', () => window.print());
  })();

  /* ----------------------------------------
     お品書き・ご法要：料理写真をタップで拡大表示（専務ご指摘対応）
     表示は軽量なWebPサムネイル、拡大時のみ data-full の高画質JPGを読み込む
     対象：.menu-panel / .menu-photo-grid 内のすべての img（ロゴ・クーポン等は対象外）
  ---------------------------------------- */
  (() => {
    const photos = document.querySelectorAll('.menu-panel img, .menu-photo-grid img');
    if (!photos.length) return;

    // ライトボックスのDOMを1つだけ生成
    const overlay = document.createElement('div');
    overlay.className = 'photo-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '写真拡大表示');
    overlay.innerHTML = `
      <button type="button" class="photo-lightbox-close" aria-label="閉じる">&times;</button>
      <img class="photo-lightbox-img" src="" alt="">
      <p class="photo-lightbox-caption"></p>
    `;
    document.body.appendChild(overlay);

    const imgEl = overlay.querySelector('.photo-lightbox-img');
    const captionEl = overlay.querySelector('.photo-lightbox-caption');
    const closeBtn = overlay.querySelector('.photo-lightbox-close');

    function openLightbox(fullSrc, thumbSrc, alt) {
      // まずサムネイルを即表示（体感を軽く）、高画質版を裏で読み込んで差し替え
      imgEl.src = thumbSrc;
      imgEl.alt = alt || '';
      captionEl.textContent = alt || '';
      overlay.classList.add('is-open');
      overlay.classList.add('is-loading');
      document.body.classList.add('lightbox-open');

      if (fullSrc && fullSrc !== thumbSrc) {
        const hiRes = new Image();
        hiRes.onload = () => {
          imgEl.src = fullSrc;
          overlay.classList.remove('is-loading');
        };
        hiRes.onerror = () => { overlay.classList.remove('is-loading'); };
        hiRes.src = fullSrc;
      } else {
        overlay.classList.remove('is-loading');
      }
    }
    function closeLightbox() {
      overlay.classList.remove('is-open');
      document.body.classList.remove('lightbox-open');
      imgEl.src = '';
    }

    photos.forEach((img) => {
      img.classList.add('is-zoomable');
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', (img.alt || '写真') + 'を拡大表示');
      const fullSrc = img.dataset.full || img.src;
      img.addEventListener('click', () => openLightbox(fullSrc, img.src, img.alt));
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(fullSrc, img.src, img.alt); }
      });
    });

    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeLightbox();
    });
  })();
})();
