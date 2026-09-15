import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, ChevronDown, Grid2X2, List, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchProducts } from '../redux/slices/productsSlice';
import { fetchCategories } from '../redux/slices/categoriesSlice';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { formatPrice } from '../utils/currency';
import PriceRangeSlider from '../components/PriceRangeSlider';
import api from '../services/api';

/* Scroll-reveal using IntersectionObserver + Framer Motion — Vengeance UI pattern (manual impl) */
const useReveal = () => {
  const [revealed, setRevealed] = useState(false);
  const ref = (el) => {
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setRevealed(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
  };
  return [ref, revealed];
};

const sortOptions = [
  { label: 'Newest', value: 'createdAt-DESC' },
  { label: 'Price: Low to High', value: 'price-ASC' },
  { label: 'Price: High to Low', value: 'price-DESC' },
  { label: 'Rating', value: 'rating-DESC' },
];

const dummyBrands = [
  { id: 1, name: 'Zara Couture House' },
  { id: 2, name: 'Rani Jewels Pvt Ltd' },
  { id: 3, name: 'Aromatic House India' },
  { id: 4, name: 'Sole Luxe Footwear' },
  { id: 5, name: 'Glam Accessories Co.' },
  { id: 6, name: 'Royal Threads Mumbai' },
];

const ProductListingPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { slug, sub, subsub } = useParams();
  const { items: products, loading, total, totalPages } = useSelector(s => s.products);
  const { items: categories } = useSelector(s => s.categories);

  const routeCategory = subsub || sub || slug;
  const currentCategory = routeCategory || searchParams.get('category') || '';

  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 });

  const [filters, setFilters] = useState({
    category: currentCategory,
    search: searchParams.get('search') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    vendorId: searchParams.get('vendorId') || '',
    minDiscount: searchParams.get('minDiscount') || '',
    maxDiscount: searchParams.get('maxDiscount') || '',
    sort: 'createdAt',
    order: 'DESC',
    page: 1,
  });

  const applyPriceRange = useCallback((min, max) => {
    setPriceRange(pr => ({
      ...pr,
      _applied: { min, max },
    }));
    setFilters(prev => ({
      ...prev,
      minPrice: min <= 0 ? '' : String(min),
      maxPrice: min <= 0 && max >= priceRange.max ? '' : String(max),
      page: 1,
    }));
  }, [priceRange.max]);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [revealRef, revealed] = useReveal();

  useEffect(() => {
    dispatch(fetchProducts({ ...filters, limit: 16 }));
    document.title = 'Shop All — Billu Bazaar';
  }, [filters, dispatch]);

  // Fetch real min/max price from DB on mount
  useEffect(() => {
    api.get('/products/price-range').then(res => {
      if (res.data?.success) {
        setPriceRange({ min: res.data.minPrice, max: res.data.maxPrice });
      }
    }).catch(() => {});
  }, []);
  useEffect(() => {
    const category = routeCategory || searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const vendorId = searchParams.get('vendorId') || '';
    const minDiscount = searchParams.get('minDiscount') || '';
    const maxDiscount = searchParams.get('maxDiscount') || '';
    setFilters(prev => {
      if (
        prev.category !== category ||
        prev.search !== search ||
        prev.minPrice !== minPrice ||
        prev.maxPrice !== maxPrice ||
        prev.vendorId !== vendorId ||
        prev.minDiscount !== minDiscount ||
        prev.maxDiscount !== maxDiscount
      ) {
        return {
          ...prev,
          category,
          search,
          minPrice,
          maxPrice,
          vendorId,
          minDiscount,
          maxDiscount,
          page: 1,
        };
      }
      return prev;
    });
  }, [searchParams, slug, sub, subsub]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleFilter = (key, value) => {
    if (key === 'category') {
      if (value === '') {
        navigate('/products');
      } else {
        navigate(`/category/${value}`);
      }
    } else {
      setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    }
  };

  const handleSort = (val) => {
    const [sort, order] = val.split('-');
    setFilters(prev => ({ ...prev, sort, order }));
  };

  const handleCollectionChange = (val) => {
    setFilters(prev => ({
      ...prev,
      newArrival: val === 'newArrival' ? true : undefined,
      bestSeller: val === 'bestSeller' ? true : undefined,
      featured: val === 'featured' ? true : undefined,
      page: 1,
    }));
  };

  const handleDiscountChange = (val) => {
    if (val === '') {
      setFilters(prev => ({
        ...prev,
        minDiscount: '',
        maxDiscount: '',
        page: 1,
      }));
    } else {
      const [min, max] = val.split('-');
      setFilters(prev => ({
        ...prev,
        minDiscount: min,
        maxDiscount: max,
        page: 1,
      }));
    }
  };

  const selectedCollection = filters.newArrival
    ? 'newArrival'
    : filters.bestSeller
    ? 'bestSeller'
    : filters.featured
    ? 'featured'
    : '';

  const { code: currencyCode, rate: currencyRate } = useSelector(s => s.currency);
  const fmt = (v) => formatPrice(v, currencyCode, currencyRate);

  const findCategoryInTree = (cats, targetSlug) => {
    for (const cat of cats) {
      if (cat.slug === targetSlug) return cat;
      if (cat.children && cat.children.length > 0) {
        const found = findCategoryInTree(cat.children, targetSlug);
        if (found) return found;
      }
    }
    return null;
  };

  const activeCategoryObject = filters.category ? findCategoryInTree(categories, filters.category) : null;

  const getBreadcrumbs = () => {
    if (!slug) return null;
    const catObj = categories.find(c => c.slug === slug);
    if (!catObj) return null;

    const crumbs = [{ label: catObj.name, path: `/category/${catObj.slug}` }];

    if (sub) {
      const subObj = catObj.children?.find(s => s.slug === sub);
      if (subObj) {
        crumbs.push({ label: subObj.name, path: `/category/${catObj.slug}/${subObj.slug}` });
        
        if (subsub) {
          const subSubObj = subObj.children?.find(ss => ss.slug === subsub);
          if (subSubObj) {
            crumbs.push({ label: subSubObj.name, path: `/category/${catObj.slug}/${subObj.slug}/${subSubObj.slug}` });
          }
        }
      }
    }
    return crumbs;
  };

  const renderCategoryTree = (cats, currentCatSlug, currentSubSlug, currentSubSubSlug) => {
    return (
      <div className="space-y-4">
        <h3 className="font-playfair text-base font-bold uppercase tracking-wider text-brand-text mb-3 pb-2 border-b border-brand-light">Categories</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <Link
              to="/products"
              className={`block px-3 py-2 rounded-lg transition-colors font-medium ${!currentCatSlug ? 'bg-brand-gold/15 text-brand-gold font-semibold' : 'text-brand-text hover:bg-neutral-100 hover:text-brand-gold'}`}
            >
              All Products
            </Link>
          </li>
          
          {cats.map(cat => {
            const isCatActive = currentCatSlug === cat.slug;
            const hasSubcategories = cat.children && cat.children.length > 0;
            
            return (
              <li key={cat.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Link
                    to={`/category/${cat.slug}`}
                    className={`block flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${isCatActive ? 'bg-brand-gold/15 text-brand-gold font-semibold' : 'text-brand-text hover:bg-neutral-100 hover:text-brand-gold'}`}
                  >
                    {cat.name}
                  </Link>
                </div>
                
                {hasSubcategories && (isCatActive || currentCatSlug === cat.slug) && (
                  <ul className="pl-3 space-y-1.5 border-l-2 border-brand-gold/30 ml-3 my-1.5">
                    {cat.children.map(subCat => {
                      const isSubActive = currentSubSlug === subCat.slug;
                      const hasSubSub = subCat.children && subCat.children.length > 0;
                      
                      return (
                        <li key={subCat.id} className="space-y-1">
                          <Link
                            to={`/category/${cat.slug}/${subCat.slug}`}
                            className={`flex items-center justify-between px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${isSubActive ? 'bg-brand-gold/20 text-brand-gold font-semibold' : 'text-brand-grey hover:text-brand-text hover:bg-neutral-100'}`}
                          >
                            <span>{subCat.name}</span>
                            {hasSubSub && <span className="text-[10px] text-neutral-400 font-normal">({subCat.children.length})</span>}
                          </Link>
                          
                          {hasSubSub && isSubActive && (
                            <ul className="pl-2 space-y-1 mt-1 border-l-2 border-brand-gold/20 ml-2">
                              {subCat.children.map(subSubCat => {
                                const isSubSubActive = currentSubSubSlug === subSubCat.slug;
                                return (
                                  <li key={subSubCat.id}>
                                    <Link
                                      to={`/category/${cat.slug}/${subCat.slug}/${subSubCat.slug}`}
                                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors min-h-[38px] ${isSubSubActive ? 'bg-brand-gold/25 text-brand-gold font-semibold' : 'text-neutral-600 hover:text-brand-gold hover:bg-neutral-100'}`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${isSubSubActive ? 'bg-brand-gold' : 'bg-neutral-400'}`} />
                                      <span>{subSubCat.name}</span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };


  return (
    <main id="main-content">
      {/* Breadcrumb + header */}
      <div className="bg-brand-light py-8">
        <div className="max-w-site mx-auto px-6 md:px-8">
          <nav className="text-xs text-brand-grey mb-2" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-brand-gold transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/products" className="hover:text-brand-gold transition-colors">Products</Link>
            {getBreadcrumbs()?.map((crumb, idx) => (
              <span key={crumb.path}>
                <span className="mx-2">/</span>
                {idx === getBreadcrumbs().length - 1 ? (
                  <span className="text-brand-gold font-medium">{crumb.label}</span>
                ) : (
                  <Link to={crumb.path} className="hover:text-brand-gold transition-colors">{crumb.label}</Link>
                )}
              </span>
            ))}
          </nav>
          <h1 className="font-playfair text-3xl font-bold text-brand-text mb-1">
            {activeCategoryObject ? activeCategoryObject.name : 'All Products'}
          </h1>
          <p className="text-brand-grey text-sm mt-1">{total} products</p>
        </div>
      </div>

      <div className="max-w-site mx-auto px-6 md:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Left Sidebar (Desktop) */}
          <aside className="hidden md:block md:col-span-1 space-y-8 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-brand-light self-start sticky top-24">
            {/* Category Tree */}
            {renderCategoryTree(categories, slug, sub, subsub)}

            {/* Price Range Slider */}
            <div className="pt-6 border-t border-brand-light">
              <p className="font-playfair text-sm font-bold uppercase tracking-wider text-brand-text mb-4">Price Range</p>
              <PriceRangeSlider
                priceMin={priceRange.min}
                priceMax={priceRange.max}
                initialMin={Number(filters.minPrice) || priceRange.min}
                initialMax={Number(filters.maxPrice) || priceRange.max}
                fmt={fmt}
                onApply={applyPriceRange}
              />
            </div>

            {/* Collection Filter section removed (placed in top bar dropdown) */}

            {/* Collection Filter section removed (placed in top bar dropdown) */}
          </aside>

          {/* Product Listing Area */}
          <div className="col-span-1 md:col-span-3">
            {/* Desktop Filter & Sort Bar */}
            <div className="hidden md:flex items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-200">
              <span className="text-xs text-brand-grey font-medium tracking-wide">
                Showing <span className="text-brand-text font-semibold">{total}</span> items
              </span>
              <div className="flex items-center gap-4">
                {/* Collection Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <label htmlFor="products-collection" className="text-xs font-semibold uppercase tracking-wider text-brand-grey whitespace-nowrap">
                    Collection:
                  </label>
                  <select
                    id="products-collection"
                    value={selectedCollection}
                    onChange={e => handleCollectionChange(e.target.value)}
                    className="border border-neutral-300 rounded-sm text-xs px-3 py-1.5 bg-white text-brand-text focus:outline-none focus:border-brand-gold"
                  >
                    <option value="">All Collections</option>
                    <option value="newArrival">New Arrivals</option>
                    <option value="bestSeller">Best Sellers</option>
                    <option value="featured">Featured</option>
                  </select>
                </div>

                {/* Discount Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <label htmlFor="products-discount" className="text-xs font-semibold uppercase tracking-wider text-brand-grey whitespace-nowrap">
                    Discount:
                  </label>
                  <select
                    id="products-discount"
                    value={filters.minDiscount ? `${filters.minDiscount}-${filters.maxDiscount}` : ''}
                    onChange={e => handleDiscountChange(e.target.value)}
                    className="border border-neutral-300 rounded-sm text-xs px-3 py-1.5 bg-white text-brand-text focus:outline-none focus:border-brand-gold"
                  >
                    <option value="">All Discounts</option>
                    <option value="1-10">Upto 10%</option>
                    <option value="1-25">Upto 25%</option>
                    <option value="1-50">Upto 50%</option>
                    <option value="51-100">Above 50%</option>
                  </select>
                </div>

                {/* Sort By Dropdown */}
                <div className="flex items-center gap-2">
                  <label htmlFor="products-sort" className="text-xs font-semibold uppercase tracking-wider text-brand-grey whitespace-nowrap">
                    Sort By:
                  </label>
                  <select
                    id="products-sort"
                    value={`${filters.sort}-${filters.order}`}
                    onChange={e => handleSort(e.target.value)}
                    className="border border-neutral-300 rounded-sm text-xs px-3 py-1.5 bg-white text-brand-text focus:outline-none focus:border-brand-gold"
                  >
                    {sortOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile Filter & Sort Toolbar */}
            <div className="md:hidden mb-5">
              {/* Collection Quick Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-none">
                {[
                  { label: 'All', value: '' },
                  { label: 'New Arrivals', value: 'newArrival' },
                  { label: 'Best Sellers', value: 'bestSeller' },
                  { label: 'Featured', value: 'featured' }
                ].map(col => {
                  const isActive = selectedCollection === col.value;
                  return (
                    <button
                      key={col.label}
                      type="button"
                      onClick={() => handleCollectionChange(col.value)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide whitespace-nowrap transition-all duration-200 ${
                        isActive
                          ? 'bg-neutral-900 text-white shadow-sm border border-neutral-900'
                          : 'bg-white text-neutral-700 border border-neutral-200 hover:border-brand-gold/60'
                      }`}
                    >
                      {col.label}
                    </button>
                  );
                })}
              </div>

              {/* Dual Action Bar: Filters & Sort */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    filtersOpen || (filters.minPrice || filters.minDiscount)
                      ? 'border-brand-gold bg-brand-gold/10 text-neutral-900 font-bold'
                      : 'border-neutral-200 bg-white text-neutral-800 shadow-sm'
                  }`}
                  id="filters-toggle-mobile"
                >
                  <SlidersHorizontal size={14} className="text-brand-gold" />
                  <span>Filters</span>
                  {(filters.minPrice || filters.minDiscount) && (
                    <span className="w-2 h-2 rounded-full bg-brand-gold" />
                  )}
                </button>

                <div className="relative">
                  <select
                    value={`${filters.sort}-${filters.order}`}
                    onChange={e => handleSort(e.target.value)}
                    className="w-full py-2.5 px-3 pr-8 rounded-lg border border-neutral-200 bg-white text-neutral-800 shadow-sm text-xs font-semibold uppercase tracking-wider appearance-none focus:outline-none focus:border-brand-gold"
                    id="sort-select-mobile"
                  >
                    {sortOptions.map(o => (
                      <option key={o.value} value={o.value}>Sort: {o.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Expanded filter panel (Mobile only) */}
            <motion.div
              initial={false}
              animate={{ height: filtersOpen ? 'auto' : 0, opacity: filtersOpen ? 1 : 0 }}
              className="overflow-hidden md:hidden"
            >
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 mb-6 space-y-6 shadow-sm">
                {/* Discount options */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2.5">Discounts</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'All Discounts', value: '' },
                      { label: 'Upto 10%', value: '1-10' },
                      { label: 'Upto 25%', value: '1-25' },
                      { label: 'Upto 50%', value: '1-50' },
                      { label: 'Above 50%', value: '51-100' }
                    ].map(d => {
                      const curVal = filters.minDiscount ? `${filters.minDiscount}-${filters.maxDiscount}` : '';
                      const isSel = curVal === d.value;
                      return (
                        <button
                          key={d.label}
                          type="button"
                          onClick={() => handleDiscountChange(d.value)}
                          className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                            isSel
                              ? 'bg-brand-gold text-white border-brand-gold font-semibold'
                              : 'bg-white text-neutral-700 border-neutral-200'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price range slider */}
                <div className="pt-4 border-t border-neutral-200">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3">Price Range</p>
                  <PriceRangeSlider
                    priceMin={priceRange.min}
                    priceMax={priceRange.max}
                    initialMin={Number(filters.minPrice) || priceRange.min}
                    initialMax={Number(filters.maxPrice) || priceRange.max}
                    fmt={fmt}
                    onApply={applyPriceRange}
                  />
                </div>

                {/* Category tree on mobile */}
                <div className="pt-4 border-t border-neutral-200">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3">Categories</p>
                  {renderCategoryTree(categories, slug, sub, subsub)}
                </div>

                {/* Apply / Close button */}
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="w-full py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-brand-gold transition-colors shadow-sm"
                >
                  Apply & View {total} Products
                </button>
              </div>
            </motion.div>

            {/* Product grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white shadow-sm">
                    <div className="skeleton aspect-[3/4]" />
                    <div className="p-4 space-y-2">
                      <div className="skeleton h-4 w-3/4" /><div className="skeleton h-4 w-1/2" /><div className="skeleton h-5 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-24 h-24 bg-brand-light flex items-center justify-center mb-6">
                  <Grid2X2 size={40} className="text-brand-grey" strokeWidth={1} />
                </div>
                <h2 className="font-playfair text-2xl mb-2">No products found</h2>
                <p className="text-brand-grey mb-6">Try adjusting your filters or browse a different category.</p>
                <button
                  onClick={() => {
                    setSearchParams({});
                    navigate('/products');
                  }}
                  className="btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div ref={revealRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {products.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12" aria-label="Pagination Navigation">
                    {/* Previous Page Button */}
                    <button
                      type="button"
                      onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={filters.page <= 1}
                      className="w-10 h-10 flex items-center justify-center font-medium text-sm transition-all border border-brand-light text-brand-grey hover:border-brand-gold hover:text-brand-gold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-brand-light disabled:hover:text-brand-grey"
                      aria-label="Previous page"
                      id="pagination-prev"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    {/* Page Numbers */}
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setFilters(prev => ({ ...prev, page: i + 1 }))}
                        className={`w-10 h-10 flex items-center justify-center font-medium text-sm transition-all ${filters.page === i + 1 ? 'bg-brand-text text-white' : 'border border-brand-light text-brand-grey hover:border-brand-gold hover:text-brand-gold'}`}
                        id={`page-${i+1}`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    {/* Next Page Button */}
                    <button
                      type="button"
                      onClick={() => setFilters(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                      disabled={filters.page >= totalPages}
                      className="w-10 h-10 flex items-center justify-center font-medium text-sm transition-all border border-brand-light text-brand-grey hover:border-brand-gold hover:text-brand-gold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-brand-light disabled:hover:text-brand-grey"
                      aria-label="Next page"
                      id="pagination-next"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default ProductListingPage;
