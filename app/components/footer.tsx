import Link from 'next/link'

export function Footer() {
  return (
    <footer className="w-full py-6 sm:py-8 border-t border-border bg-background">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        {/* SEO Navigation Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 max-w-3xl mx-auto text-center">
          <div>
            <h3 className="font-semibold text-foreground text-sm mb-3">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/blog" className="text-muted-foreground hover:text-primary">Blog</Link></li>
              <li><Link href="/help" className="text-muted-foreground hover:text-primary">Help</Link></li>
              <li><Link href="/#pricing" className="text-muted-foreground hover:text-primary">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm mb-3">Features</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard/reflect/new" className="text-muted-foreground hover:text-primary">Reflect</Link></li>
              <li><Link href="/dashboard/history" className="text-muted-foreground hover:text-primary">History</Link></li>
              <li><Link href="/dashboard/chat" className="text-muted-foreground hover:text-primary">AI Chat</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm mb-3">Account</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard/settings" className="text-muted-foreground hover:text-primary">Settings</Link></li>
              <li><Link href="/dashboard/referrals" className="text-muted-foreground hover:text-primary">Referrals</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm mb-3">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary">Privacy</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary">Terms</Link></li>
            </ul>
          </div>
        </div>

        {/* 360 TFT Products Cross-Promotion */}
        <div className="pt-6 border-t border-border">
          <p className="text-center text-muted-foreground text-xs mb-4">
            More from 360 TFT
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-w-3xl mx-auto">
            <a
              href="https://www.skool.com/coachingacademy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-card hover:bg-primary/10 transition-colors group"
            >
              <span className="text-xs font-medium text-foreground group-hover:text-primary text-center">Coaching Academy</span>
              <span className="text-[10px] text-muted-foreground">Community & Courses</span>
            </a>
            <a
              href="https://www.skool.com/the-2-drill-club-5017"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-card hover:bg-primary/10 transition-colors group"
            >
              <span className="text-xs font-medium text-foreground group-hover:text-primary text-center">$2 Drill Club</span>
              <span className="text-[10px] text-muted-foreground">Weekly Drills</span>
            </a>
            <a
              href="https://www.skool.com/360tft-7374"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-card hover:bg-primary/10 transition-colors group"
            >
              <span className="text-xs font-medium text-foreground group-hover:text-primary text-center">360TFT Community</span>
              <span className="text-[10px] text-muted-foreground">Free Discussion</span>
            </a>
            <a
              href="https://www.amazon.co.uk/dp/B0GF9VSGKG"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-card hover:bg-primary/10 transition-colors group"
            >
              <span className="text-xs font-medium text-foreground group-hover:text-primary text-center">Dogmatic Coach</span>
              <span className="text-[10px] text-muted-foreground">Book by Kevin</span>
            </a>
            <a
              href="https://360tft.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-card hover:bg-primary/10 transition-colors group"
            >
              <span className="text-xs font-medium text-foreground group-hover:text-primary text-center">360TFT Website</span>
              <span className="text-[10px] text-muted-foreground">Blog & Resources</span>
            </a>
          </div>
        </div>

        {/* Company Info */}
        <div className="text-center mt-6 pt-4 border-t border-border">
          <p className="text-sm font-semibold text-muted-foreground mb-1">
            Coach Reflection <span className="font-normal">by 360TFT</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Operated by SVMS Consultancy Limited
          </p>
        </div>
      </div>
    </footer>
  )
}
