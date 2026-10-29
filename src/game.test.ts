import { describe, expect, it } from 'vitest'
import { advanceWorld, createGameState, hop, type GameState } from './game'

function testState(overrides: Partial<GameState>): GameState {
  return { ...createGameState(), hazards: [], ...overrides }
}

describe('Hop Home game rules', () => {
  it('costs a life when a hop lands on a car tile', () => {
    const state = testState({
      player: { col: 1, row: 8 },
      hazards: [{
        id: 'test-car', kind: 'car', row: 8, x: 2, length: 1.5,
        direction: 1, speed: 0.8, color: '#ffbd59',
      }],
    })

    const next = hop(state, 'right')

    expect(next.lives).toBe(2)
    expect(next.player).toEqual({ col: 4, row: 11 })
  })

  it('carries the player along with the log they are standing on', () => {
    const state = testState({
      player: { col: 3, row: 3 },
      hazards: [{
        id: 'test-log', kind: 'log', row: 3, x: 2, length: 3,
        direction: 1, speed: 0.4, color: '#a56a43',
      }],
    })

    const next = advanceWorld(state, 1)

    expect(next.lives).toBe(3)
    expect(next.player.col).toBeCloseTo(3.4)
    expect(next.hazards[0].x).toBeCloseTo(2.4)
  })

  it('scores and occupies an empty home slot', () => {
    const state = testState({
      player: { col: 4, row: 1 },
      score: 30,
      furthestRow: 1,
    })

    const next = hop(state, 'up')

    expect(next.homes).toEqual([false, false, true, false, false])
    expect(next.score).toBe(140)
    expect(next.player).toEqual({ col: 4, row: 11 })
  })
})
