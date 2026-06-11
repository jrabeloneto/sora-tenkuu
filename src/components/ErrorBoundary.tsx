// components/ErrorBoundary.tsx — never ship a silent white screen.
// If anything throws during render, show the error in a frost panel so it can
// be read and reported instead of guessing at a blank page.
import { Component, type ReactNode } from 'react'

export class ErrorBoundary extends Component<
  { children: ReactNode; label?: string },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error(`[SORA] crash in ${this.props.label ?? 'app'}:`, error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 999, display: 'grid', placeItems: 'center',
            background: 'linear-gradient(180deg,#4A90D9,#87BFE8)', padding: 24,
          }}
        >
          <div
            style={{
              maxWidth: 640, padding: '1.6rem 2rem', borderRadius: 18,
              background: 'rgba(240,246,255,0.85)', border: '1px solid rgba(8,37,103,0.25)',
              fontFamily: 'monospace', color: '#082567',
            }}
          >
            <div style={{ fontWeight: 700, letterSpacing: '0.2em', marginBottom: 12 }}>
              SORA — RUNTIME ERROR · エラー
            </div>
            <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {String(this.state.error?.message ?? this.state.error)}
              {'\n\n'}
              {String((this.state.error as Error)?.stack ?? '').split('\n').slice(0, 6).join('\n')}
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

/* WebGL2 availability — postprocessing needs it */
export function webglOK(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!c.getContext('webgl2')
  } catch {
    return false
  }
}
