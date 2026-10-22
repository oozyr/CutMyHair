import { colors } from 'src/theme';

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
        padding: '24px',
      }}
    >
      {/* Subtle batik background accent */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'url(/images/batik.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.04,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: 480,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            borderRadius: 20,
            backgroundColor: colors.primary,
            marginBottom: 24,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/icon.png" alt="CutMyHair" width={48} height={48} />
        </div>

        <h1
          style={{
            margin: '0 0 8px',
            fontSize: 30,
            fontWeight: 700,
            color: colors.primary,
            letterSpacing: -0.5,
          }}
        >
          CutMyHair Dashboard
        </h1>

        <p
          style={{
            margin: '0 0 32px',
            color: colors.textSecondary,
            fontSize: 15,
          }}
        >
          Papan pemuka untuk tukang gunting rambut
        </p>

        <div
          style={{
            display: 'inline-block',
            padding: '8px 20px',
            borderRadius: 9999,
            backgroundColor: colors.accentLight,
            color: colors.textInverse,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Demo MVP - Skeleton ready
        </div>
      </div>
    </main>
  );
}
