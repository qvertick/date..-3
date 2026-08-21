(function () {
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const buttonsWrap = document.getElementById('buttonsWrap');
  const resultScreen = document.getElementById('resultScreen');
  const resultText = document.getElementById('resultText');
  const resultEmoji = document.getElementById('resultEmoji');
  const counterEl = document.getElementById('counter');

  let dodgeCount = 0;
  const maxDodges = 6;
  let converted = false;
  let scale = 1;

  const phrases = [
    "УДАЧКИ ПОЙМАТЬ ))",
    "мимо! 😂",
    "не в этой жизни",
    "кнопка запаниковала",
    "ещё чуть чуть",
    "последний забег..."
  ];

  // cooldown считаем по временной метке, а не таймером —
  // надёжнее при подвисании вкладки/анимаций
  let lastDodgeTime = 0;
  const dodgeCooldown = 380; // чуть больше, чем длительность CSS-перехода

  // кэшируем размеры вьюпорта, обновляем только по resize —
  // не дёргаем layout на каждый прыжок
  let vw = window.innerWidth;
  let vh = window.innerHeight;

  // "домашняя" точка — исходное место кнопки. Все прыжки считаются
  // от неё, а НЕ от предыдущего прыжка — иначе за несколько попыток
  // подряд смещения складываются и кнопку уносит хрен пойми куда
  let homeX = null;
  let homeY = null;

  function nearHome(width, height) {
    const padding = 20;
    const maxX = vw - width - padding;
    const maxY = vh - height - padding;

    const radius = 190; // максимальное отклонение от домашней точки

    let x = homeX + (Math.random() * 2 - 1) * radius;
    let y = homeY + (Math.random() * 2 - 1) * radius;

    x = Math.min(Math.max(padding, x), Math.max(padding, maxX));
    y = Math.min(Math.max(padding, y), Math.max(padding, maxY));

    return { x, y };
  }

  function applyTransform(x, y, s, rotDeg) {
    noBtn.style.transform = `translate(${x}px, ${y}px) scale(${s}) rotate(${rotDeg}deg)`;
  }

  function jumpToNewSpot() {
    const width = noBtn.offsetWidth;
    const height = noBtn.offsetHeight;
    const pos = nearHome(width, height);
    const rot = (Math.random() * 20 - 10).toFixed(1);
    applyTransform(pos.x, pos.y, scale, rot);
  }

  function dodge() {
    if (converted) return;

    const now = performance.now();
    if (now - lastDodgeTime < dodgeCooldown) return; // игнорим повторные триггеры, пока летим
    lastDodgeTime = now;

    dodgeCount++;

    // первые 3 промаха — кнопка просто бегает, размер не трогаем
    // с 4-го промаха начинает подсаживаться
    if (dodgeCount <= 3) {
      scale = 1;
    } else {
      scale = Math.max(0.55, 1 - (dodgeCount - 3) * 0.13);
    }

    if (!noBtn.classList.contains('fixed-fly')) {
      // первый прыжок: сначала "замораживаем" кнопку ровно на её текущем
      // визуальном месте через translate — иначе position:fixed и смена
      // координат в один кадр = рывок без анимации.
      // Эта же точка становится "домом" для всех будущих прыжков.
      const rect = noBtn.getBoundingClientRect();
      homeX = rect.left;
      homeY = rect.top;

      noBtn.classList.add('fixed-fly');
      noBtn.style.transition = 'none';
      applyTransform(homeX, homeY, 1, 0);

      // ждём кадр, чтобы браузер зафиксировал стартовую точку,
      // и только потом включаем transition и летим дальше
      requestAnimationFrame(() => {
        noBtn.style.transition = '';
        requestAnimationFrame(jumpToNewSpot);
      });
    } else {
      jumpToNewSpot();
    }

    if (dodgeCount < maxDodges) {
      counterEl.textContent = phrases[Math.min(dodgeCount - 1, phrases.length - 1)];
    }

    if (dodgeCount >= maxDodges) {
      convertButton();
    }
  }

  function convertButton() {
    converted = true;
    noBtn.textContent = 'СДАЕШЬСЯ?';
    noBtn.classList.add('converted');
    noBtn.classList.remove('fixed-fly');
    noBtn.style.transform = '';
    counterEl.textContent = 'сопротивление было бесполезно';

    noBtn.addEventListener('click', () => showResult(true));
  }

  // pointer events покрывают и мышь, и тач одним кодом —
  // не плодим mouseenter/touchstart/click по отдельности
  noBtn.addEventListener('pointerenter', function (e) {
    if (converted) return;
    if (e.pointerType !== 'mouse') return; // хавер имеет смысл только для мыши
    dodge();
  });

  noBtn.addEventListener('pointerdown', function (e) {
    if (converted) return;
    e.preventDefault();
    dodge();
  });

  yesBtn.addEventListener('click', () => showResult(false));

  function showResult(wasForced) {
    buttonsWrap.style.display = 'none';
    counterEl.style.display = 'none';

    if (wasForced) {
      resultEmoji.textContent = '🔥🎉';
      resultText.textContent = 'ХОРОШАЯ ПОПЫТКА ) ДО ВСТРЕЧИ!';
    } else {
      resultEmoji.textContent = '🎉';
      resultText.textContent = 'Я ТАК И ЗНАЛ, ЧТО ТЫ СОГЛАСИШЬСЯ :3';
    }

    resultScreen.classList.add('show');
    launchConfetti();
  }

  function launchConfetti() {
    const colors = ['#39ff14', '#ff9100', '#c9c9c9', '#555555', '#ffffff'];
    const shapes = ['🔥', '💪', '😎', '🍺', '⚡'];
    const count = 70;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + 'vw';
        const duration = 2 + Math.random() * 2;
        piece.style.animationDuration = duration + 's';

        if (Math.random() > 0.5) {
          piece.textContent = shapes[Math.floor(Math.random() * shapes.length)];
          piece.style.fontSize = (14 + Math.random() * 14) + 'px';
        } else {
          piece.style.background = colors[Math.floor(Math.random() * colors.length)];
          piece.style.border = '2px solid #000';
        }

        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), duration * 1000 + 200);
      }, i * 25);
    }
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      vw = window.innerWidth;
      vh = window.innerHeight;

      if (noBtn.classList.contains('fixed-fly') && !converted && homeX !== null) {
        const width = noBtn.offsetWidth;
        const height = noBtn.offsetHeight;
        const maxX = vw - width - 12;
        const maxY = vh - height - 12;
        homeX = Math.min(Math.max(12, homeX), Math.max(12, maxX));
        homeY = Math.min(Math.max(12, homeY), Math.max(12, maxY));
        applyTransform(homeX, homeY, scale, 0);
      }
    }, 120);
  });
})();
