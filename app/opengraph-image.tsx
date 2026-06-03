import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'आज क्या बनेगा? — Weekly Meal Planner'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#F5F0EA',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 16 }}>🍛</div>
        <div style={{ fontSize: 64, fontWeight: 800, color: '#2D2A26', marginBottom: 12 }}>
          आज क्या बनेगा?
        </div>
        <div style={{ fontSize: 28, color: '#8C8680', textAlign: 'center', maxWidth: 700 }}>
          Plan meals for the week. Share with your cook. In their language.
        </div>
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 32,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {['Tamil', 'North Indian', 'Marathi', 'Gujarati', 'Bengali', 'Kerala', 'Goan', 'Punjabi'].map((c) => (
            <div
              key={c}
              style={{
                background: '#FFFDF9',
                padding: '8px 20px',
                borderRadius: 20,
                fontSize: 20,
                color: '#2D2A26',
                fontWeight: 600,
              }}
            >
              {c}
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 30, fontSize: 22, color: '#C5C0BA' }}>
          aajbanega.com
        </div>
      </div>
    ),
    { ...size }
  )
}
