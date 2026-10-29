<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  advanceWorld,
  createGameState,
  GRID_HEIGHT,
  GRID_WIDTH,
  hop,
  logUnderPlayer,
  ROAD_ROWS,
  RIVER_ROWS,
  togglePause,
  type Direction,
  type GameState,
  type Hazard,
} from './game'

const CELL = 50
const game = ref<GameState>(createGameState())
const best = ref(0)
const showSoundNote = ref(false)
let animationFrame = 0
let lastFrame = 0
let lastUpdate = 0

const homeSlots = computed(() => [0, 2, 4, 6, 8].map((col, index) => ({
  col,
  index,
  occupied: game.value.homes[index],
})))

const visibleHazards = computed(() => game.value.hazards.flatMap((hazard) => {
  const period = GRID_WIDTH + hazard.length
  return [-period, 0, period].map((offset) => ({
    ...hazard,
    renderX: hazard.x + offset,
    key: `${hazard.id}-${offset}`,
  })).filter((item) => item.renderX < GRID_WIDTH && item.renderX + item.length > 0)
}))

const playerOnLog = computed(() => Boolean(logUnderPlayer(game.value)))
const statusCopy = computed(() => {
  if (game.value.phase === 'paused') return 'Taking a breather'
  if (game.value.phase === 'won') return 'All homes, all yours.'
  if (game.value.phase === 'gameover') return 'The city got the better of you.'
  if (RIVER_ROWS.includes(game.value.player.row)) return playerOnLog.value ? 'Riding the current' : 'Find a log'
  if (ROAD_ROWS.includes(game.value.player.row)) return 'Watch the headlights'
  return 'Make your way home'
})

function move(direction: Direction) {
  game.value = hop(game.value, direction)
  updateBest()
}

function updateBest() {
  if (game.value.score > best.value) {
    best.value = game.value.score
    try {
      localStorage.setItem('hop-home-best', String(best.value))
    } catch {
      // The game remains playable when browser storage is unavailable.
    }
  }
}

function restart() {
  game.value = createGameState()
}

function pause() {
  game.value = togglePause(game.value)
}

function onKeydown(event: KeyboardEvent) {
  const key = event.key.toLowerCase()
  const directions: Record<string, Direction> = {
    arrowup: 'up', w: 'up',
    arrowdown: 'down', s: 'down',
    arrowleft: 'left', a: 'left',
    arrowright: 'right', d: 'right',
  }
  if (directions[key]) {
    event.preventDefault()
    move(directions[key])
  } else if (key === 'r') {
    restart()
  } else if (key === 'escape') {
    pause()
  }
}

function frame(timestamp: number) {
  if (lastFrame && timestamp - lastUpdate >= 50) {
    const seconds = Math.min((timestamp - lastUpdate) / 1000, 0.1)
    game.value = advanceWorld(game.value, seconds)
    updateBest()
    lastUpdate = timestamp
  } else if (!lastFrame) {
    lastUpdate = timestamp
  }
  lastFrame = timestamp
  animationFrame = requestAnimationFrame(frame)
}

function hazardStyle(hazard: Hazard & { renderX: number }) {
  return `translate(${hazard.renderX * CELL}px, ${hazard.row * CELL}px)`
}

onMounted(() => {
  try {
    best.value = Number(localStorage.getItem('hop-home-best')) || 0
  } catch {
    best.value = 0
  }
  window.addEventListener('keydown', onKeydown)
  animationFrame = requestAnimationFrame(frame)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  cancelAnimationFrame(animationFrame)
})
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <a class="wordmark" href="#top" aria-label="Hop Home, back to top">
        <span class="mark" aria-hidden="true"><span></span></span>
        <span>little<span class="wordmark-accent">leap</span><small>ARCADE NO. 01</small></span>
      </a>
      <div class="topbar-right">
        <span class="online-indicator"><i></i> NIGHT SHIFT · LIVE</span>
        <span class="topbar-divider"></span>
        <span class="edition">A POCKET-SIZED CROSSING</span>
      </div>
    </header>

    <section id="top" class="intro">
      <div>
        <p class="eyebrow"><span>01</span> &nbsp;THE AFTER-HOURS RUN</p>
        <h1>Hop <em>Home.</em></h1>
        <p class="intro-copy">One little leap at a time. Dodge the rush, ride the river, find your way back.</p>
      </div>
      <div class="intro-stamp" aria-label="Original mini arcade game">
        <span>ORIGINAL</span><b>✳</b><span>MINI ARCADE</span>
      </div>
    </section>

    <section class="game-layout" aria-label="Hop Home game">
      <div class="board-column">
        <div class="board-topline">
          <div class="location"><span class="location-dot"></span><span>NEON DISTRICT</span><span class="location-slash">/</span><span>RIVER ROUTE</span></div>
          <div class="round-label">ROUND <strong>01</strong></div>
        </div>

        <div class="board-frame">
          <svg
            class="game-board"
            :viewBox="`0 0 ${GRID_WIDTH * CELL} ${GRID_HEIGHT * CELL}`"
            role="img"
            aria-label="Game board with a road, river, and five home slots"
          >
            <defs>
              <pattern id="river-shimmer" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M7 13h13m17 21h7M-5 41h12" stroke="#85d7c6" stroke-opacity=".18" stroke-width="2" stroke-linecap="round" />
                <circle cx="35" cy="10" r="1.5" fill="#c3f4d8" fill-opacity=".28" />
              </pattern>
              <pattern id="road-grain" width="31" height="31" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="7" r=".8" fill="#fff" fill-opacity=".08" />
                <circle cx="21" cy="23" r=".7" fill="#fff" fill-opacity=".06" />
              </pattern>
              <filter id="frog-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <rect width="450" height="600" fill="#111a20" />
            <rect y="0" width="450" height="50" fill="#14282c" />
            <rect y="50" width="450" height="250" fill="#16565b" />
            <rect y="50" width="450" height="250" fill="url(#river-shimmer)" />
            <rect y="300" width="450" height="50" fill="#91aa71" />
            <rect y="350" width="450" height="200" fill="#252c32" />
            <rect y="350" width="450" height="200" fill="url(#road-grain)" />
            <rect y="550" width="450" height="50" fill="#3a4039" />
            <path d="M0 301h450M0 349h450M0 551h450" stroke="#d7e19b" stroke-opacity=".4" stroke-width="2" />

            <g v-for="row in ROAD_ROWS" :key="`lane-${row}`" class="lane-markings">
              <path :d="`M0 ${row * CELL}h450`" stroke="#fff0cb" stroke-opacity=".11" stroke-width="1" />
              <path v-for="dash in 9" :key="dash" :d="`M${(dash - 1) * CELL + 12} ${row * CELL + 25}h18`" stroke="#efd5a4" stroke-opacity=".42" stroke-width="2" stroke-linecap="round" />
            </g>

            <g class="home-slots">
              <g v-for="slot in homeSlots" :key="slot.index" :transform="`translate(${slot.col * CELL}, 0)`">
                <path d="M5 7h40v35H5z" fill="#203a32" stroke="#7ba875" stroke-opacity=".52" stroke-width="1.5" />
                <path d="M10 15l15-9 15 9v17H10z" fill="#305642" />
                <path d="M20 20h10v12H20z" fill="#e5ad63" />
                <path d="M23 23h4v4h-4z" fill="#fff0b0" />
                <circle cx="25" cy="38" r="2" fill="#bedc80" :opacity="slot.occupied ? 0.2 : 0.85" />
                <g v-if="slot.occupied" class="home-frog" transform="translate(25 17)">
                  <ellipse cy="6" rx="10" ry="8" fill="#b9e878" />
                  <circle cx="-5" cy="0" r="4" fill="#d3f493" />
                  <circle cx="5" cy="0" r="4" fill="#d3f493" />
                  <circle cx="-5" cy="0" r="1.2" fill="#14211b" />
                  <circle cx="5" cy="0" r="1.2" fill="#14211b" />
                </g>
              </g>
            </g>

            <g class="hazards">
              <g v-for="hazard in visibleHazards" :key="hazard.key" :transform="hazardStyle(hazard)" class="moving-hazard">
                <template v-if="hazard.kind === 'log'">
                  <rect x="2" y="7" :width="hazard.length * CELL - 4" height="36" rx="17" :fill="hazard.color" stroke="#e0a46d" stroke-opacity=".5" stroke-width="1.5" />
                  <path v-for="seam in Math.floor(hazard.length)" :key="seam" :d="`M${seam * CELL - 3} 10v30`" stroke="#62422f" stroke-opacity=".55" stroke-width="2" />
                  <path d="M10 16h11m7 18h11m18-18h9" stroke="#e7b17c" stroke-opacity=".55" stroke-width="2" stroke-linecap="round" />
                  <circle cx="12" cy="25" r="3" fill="none" stroke="#6b4934" stroke-width="1.5" />
                </template>
                <template v-else>
                  <rect x="2" y="8" :width="hazard.length * CELL - 4" height="34" rx="10" :fill="hazard.color" />
                  <path d="M15 11h32l9 11H9z" fill="#24373b" fill-opacity=".9" />
                  <path d="M22 13h9v7H17zM34 13h10l6 7H34z" fill="#a8c9c0" fill-opacity=".8" />
                  <circle cx="15" cy="40" r="4" fill="#192025" /><circle cx="15" cy="40" r="1.7" fill="#adb5ad" />
                  <circle :cx="hazard.length * CELL - 15" cy="40" r="4" fill="#192025" /><circle :cx="hazard.length * CELL - 15" cy="40" r="1.7" fill="#adb5ad" />
                  <path d="M4 25h4m-4 5h4" stroke="#fff3ba" stroke-width="2" stroke-linecap="round" />
                </template>
              </g>
            </g>

            <g
              class="player-frog"
              :transform="`translate(${game.player.col * CELL}, ${game.player.row * CELL})`"
              filter="url(#frog-glow)"
            >
              <ellipse cx="25" cy="29" rx="16" ry="13" fill="#b9e878" />
              <ellipse cx="25" cy="34" rx="10" ry="6" fill="#8fc45d" />
              <circle cx="16" cy="18" r="7" fill="#d2f49a" />
              <circle cx="34" cy="18" r="7" fill="#d2f49a" />
              <circle cx="17" cy="18" r="3" fill="#14211b" />
              <circle cx="33" cy="18" r="3" fill="#14211b" />
              <circle cx="18" cy="17" r="1" fill="#fff" />
              <circle cx="34" cy="17" r="1" fill="#fff" />
              <path d="M20 29q5 4 10 0" fill="none" stroke="#527f43" stroke-width="1.5" stroke-linecap="round" />
            </g>

            <g v-if="game.phase !== 'playing'" class="board-overlay">
              <rect width="450" height="600" fill="#081217" fill-opacity=".76" />
              <rect x="47" y="228" width="356" height="144" rx="18" fill="#17262a" stroke="#91bd7b" stroke-opacity=".7" />
              <text x="225" y="280" text-anchor="middle" class="overlay-title">
                {{ game.phase === 'paused' ? 'PAUSED' : game.phase === 'won' ? 'NEIGHBORHOOD SAVED' : 'ONE MORE TRY?' }}
              </text>
              <text x="225" y="312" text-anchor="middle" class="overlay-copy">
                {{ game.phase === 'paused' ? 'Press Esc when you’re ready' : game.phase === 'won' ? 'You found every cozy corner.' : 'The night is still young.' }}
              </text>
              <text v-if="game.phase === 'won' || game.phase === 'gameover'" x="225" y="346" text-anchor="middle" class="overlay-action">PRESS R TO PLAY AGAIN</text>
            </g>
          </svg>
          <div class="board-grain" aria-hidden="true"></div>
          <div class="board-caption"><span>KEEP HOPPING</span><span>↗ &nbsp;9 × 12 GRID</span></div>
        </div>

        <div class="board-underbar">
          <span><i class="underbar-icon">⌁</i> {{ statusCopy }}</span>
          <span class="sound-note" @click="showSoundNote = !showSoundNote">{{ showSoundNote ? 'No sound, just vibes ✦' : 'Sound on? In your imagination.' }}</span>
        </div>
      </div>

      <aside class="side-panel">
        <section class="score-card">
          <div class="card-label"><span>YOUR RUN</span><span class="live-dot"></span></div>
          <div class="score-value">{{ String(game.score).padStart(4, '0') }}<small>PTS</small></div>
          <div class="score-rule"></div>
          <div class="score-bottom"><span>PERSONAL BEST</span><strong>{{ String(best).padStart(4, '0') }}</strong></div>
        </section>

        <section class="lives-block">
          <div class="section-heading"><span>EXTRA LEAPS</span><span>{{ game.lives }} / 3</span></div>
          <div class="life-pips" aria-label="Lives remaining">
            <span v-for="life in 3" :key="life" class="life-pip" :class="{ spent: life > game.lives }"><i></i></span>
          </div>
        </section>

        <section class="homes-block">
          <div class="section-heading"><span>SAFE SPOTS</span><span>{{ game.homes.filter(Boolean).length }} OF 5</span></div>
          <div class="home-progress" aria-label="Home slots filled">
            <span v-for="(home, index) in game.homes" :key="index" :class="{ filled: home }"><i></i></span>
          </div>
          <p>Five cozy corners. One very determined frog.</p>
        </section>

        <div class="side-divider"></div>

        <section class="controls-block">
          <div class="section-heading"><span>HOW TO HOP</span><span class="controls-hint">KEYS OR TAP</span></div>
          <div class="keyboard-help">
            <span><kbd>↑</kbd><kbd>W</kbd><b>MOVE</b></span>
            <span><kbd>ESC</kbd><b>PAUSE</b><kbd>R</kbd><b>RESTART</b></span>
          </div>
          <div class="dpad" aria-label="Touch movement controls">
            <span></span><button aria-label="Hop up" @click="move('up')">↑</button><span></span>
            <button aria-label="Hop left" @click="move('left')">←</button><button aria-label="Hop down" @click="move('down')">↓</button><button aria-label="Hop right" @click="move('right')">→</button>
          </div>
          <div class="control-actions">
            <button class="action-button" @click="pause">{{ game.phase === 'paused' ? 'RESUME' : 'PAUSE' }} <kbd>ESC</kbd></button>
            <button class="action-button restart-button" @click="restart">NEW RUN <kbd>R</kbd></button>
          </div>
        </section>

        <div class="tip-card"><span class="tip-spark">✳</span><div><strong>A LITTLE TIP</strong><p>Logs are your friends. The water isn’t.</p></div></div>
      </aside>
    </section>

    <footer class="footer">
      <span>MADE FOR THE LONG WAY HOME <i>✳</i></span>
      <span>AN ORIGINAL LITTLE ARCADE GAME <b>·</b> BUILT WITH CARE</span>
    </footer>
  </main>
</template>
