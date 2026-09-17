import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Lightweight mobile-only replacement for the WebGL CircularGallery.
 * Shows exactly one influencer — image AND details (handle, followers,
 * shop link) together inside a single card, not split across two frames.
 * Arrow buttons (or dots) move to the next/previous influencer.
 *
 * `items` — full influencer objects: { img, name, handle, followers, products }
 */
export default function InfluencerCarouselMobile({ items, onChangeActiveIndex }) {
  const [index, setIndex] = useState(0);

  // Reset to first slide if the list changes (e.g. influencers reload)
  useEffect(() => {
    setIndex(0);
  }, [items.length]);

  // Keep parent in sync (in case anything else outside this card needs the index)
  useEffect(() => {
    if (typeof onChangeActiveIndex === 'function') onChangeActiveIndex(index);
  }, [index, onChangeActiveIndex]);

  if (!items || items.length === 0) return null;

  const goTo = (nextIndex) => {
    const len = items.length;
    setIndex(((nextIndex % len) + len) % len);
  };

  const current = items[index];
  const referral = current.handle ? current.handle.replace('@', '').replace('_style', '') : '';

  return (
    <div className="relative w-full max-w-xs mx-auto">
      <div className="relative rounded-lg overflow-hidden shadow-md border border-brand-light/60 bg-white">
        {/* Image */}
        <div className="relative w-full aspect-[4/5]">
          <img
            key={current.img}
            src={current.img}
            alt={current.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous curator"
            className="absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center text-brand-text active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next curator"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center text-brand-text active:scale-90 transition-transform"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Details — same card, directly under the image */}
        <div className="p-5 text-center">
          <span className="text-brand-gold text-xs font-bold uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200/50 mb-3 inline-block font-inter">
            Featured Curator
          </span>
          <h3 className="font-playfair text-xl font-bold text-brand-text mb-1">{current.name}</h3>
          {current.handle && (
            <p className="text-brand-gold text-sm font-semibold mb-2 font-inter">{current.handle}</p>
          )}
          {(current.followers || current.products > 0) && (
            <p className="text-brand-grey text-xs mb-4 font-medium font-inter">
              {current.followers && <span>{current.followers} followers</span>}
              {current.followers && current.products > 0 && <span> · </span>}
              {current.products > 0 && <span>{current.products} products curated</span>}
            </p>
          )}
          <Link
            to={`/products?referral=${referral}`}
            className="btn-primary w-full flex items-center justify-center gap-2 group hover:scale-[1.02] transition-transform font-inter"
            id="shop-her-look-btn-mobile"
          >
            Shop {current.name}'s Look <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to curator ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-5 bg-brand-gold' : 'w-1.5 bg-brand-light'
            }`}
          />
        ))}
      </div>
    </div>
  );
}