import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-brand-black-border bg-brand-black-soft">
      <div className="container-wide py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="font-serif text-2xl tracking-[0.15em] mb-3">
              SOUL<span className="gold-text mx-1">×</span>TIME
            </div>
            <p className="text-brand-gray text-sm leading-relaxed max-w-xs">
              Where Time Finds Its Soul. Premium handcrafted timepieces for those who understand
              that a watch is more than an instrument — it is an expression.
            </p>
          </div>

          {/* Collections */}
          <div>
            <h4 className="text-xs font-medium tracking-widest uppercase text-brand-gold mb-4">Collection</h4>
            <ul className="space-y-2.5">
              {['Luxury', 'Sport', 'Classic', 'Smart', 'Limited Edition'].map((cat) => (
                <li key={cat}>
                  <Link href={`/products?search=${cat}`}
                    className="text-sm text-brand-gray hover:text-brand-white transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-medium tracking-widest uppercase text-brand-gold mb-4">Account</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/account', label: 'My Account' },
                { href: '/account/orders', label: 'My Orders' },
                { href: '/cart', label: 'Cart' },
                { href: '/login', label: 'Sign In' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-brand-gray hover:text-brand-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-brand-black-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-gray">
            © {new Date().getFullYear()} SOUL x TIME. All rights reserved.
          </p>
          <p className="text-xs text-brand-gray italic font-display">
            Where Time Finds Its Soul
          </p>
        </div>
      </div>
    </footer>
  );
}
