export const GRID_WIDTH = 9
export const GRID_HEIGHT = 12
export const HOME_ROW = 0
export const RIVER_ROWS = [1, 2, 3, 4, 5]
export const ROAD_ROWS = [7, 8, 9, 10]

export type Direction = 'up' | 'down' | 'left' | 'right'
export type GamePhase = 'playing' | 'paused' | 'won' | 'gameover'
export type HazardKind = 'car' | 'log'

export interface Hazard {
  id: string
  kind: HazardKind
  row: number
  x: number
  length: number
  direction: -1 | 1
  speed: number
  color: string
}

export interface GameState {
  player: { col: number; row: number }
  hazards: Hazard[]
  homes: boolean[]
  score: number
  lives: number
  phase: GamePhase
  furthestRow: number
}

const HOME_COLUMNS = [0, 2, 4, 6, 8]
const START = { col: 4, row: 11 }

export function createGameState(): GameState {
  const hazards: Hazard[] = []
  const riverColors = ['#a56a43', '#bd8050', '#98613d']
  const carColors = ['#ffbd59', '#ff795f', '#63d7c7', '#c5e27b']

  RIVER_ROWS.forEach((row, index) => {
    const direction = (index % 2 === 0 ? 1 : -1) as -1 | 1
    const positions = index % 2 === 0 ? [-1.8, 2.3, 6.4] : [-0.2, 4.1]
    positions.forEach((x, item) => hazards.push({
      id: `log-${row}-${item}`,
      kind: 'log',
      row,
      x,
      length: index % 2 === 0 ? 2.8 : 3.5,
      direction,
      speed: 0.42 + (index % 3) * 0.1,
      color: riverColors[index % riverColors.length],
    }))
  })

  ROAD_ROWS.forEach((row, index) => {
    const direction = (index % 2 === 0 ? -1 : 1) as -1 | 1
    const positions = index % 2 === 0 ? [0.5, 5.4] : [-1.5, 2.1, 6.2]
    positions.forEach((x, item) => hazards.push({
      id: `car-${row}-${item}`,
      kind: 'car',
      row,
      x,
      length: index % 2 === 0 ? 1.65 : 1.35,
      direction,
      speed: 0.72 + (index % 2) * 0.24,
      color: carColors[(index + item) % carColors.length],
    }))
  })

  return {
    player: { ...START },
    hazards,
    homes: [false, false, false, false, false],
    score: 0,
    lives: 3,
    phase: 'playing',
    furthestRow: START.row,
  }
}

function wrapsAt(entity: Hazard, col: number): boolean {
  const center = col + 0.5
  const period = GRID_WIDTH + entity.length
  for (let offset = -1; offset <= 1; offset += 1) {
    const start = entity.x + offset * period
    if (center >= start && center <= start + entity.length) return true
  }
  return false
}

export function logUnderPlayer(state: GameState, player = state.player): Hazard | undefined {
  if (!RIVER_ROWS.includes(player.row)) return undefined
  return state.hazards.find((hazard) =>
    hazard.kind === 'log' && hazard.row === player.row && wrapsAt(hazard, player.col),
  )
}

function carAtPlayer(state: GameState): boolean {
  return state.hazards.some((hazard) =>
    hazard.kind === 'car' && hazard.row === state.player.row && wrapsAt(hazard, state.player.col),
  )
}

function loseLife(state: GameState): GameState {
  const lives = Math.max(0, state.lives - 1)
  return {
    ...state,
    player: { ...START },
    lives,
    phase: lives === 0 ? 'gameover' : 'playing',
  }
}

export function hop(state: GameState, direction: Direction): GameState {
  if (state.phase !== 'playing') return state
  const offsets: Record<Direction, [number, number]> = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
  }
  const [dx, dy] = offsets[direction]
  const col = state.player.col + dx
  const row = state.player.row + dy
  if (col < 0 || col >= GRID_WIDTH || row < 0 || row >= GRID_HEIGHT) return state

  let next: GameState = { ...state, player: { col, row } }
  if (row < state.furthestRow) {
    next = { ...next, score: next.score + (state.furthestRow - row) * 10, furthestRow: row }
  }

  if (row === HOME_ROW) {
    const slot = HOME_COLUMNS.indexOf(col)
    if (slot < 0 || next.homes[slot]) return loseLife(next)
    const homes = [...next.homes]
    homes[slot] = true
    const complete = homes.every(Boolean)
    return {
      ...next,
      player: { ...START },
      homes,
      score: next.score + 100,
      furthestRow: START.row,
      phase: complete ? 'won' : 'playing',
    }
  }

  if (ROAD_ROWS.includes(row) && carAtPlayer(next)) return loseLife(next)
  if (RIVER_ROWS.includes(row) && !logUnderPlayer(next)) return loseLife(next)
  return next
}

export function advanceWorld(state: GameState, seconds: number): GameState {
  if (state.phase !== 'playing' || seconds <= 0) return state
  const hazards = state.hazards.map((hazard) => {
    const period = GRID_WIDTH + hazard.length
    const moved = hazard.x + hazard.direction * hazard.speed * seconds
    return { ...hazard, x: ((moved + hazard.length) % period + period) % period - hazard.length }
  })
  let next: GameState = { ...state, hazards, player: { ...state.player } }

  if (RIVER_ROWS.includes(state.player.row)) {
    const supportingLog = logUnderPlayer(state)
    if (!supportingLog) return loseLife(next)
    const drift = supportingLog.direction * supportingLog.speed * seconds
    next.player.col += drift
    if (next.player.col < 0 || next.player.col >= GRID_WIDTH || !logUnderPlayer(next)) return loseLife(next)
  }

  if (ROAD_ROWS.includes(next.player.row) && carAtPlayer(next)) return loseLife(next)
  return next
}

export function togglePause(state: GameState): GameState {
  if (state.phase === 'playing') return { ...state, phase: 'paused' }
  if (state.phase === 'paused') return { ...state, phase: 'playing' }
  return state
}
