// game-presque-doubles.js — Game 5: Near-doubles addition strategy

var Game5 = (function() {
  var currentPair = null; // { a, b, small, big }
  var score = 0;
  var answered = false;
  var currentLevel = null; // 'guided', 'semi', 'independent'
  var warmupLeft = 0; // warmup doubles rounds remaining (Level 1 only)
  var animTimers = []; // track animation timeouts for cleanup

  function init() {
    score = 0;
    updateScore();
    showLevels();
  }

  function clearTimers() {
    animTimers.forEach(function(t) { clearTimeout(t); });
    animTimers = [];
  }

  function showLevels() {
    clearTimers();
    var levels = document.getElementById('game5-levels');
    var play = document.getElementById('game5-play');
    if (levels) levels.classList.remove('hidden');
    if (play) play.classList.add('hidden');
  }

  function startLevel(levelKey) {
    currentLevel = levelKey;
    warmupLeft = (levelKey === 'guided') ? 3 : 0;

    var levels = document.getElementById('game5-levels');
    var play = document.getElementById('game5-play');
    var titleEl = document.getElementById('game5-level-title');

    if (levels) levels.classList.add('hidden');
    if (play) play.classList.remove('hidden');

    var titles = {
      guided: '🐣 Avec aide',
      semi: '🦊 Un peu d\'aide',
      independent: '🦅 Tout seul !'
    };
    if (titleEl) titleEl.textContent = titles[levelKey] || '';

    nextRound();
  }

  function generatePair() {
    var small = 1 + Math.floor(Math.random() * 9); // 1-9
    var big = small + 1;
    if (Math.random() < 0.5) {
      return { a: big, b: small, small: small, big: big };
    }
    return { a: small, b: big, small: small, big: big };
  }

  function nextRound() {
    clearTimers();
    answered = false;

    var feedbackEl = document.getElementById('game5-feedback');
    var nextBtn = document.getElementById('game5-next');
    var validateBtn = document.getElementById('game5-validate');

    if (feedbackEl) { feedbackEl.textContent = ''; feedbackEl.className = 'feedback'; }
    if (nextBtn) nextBtn.classList.add('hidden');
    if (validateBtn) validateBtn.classList.remove('hidden');

    if (warmupLeft > 0) {
      setupWarmup();
    } else {
      currentPair = generatePair();
      if (currentLevel === 'guided') setupGuided();
      else if (currentLevel === 'semi') setupSemi();
      else setupIndependent();
    }
  }

  // ─── Warmup: pure doubles ───
  function setupWarmup() {
    var num = 1 + Math.floor(Math.random() * 10); // 1-10
    currentPair = { a: num, b: num, small: num, big: num, isWarmup: true };

    var cubeArea = document.getElementById('game5-cube-area');
    var eqArea = document.getElementById('game5-equation-area');
    var decompArea = document.getElementById('game5-decomp-area');
    var inputArea = document.getElementById('game5-input-area');

    if (cubeArea) { cubeArea.innerHTML = ''; cubeArea.classList.remove('hidden'); }
    if (decompArea) { decompArea.innerHTML = ''; decompArea.classList.add('hidden'); }

    if (cubeArea) {
      cubeArea.innerHTML = renderCubeArea(num, num, false);
    }

    if (eqArea) {
      eqArea.innerHTML =
        '<span class="eq-num eq-blue">' + num + '</span>' +
        '<span class="eq-op">+</span>' +
        '<span class="eq-num eq-blue">' + num + '</span>' +
        '<span class="eq-op">=</span>';
    }

    if (inputArea) {
      inputArea.innerHTML =
        '<input id="game5-answer" class="answer-input" type="number" min="0" max="40" placeholder="?">';
      var inp = document.getElementById('game5-answer');
      if (inp) setTimeout(function() { inp.focus(); }, 150);
    }

    var instrEl = document.getElementById('game5-instruction');
    if (instrEl) instrEl.textContent = 'Calcule le double ! (' + (4 - warmupLeft) + '/3)';
  }

  // ─── Level 1: Guided ───
  function setupGuided() {
    var small = currentPair.small;
    var big = currentPair.big;

    var cubeArea = document.getElementById('game5-cube-area');
    var eqArea = document.getElementById('game5-equation-area');
    var decompArea = document.getElementById('game5-decomp-area');
    var inputArea = document.getElementById('game5-input-area');
    var instrEl = document.getElementById('game5-instruction');

    if (instrEl) instrEl.textContent = 'Regarde bien la décomposition, puis donne le résultat !';

    // Step 1: Show cubes unseparated + equation with ?
    if (cubeArea) {
      cubeArea.classList.remove('hidden');
      cubeArea.innerHTML = renderCubeArea(currentPair.a, currentPair.b, false);
    }

    if (eqArea) {
      eqArea.innerHTML =
        '<span class="eq-num eq-blue">' + currentPair.a + '</span>' +
        '<span class="eq-op">+</span>' +
        '<span class="eq-num eq-blue">' + currentPair.b + '</span>' +
        '<span class="eq-op">=</span>' +
        '<span class="eq-num eq-placeholder eq-pulse">?</span>';
    }

    if (decompArea) {
      decompArea.innerHTML = '';
      decompArea.classList.remove('hidden');
    }

    if (inputArea) { inputArea.innerHTML = ''; }

    // Step 2: After 1.5s — separate cubes + show tree decomposition
    animTimers.push(setTimeout(function() {
      // Re-render cubes with separation (orange cube on correct side)
      if (cubeArea) {
        cubeArea.innerHTML = renderCubeArea(currentPair.a, currentPair.b, true);
      }
      // Show tree decomposition with staged animation
      if (decompArea) {
        decompArea.innerHTML = renderTreeDecomp(big, small);
      }
    }, 1500));

    // Step 3: After 3.5s — highlight doubles + show equation result
    animTimers.push(setTimeout(function() {
      highlightDoubles();

      // Highlight the matching number in tree decomposition
      if (decompArea) {
        var treeLeft = decompArea.querySelector('.tree-left');
        if (treeLeft) treeLeft.classList.add('tree-highlighted');
      }

      // Update equation with double result
      if (eqArea) {
        var doubleResult = small * 2;
        eqArea.innerHTML =
          '<span class="eq-num eq-blue">' + currentPair.a + '</span>' +
          '<span class="eq-op">+</span>' +
          '<span class="eq-num eq-blue">' + currentPair.b + '</span>' +
          '<span class="eq-op">=</span>' +
          '<span class="eq-num eq-blue eq-number-reveal">' + doubleResult + '</span>' +
          '<span class="eq-op eq-fade-in">+</span>' +
          '<span class="eq-num eq-orange eq-number-reveal" style="animation-delay:0.15s">' + 1 + '</span>' +
          '<span class="eq-op eq-fade-in" style="animation-delay:0.25s">=</span>';
      }
    }, 3500));

    // Step 4: After 5s — show answer input
    animTimers.push(setTimeout(function() {
      if (inputArea) {
        inputArea.innerHTML =
          '<input id="game5-answer" class="answer-input answer-appear" type="number" min="0" max="40" placeholder="?">';
        var inp = document.getElementById('game5-answer');
        if (inp) setTimeout(function() { inp.focus(); }, 100);
      }
    }, 5000));
  }

  // ─── Level 2: Semi-guided ───
  function setupSemi() {
    var small = currentPair.small;
    var big = currentPair.big;

    var cubeArea = document.getElementById('game5-cube-area');
    var eqArea = document.getElementById('game5-equation-area');
    var decompArea = document.getElementById('game5-decomp-area');
    var inputArea = document.getElementById('game5-input-area');
    var instrEl = document.getElementById('game5-instruction');

    if (instrEl) instrEl.textContent = 'Trouve le double, puis le résultat !';

    // Show cubes with separation
    if (cubeArea) {
      cubeArea.classList.remove('hidden');
      cubeArea.innerHTML = renderCubeArea(currentPair.a, currentPair.b, true);
    }

    // Show tree decomposition
    if (decompArea) {
      decompArea.classList.remove('hidden');
      decompArea.innerHTML = renderTreeDecomp(big, small);
    }

    // Show equation
    if (eqArea) {
      eqArea.innerHTML =
        '<span class="eq-num eq-blue">' + currentPair.a + '</span>' +
        '<span class="eq-op">+</span>' +
        '<span class="eq-num eq-blue">' + currentPair.b + '</span>' +
        '<span class="eq-op">=</span>';
    }

    // Show two inputs
    if (inputArea) {
      inputArea.innerHTML =
        '<div class="semi-inputs">' +
          '<div class="semi-input-group">' +
            '<label class="semi-label">' + small + ' + ' + small + ' =</label>' +
            '<input id="game5-double" class="answer-input answer-input-small" type="number" min="0" max="40" placeholder="?">' +
          '</div>' +
          '<div class="semi-input-group">' +
            '<label class="semi-label eq-fade-in">+ <span class="eq-orange">1</span> =</label>' +
            '<input id="game5-final" class="answer-input answer-input-small" type="number" min="0" max="40" placeholder="?">' +
          '</div>' +
        '</div>';
      var doubleInp = document.getElementById('game5-double');
      if (doubleInp) setTimeout(function() { doubleInp.focus(); }, 150);

      if (doubleInp) {
        doubleInp.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            var finalInp = document.getElementById('game5-final');
            if (finalInp) finalInp.focus();
          }
        });
      }
    }
  }

  // ─── Level 3: Independent ───
  function setupIndependent() {
    var cubeArea = document.getElementById('game5-cube-area');
    var eqArea = document.getElementById('game5-equation-area');
    var decompArea = document.getElementById('game5-decomp-area');
    var inputArea = document.getElementById('game5-input-area');
    var instrEl = document.getElementById('game5-instruction');

    if (instrEl) instrEl.textContent = 'À toi de jouer !';

    if (cubeArea) {
      cubeArea.classList.remove('hidden');
      cubeArea.innerHTML = renderCubeArea(currentPair.a, currentPair.b, false);
    }

    if (eqArea) {
      eqArea.innerHTML =
        '<span class="eq-num eq-blue">' + currentPair.a + '</span>' +
        '<span class="eq-op">+</span>' +
        '<span class="eq-num eq-blue">' + currentPair.b + '</span>' +
        '<span class="eq-op">=</span>';
    }

    if (decompArea) { decompArea.innerHTML = ''; decompArea.classList.add('hidden'); }

    if (inputArea) {
      inputArea.innerHTML =
        '<input id="game5-answer" class="answer-input" type="number" min="0" max="40" placeholder="?">';
      var inp = document.getElementById('game5-answer');
      if (inp) setTimeout(function() { inp.focus(); }, 150);
    }
  }

  // ─── Answer handling ───
  function handleAnswer() {
    if (answered) return;

    var feedbackEl = document.getElementById('game5-feedback');
    var nextBtn = document.getElementById('game5-next');
    var validateBtn = document.getElementById('game5-validate');
    var correct = false;

    if (currentPair && currentPair.isWarmup) {
      var inp = document.getElementById('game5-answer');
      if (!inp || inp.value.trim() === '') return;
      answered = true;
      var userVal = parseInt(inp.value, 10);
      var expected = currentPair.small * 2;
      correct = (userVal === expected);
      inp.disabled = true;
      inp.className = 'answer-input ' + (correct ? 'correct' : 'wrong');

      if (correct) {
        warmupLeft--;
        if (feedbackEl) {
          feedbackEl.className = 'feedback correct';
          feedbackEl.textContent = 'Bravo ! ' + currentPair.small + ' + ' + currentPair.small + ' = ' + expected + ' ! 🌟';
        }
      } else {
        if (feedbackEl) {
          feedbackEl.className = 'feedback wrong';
          feedbackEl.textContent = currentPair.small + ' + ' + currentPair.small + ' = ' + expected + ' !';
        }
      }
    } else if (currentLevel === 'semi') {
      var doubleInp = document.getElementById('game5-double');
      var finalInp = document.getElementById('game5-final');
      if (!doubleInp || !finalInp) return;
      if (doubleInp.value.trim() === '' || finalInp.value.trim() === '') return;
      answered = true;

      var userDouble = parseInt(doubleInp.value, 10);
      var userFinal = parseInt(finalInp.value, 10);
      var expectedDouble = currentPair.small * 2;
      var expectedFinal = expectedDouble + 1;

      doubleInp.disabled = true;
      finalInp.disabled = true;

      var doubleCorrect = (userDouble === expectedDouble);
      var finalCorrect = (userFinal === expectedFinal);
      correct = doubleCorrect && finalCorrect;

      doubleInp.className = 'answer-input answer-input-small ' + (doubleCorrect ? 'correct' : 'wrong');
      finalInp.className = 'answer-input answer-input-small ' + (finalCorrect ? 'correct' : 'wrong');

      if (correct) {
        highlightDoubles();
        if (feedbackEl) {
          feedbackEl.className = 'feedback correct';
          feedbackEl.textContent = 'Bravo ! ' + currentPair.a + ' + ' + currentPair.b + ' = ' + expectedFinal + ' ! 🌟';
        }
      } else {
        if (feedbackEl) {
          feedbackEl.className = 'feedback wrong';
          feedbackEl.textContent = currentPair.small + ' + ' + currentPair.small + ' = ' + expectedDouble + ', donc ' + expectedDouble + ' + 1 = ' + expectedFinal + ' !';
        }
      }
    } else {
      var inp2 = document.getElementById('game5-answer');
      if (!inp2 || inp2.value.trim() === '') return;
      answered = true;

      var userVal2 = parseInt(inp2.value, 10);
      var expected2 = currentPair.small * 2 + 1;
      correct = (userVal2 === expected2);
      inp2.disabled = true;
      inp2.className = 'answer-input ' + (correct ? 'correct' : 'wrong');

      if (correct) {
        highlightDoubles();
        if (feedbackEl) {
          feedbackEl.className = 'feedback correct';
          feedbackEl.textContent = 'Bravo ! ' + currentPair.a + ' + ' + currentPair.b + ' = ' + expected2 + ' ! 🌟';
        }
      } else {
        if (feedbackEl) {
          feedbackEl.className = 'feedback wrong';
          feedbackEl.textContent = currentPair.a + ' + ' + currentPair.b + ' = ' + currentPair.small + ' + ' + currentPair.small + ' + 1 = ' + (currentPair.small * 2) + ' + 1 = ' + expected2 + ' !';
        }
        if (currentLevel === 'independent') {
          showReminderAnimation();
        }
      }
    }

    if (validateBtn) validateBtn.classList.add('hidden');
    if (nextBtn) nextBtn.classList.remove('hidden');

    if (correct) {
      score++;
      updateScore();
      SpeechManager.speakBravo();
      var newSticker = StickerSystem.registerCorrect();
      if (newSticker) StickerSystem.showStickerModal(newSticker);
      StickerSystem.updateBackpackUI();
    } else {
      SpeechManager.speakEncourage();
    }
  }

  function highlightDoubles() {
    var cubeArea = document.getElementById('game5-cube-area');
    if (cubeArea) {
      var mainGroup = cubeArea.querySelector('.cube-group-main');
      var matchGroup = cubeArea.querySelector('.cube-group-match');
      if (mainGroup) mainGroup.classList.add('cube-highlighted');
      if (matchGroup) matchGroup.classList.add('cube-highlighted');
    }
  }

  function showReminderAnimation() {
    var decompArea = document.getElementById('game5-decomp-area');
    var cubeArea = document.getElementById('game5-cube-area');
    var eqArea = document.getElementById('game5-equation-area');

    if (decompArea) {
      decompArea.classList.remove('hidden');
      decompArea.innerHTML = '<p class="reminder-label">Regarde bien !</p>' +
        renderTreeDecomp(currentPair.big, currentPair.small);
    }

    if (cubeArea) {
      cubeArea.innerHTML = renderCubeArea(currentPair.a, currentPair.b, true);
    }

    animTimers.push(setTimeout(function() {
      highlightDoubles();
      var doubleResult = currentPair.small * 2;
      var finalResult = doubleResult + 1;
      if (eqArea) {
        eqArea.innerHTML =
          '<span class="eq-num eq-blue">' + currentPair.a + '</span>' +
          '<span class="eq-op">+</span>' +
          '<span class="eq-num eq-blue">' + currentPair.b + '</span>' +
          '<span class="eq-op">=</span>' +
          '<span class="eq-num eq-blue eq-number-reveal">' + doubleResult + '</span>' +
          '<span class="eq-op eq-fade-in">+</span>' +
          '<span class="eq-num eq-orange eq-number-reveal" style="animation-delay:0.15s">1</span>' +
          '<span class="eq-op eq-fade-in" style="animation-delay:0.25s">=</span>' +
          '<span class="eq-num eq-green eq-number-reveal eq-result-big" style="animation-delay:0.4s">' + finalResult + '</span>';
      }
    }, 1000));
  }

  // ─── Cube rendering ───
  // Renders two cube groups with a + sign between them.
  // When separated=true, the BIGGER number's side gets decomposed:
  // its cubes split into (small blue cubes) + (1 orange extra cube)
  function renderCubeArea(a, b, separated) {
    var small = Math.min(a, b);
    var big = Math.max(a, b);
    var isNearDouble = (big === small + 1);
    var bigIsLeft = (a > b);

    var html = '<div class="cube-display">';

    if (isNearDouble && separated) {
      if (bigIsLeft) {
        // Left side is bigger: decompose left into small + extra
        html += '<div class="cube-group cube-group-main">';
        html += renderCubeGrid(small, 'blue');
        html += '</div>';
        html += '<div class="cube-group cube-group-extra cube-extra-pop">';
        html += '<div class="cube cube-orange cube-pop-anim"></div>';
        html += '</div>';
        html += '<span class="cube-op">+</span>';
        // Right side is the smaller number (matches the double)
        html += '<div class="cube-group cube-group-match">';
        html += renderCubeGrid(b, 'blue');
        html += '</div>';
      } else {
        // Right side is bigger: decompose right into small + extra
        // Left side is the smaller number (matches the double)
        html += '<div class="cube-group cube-group-match">';
        html += renderCubeGrid(a, 'blue');
        html += '</div>';
        html += '<span class="cube-op">+</span>';
        html += '<div class="cube-group cube-group-main">';
        html += renderCubeGrid(small, 'blue');
        html += '</div>';
        html += '<div class="cube-group cube-group-extra cube-extra-pop">';
        html += '<div class="cube cube-orange cube-pop-anim"></div>';
        html += '</div>';
      }
    } else {
      // No separation: show both numbers as-is
      html += '<div class="cube-group cube-group-match">';
      html += renderCubeGrid(a, 'blue');
      html += '</div>';
      html += '<span class="cube-op">+</span>';
      html += '<div class="cube-group cube-group-main">';
      html += renderCubeGrid(b, 'blue');
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function renderCubeGrid(n, color) {
    var html = '<div class="cube-grid">';
    for (var i = 0; i < n; i++) {
      html += '<div class="cube cube-' + color + '" style="animation-delay:' + (i * 0.06) + 's"></div>';
    }
    html += '</div>';
    return html;
  }

  // ─── Tree decomposition rendering ───
  function renderTreeDecomp(big, small) {
    return '<div class="tree-decomp">' +
      '<div class="tree-top tree-anim-step1">' +
        '<span class="tree-number">' + big + '</span>' +
      '</div>' +
      '<div class="tree-branches tree-anim-step2">' +
        '<div class="tree-branch-left"></div>' +
        '<div class="tree-branch-right"></div>' +
      '</div>' +
      '<div class="tree-bottom tree-anim-step3">' +
        '<span class="tree-child tree-left">' + small + '</span>' +
        '<span class="tree-child tree-right eq-orange">1</span>' +
      '</div>' +
    '</div>';
  }

  function updateScore() {
    var el = document.getElementById('game5-score');
    if (el) el.textContent = score;
  }

  // ─── Expose for HTML onclick ───
  window.game5Submit = function() { handleAnswer(); };
  window.game5Next = function() { nextRound(); };
  window.game5Start = function(level) { startLevel(level); };
  window.game5BackToLevels = function() {
    var play = document.getElementById('game5-play');
    var levels = document.getElementById('game5-levels');
    if (play && !play.classList.contains('hidden')) {
      play.classList.add('hidden');
      if (levels) levels.classList.remove('hidden');
    } else {
      showScreen('menu');
    }
  };

  // Enter key handling
  document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('keydown', function(e) {
      var screen = document.getElementById('screen-game5');
      if (!screen || !screen.classList.contains('active')) return;

      if (e.key === 'Enter') {
        var finalInp = document.getElementById('game5-final');
        if (finalInp && document.activeElement === finalInp) {
          if (!answered) handleAnswer();
          else nextRound();
          return;
        }
        var doubleInp = document.getElementById('game5-double');
        if (doubleInp && document.activeElement === doubleInp) {
          if (finalInp) finalInp.focus();
          return;
        }
        if (!answered) handleAnswer();
        else nextRound();
      }
    });
  });

  return {
    init: init
  };
})();
