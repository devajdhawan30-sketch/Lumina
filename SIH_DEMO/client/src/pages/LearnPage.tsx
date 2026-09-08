import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        {/* Decorative visual */}
        <div className="landing-orbit" aria-hidden="true">
          <div className="orbit-ring orbit-ring-1" />
          <div className="orbit-ring orbit-ring-2" />
          <div className="orbit-ring orbit-ring-3" />

          <div className="orbit-core">
            <span>∞</span>
          </div>

          <div className="orbit-dot orbit-dot-1" />
          <div className="orbit-dot orbit-dot-2" />
          <div className="orbit-dot orbit-dot-3" />
        </div>

        {/* Hero content */}
        <div className="landing-content">
          <p className="landing-eyebrow">
            LEARN INFINITE. THINK SMARTER.
          </p>

          <h1>
            The AI Tutor
            <br />
            That Learns With You
          </h1>

          <p className="landing-description">
            A learning space that recognizes your pace, turns confusion
            into clarity, and makes every study session feel built for you.
          </p>

          <div className="landing-actions">
            <Link to="/learn" className="framer-button framer-button-primary">
              <span>Start Learning</span>
              <span className="button-arrow">↗</span>
            </Link>

            <Link to="/subjects" className="framer-button framer-button-secondary">
              <span>Explore Courses</span>
              <span className="button-arrow">↗</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Small continuation section so the page doesn't feel empty */}
      <section className="landing-intro">
        <p className="landing-intro-label">A DIFFERENT WAY TO LEARN</p>

        <h2>
          Don't just learn
          <br />
          <span>understand.</span>
        </h2>

        <p>
          Explore concepts at your own pace, ask questions whenever you're
          stuck, and go deeper whenever curiosity takes you there.
        </p>
      </section>
    </main>
  )
}