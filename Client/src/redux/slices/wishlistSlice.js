import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const WISHLIST_STORAGE_KEY = 'billubazzar_wishlist';

const loadWishlistFromStorage = () => {
  try {
    const data = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!data) return [];
    const items = JSON.parse(data);
    return Array.isArray(items) ? items.map(item => {
      let sel = item.selectedVariant;
      if (typeof sel === 'string') {
        try { sel = JSON.parse(sel); } catch { sel = {}; }
      }
      return {
        ...item,
        selectedVariant: typeof sel === 'object' && sel !== null ? sel : {}
      };
    }) : [];
  } catch (err) {
    console.error('Failed to load wishlist from localStorage:', err);
    return [];
  }
};

const saveWishlistToStorage = (items) => {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save wishlist to localStorage:', err);
  }
};

const areVariantsEqual = (varA, varB) => {
  const a = varA || {};
  const b = varB || {};
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  return keysA.every(k => String(a[k]).toLowerCase() === String(b[k]).toLowerCase());
};

// Async Thunks for DB wishlist sync
export const fetchWishlist = createAsyncThunk('wishlist/fetchWishlist', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/customers/wishlist');
    if (res.data.success && Array.isArray(res.data.wishlist)) {
      const dbItems = res.data.wishlist.map(w => {
        const prod = w.product || {};
        const varItem = w.variant || {};
        let selVar = w.selectedVariant || {};
        if (typeof selVar === 'string') {
          try { selVar = JSON.parse(selVar); } catch { selVar = {}; }
        }
        if (typeof selVar !== 'object' || selVar === null) {
          selVar = {};
        }
        return {
          id: prod.id || w.productId,
          productId: prod.id || w.productId,
          variantId: varItem.id || w.variantId || null,
          selectedVariant: selVar,
          name: prod.productName || prod.name || 'Product',
          slug: prod.slug || '',
          image: varItem.image || prod.defaultProductImage || (prod.images && prod.images[0]) || '',
          price: parseFloat(varItem.price || prod.price || 0),
          comparePrice: varItem.mrp || prod.comparePrice ? parseFloat(varItem.mrp || prod.comparePrice) : null,
          inStock: varItem.stock ? varItem.stock > 0 : (prod.stock > 0),
          categoryName: prod.category?.name || 'Lifestyle',
          rating: 4.5,
          reviewCount: 10
        };
      });
      saveWishlistToStorage(dbItems);
      return dbItems;
    }
    return [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const toggleWishlistApi = createAsyncThunk('wishlist/toggleWishlistApi', async (payload, { dispatch, getState }) => {
  try {
    dispatch(wishlistSlice.actions.toggleItem(payload));
    const targetProductId = payload.productId || payload.id;
    await api.post('/customers/wishlist', {
      productId: targetProductId,
      variantId: payload.variantId || null,
      selectedVariant: payload.selectedVariant || {}
    });
  } catch (err) {
    console.warn('DB Wishlist Sync note (stored locally):', err.message);
  }
});

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { items: loadWishlistFromStorage(), loading: false },
  reducers: {
    setWishlist: (state, action) => {
      state.items = action.payload || [];
      saveWishlistToStorage(state.items);
    },
    toggleItem: (state, action) => {
      const payload = action.payload || {};
      const targetProductId = payload.productId || payload.id || payload;
      const targetVariantId = payload.variantId || null;
      let rawSel = payload.selectedVariant || null;
      if (typeof rawSel === 'string') {
        try { rawSel = JSON.parse(rawSel); } catch { rawSel = null; }
      }
      const targetSelectedVariant = (typeof rawSel === 'object' && rawSel !== null) ? rawSel : null;

      const idx = state.items.findIndex(item => {
        const sameProd = Number(item.productId || item.id) === Number(targetProductId);
        if (!sameProd) return false;
        if (targetVariantId || item.variantId) {
          return Number(item.variantId) === Number(targetVariantId);
        }
        const hasAttrsA = item.selectedVariant && Object.keys(item.selectedVariant).length > 0;
        const hasAttrsB = targetSelectedVariant && Object.keys(targetSelectedVariant).length > 0;
        if (hasAttrsA || hasAttrsB) {
          return areVariantsEqual(item.selectedVariant, targetSelectedVariant);
        }
        return true;
      });

      if (idx > -1) {
        state.items.splice(idx, 1);
      } else {
        const price = payload.variantPrice || payload.priceAtAdd || payload.price || payload.product?.price || 0;
        const comparePrice = payload.comparePrice || payload.product?.comparePrice || null;
        const image = payload.image || payload.productImage || payload.product?.image || (payload.images && payload.images[0]) || (payload.product?.images && payload.product.images[0]) || '';
        
        const unified = {
          id: targetProductId,
          productId: targetProductId,
          variantId: targetVariantId,
          selectedVariant: targetSelectedVariant || {},
          name: payload.name || payload.productName || payload.product?.name || 'Product',
          slug: payload.slug || payload.product?.slug || '',
          image,
          price: parseFloat(price),
          comparePrice: comparePrice ? parseFloat(comparePrice) : null,
          inStock: payload.inStock !== false,
          categoryName: payload.category?.name || payload.categoryName || 'Lifestyle',
          rating: payload.rating || 4.5,
          reviewCount: payload.reviewCount || 10
        };
        state.items.push(unified);
      }
      saveWishlistToStorage(state.items);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state) => {
        state.loading = false;
      });
  }
});

export const { setWishlist, toggleItem } = wishlistSlice.actions;
export default wishlistSlice.reducer;
