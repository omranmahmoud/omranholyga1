import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { deviceLanguage } from './deviceLanguage';
import { applyRtlIfNeeded } from './rtl';
import { COUNTRY_NAMES_AR, COUNTRY_NAMES_HE } from './countryNames';
import { COUNTRIES } from '../data/countries';

// Basic translation resources (extend as needed)
const resources = {
  en: {
    translation: {
      welcome: 'Welcome',
      loading: 'Loading...',
      navigation: {
        shop: 'Shop',
        category: 'Category',
        cart: 'Cart',
        me: 'Me',
        gift: 'gift'
      },
      common: {
        all: 'All',
        addToCart: 'Add to Cart',
        wishlist: 'Wishlist',
        close: 'Close',
        defaultSize: 'Default Size',
        size: 'Size',
        color: 'Color',
        trends: 'trends',
  highRepeat: 'High Repeat Customers',
  // freeShipping / flashSale removed per request
        categories: 'Categories',
  quickAdd: 'Quick add',
  errorMessage: 'Something went wrong.'
      },
      // Supplementary common keys used in new components
      commonExtra: {
        submit: 'Submit',
        error: 'Error',
        cancel: 'Cancel',
        ok: 'OK',
        limit: 'Limit',
        permission: 'Permission',
        showMore: 'Show More',
        showLess: 'Show Less'
      },
      reviews: {
        addYourReview: 'Add Your Review',
        validation: 'Please add a rating and a comment (min 10 chars).',
        commentPlaceholder: 'Share details of your experience...',
        addPhotos: 'Add photos',
        maxPhotos: 'Maximum {{count}} photos',
        photosPermission: 'We need photo library permission to select images.',
        report: 'Report',
        confirmReport: 'Report this review as inappropriate?',
        fit: 'Fit',
        fitScale: '1=Too Small 3=True 5=Too Large',
        quality: 'Quality',
        qualityScale: '1=Poor 5=Excellent'
      },
      profile: {
        title: 'Profile',
        welcome: 'Welcome, {{name}}',
        orderHistory: 'Order History',
        logout: 'Logout',
        guestMessage: 'You\'re browsing as a guest. Sign in to view your orders and manage your profile.',
        signIn: 'Sign In',
        createAccount: 'Create Account'
      },
      profileHeader: {
        myProfile: 'My Profile',
        edit: 'Edit',
        viewAll: 'View all',
        myOrders: 'My Orders',
        unpaid: 'Unpaid',
        processing: 'Processing',
        shipped: 'Shipped',
        review: 'Review',
        returns: 'Returns'
      },
      login: {
        title: 'Login',
        email: 'Email',
        password: 'Password',
        loggingIn: 'Logging in...',
        validationTitle: 'Validation',
        invalidEmail: 'Enter a valid email',
        invalidPassword: 'Password must be at least 6 characters',
        success: 'Login Success',
        welcomeUser: 'Welcome {{name}}',
        failed: 'Login Failed',
        skip: 'Skip for now',
  signupPrompt: "Don't have an account? Sign up",
  continueWithGoogle: 'Continue with Google',
  continueWithFacebook: 'Continue with Facebook',
  identifierPlaceholder: 'Email or Phone Number',
  continue: 'Continue'
      },
      auth: {
        agreeLine: 'By continuing, you agree to our',
        privacy: 'Privacy & Cookie Policy',
        and: 'and',
  terms: 'Terms & Conditions',
  dataProtected: 'Your data is protected.'
      },
      signup: {
        title: 'Sign Up',
        name: 'Name',
        email: 'Email',
        password: 'Password',
        signingUp: 'Signing up...',
        nameInvalid: 'Name must be at least 2 characters',
        emailInvalid: 'Invalid email',
        passwordInvalid: 'Min 6 character password',
        success: 'Signup Success',
        successLogin: 'Account created. Please log in.',
        welcome: 'Welcome',
  accountExists: 'Already have an account? Log in',
  continueWithGoogle: 'Continue with Google',
  continueWithFacebook: 'Continue with Facebook'
      },
      product: {
        sold: '{{count}}+ sold'
      },
      banner: {
  cozy: { title: 'Cozy Season Deals', subtitle: '500K+ Top Sellers', cta: 'Save Now' },
  // flash banner removed
  new: { title: 'New Arrivals', subtitle: 'Fresh Styles', cta: 'Discover' },
        carouselLabel: 'Promotional banners carousel',
        bannerFallback: 'Banner'
      },
      home: {
        featured: 'Featured',
        newArrivals: 'New Arrivals',
        topRated: 'Top Rated',
        signInEnjoy: 'Sign in and enjoy more',
        signIn: 'Sign In',
        searchProductsA11y: 'Search products'
      },
      productList: {
        recommend: 'Recommend',
        mostPopular: 'Most Popular',
        price: 'Price',
        filter: 'Filter',
        clear: 'Clear',
        done: 'Done',
        productType: 'Product Type',
        category: 'Category',
        priceRange: 'Price Range ({{currency}})',
        min: 'Min',
        max: 'Max',
        searchProducts: 'Search products...',
        size: 'Size',
        patternType: 'Pattern Type',
  color: 'Color',
  scrollTop: 'Scroll to top'
      },
      cart: {
        title: 'Cart',
        selectItems: 'Select items',
        selectItemsMsg: 'Please select at least one item to checkout.',
        orderPlaced: 'Order Placed',
        orderPlacedMsg: 'Your order has been placed successfully!',
        checkoutFailed: 'Checkout Failed',
        all: 'All',
        manage: 'Manage',
        done: 'Done',
        moveToWishlist: 'Move to Wishlist',
        delete: 'Delete',
        empty: 'Your cart is empty.',
        signInSync: 'Log in to synchronize your shopping cart',
        youMightLike: 'You Might Like to Fill it With',
  shipTo: 'Ship to {{country}}',
  checkout: 'Checkout'
      },
      checkout: {
        shippingAddress: 'Shipping Address',
        location: 'Location',
        detecting: 'Detecting...',
  retryDetect: 'Retry detection',
        firstName: 'First Name',
        lastName: 'Last Name',
        phone: 'Phone Number',
        phonePlaceholder: 'Your phone',
        phoneHint: 'Need correct phone number for delivery.',
        city: 'City',
        state: 'State/Province (Optional)',
        zip: 'Post/Zip Code',
        address1: 'Address Line 1*',
        address2: 'Address Line 2',
  continue: 'Continue',
  save: 'SAVE',
  makeDefault: 'Make Default',
  securityTitle: 'Security & Privacy',
  securityDesc: 'We maintain industry-standard physical, technical, and administrative measures to safeguard your personal information.',
  privacyPolicy: 'Privacy & Cookie Policy',
  paymentMethod: 'Payment Method',
  paymentSecure: 'All data is encrypted',
  creditDebitCard: 'Credit/Debit Card',
  cashOnDelivery: 'Cash on Delivery',
  applyCoupon: 'Apply Coupon',
  giftCard: 'Gift Card',
  couponCode: 'Coupon Code',
  giftCardCode: 'Gift Card Code',
  apply: 'Apply',
  remove: 'Remove',
  discountApplied: 'Discount Applied',
  invalidCoupon: 'Invalid or expired coupon',
  giftBalance: 'Balance: {{balance}}',
  giftApplied: 'Gift card applied',
  invalidGiftCard: 'Invalid or empty gift card',
  amountApplied: 'Applied: {{amount}}',
  myCoupons: 'My Coupons',
  availableCoupons: 'Available',
  unavailableCoupons: 'Not Available',
  onlyOneCoupon: 'Only one coupon can be used per order.',
  emptyCoupons: 'It is empty here :-(',
  viewMore: 'View More',
  viewLess: 'View Less',
  retailPrice: 'Retail Price',
  shippingFee: 'Shipping Fee',
  shippingGuarantee: 'Shipping Guarantee',
  promotions: 'Promotions',
  orderTotal: 'Order Total',
  saved: 'Saved {{amount}}',
  rewardPoints: 'Reward {{points}} Points',
  shopSafely: 'Shop Safely and Sustainably',
  secureDelivery: 'Secure Delivery Guarantee',
  securePayment: 'Secure Your Payment',
  customerSupport: 'Customer Support',
  placeOrder: 'Place Order',
  onlyLeft: '{{count}} Item(s) only few left'
      },
      countries: {
        PS: 'Palestine',
        US: 'United States',
        GB: 'United Kingdom',
        AE: 'United Arab Emirates',
        SA: 'Saudi Arabia',
        EG: 'Egypt',
        JO: 'Jordan',
        IL: 'Israel'
      },
      wishlistScreen: {
        introTitle: "Let's get started!",
        introDesc: 'These best-selling styles are your ticket to the hottest posts ever. To buy or not to buy?',
        youMayAlsoLike: 'You May Also Like',
  remove: 'Remove',
  title: 'Wishlist',
  empty: 'It is empty here.',
  heartIt: 'Heart It.',
  line1: 'Store everything you love on one page.',
  line2: 'Think about it before purchasing it.',
  line3: 'Get notification about out-of-stock items.'
      },
      search: {
        placeholder: 'Search',
        recently: 'Recently Searched',
        clearRecent: 'Clear recent searches',
        trending: 'Trending',
        new: 'New',
        popular: 'Popular'
      },
      productDetails: {
        addedToCart: 'Added to Cart',
  addedToCartMsg: '{{name}} has been added to your cart.',
  fiveStarRating: '5-star Rating',
  fiveStarReviews: '{{count}}+ 5-star Reviews',
  bestsellerRank: '#{{rank}} Bestseller',
  color: 'Color',
  size: 'Size',
  option: 'Option {{index}}',
  sizeOption: 'Size {{index}}',
  headerPromo: 'LLcp4 Code 90off'
      },
      categoriesMap: {
        // slug_or_backend_name: Translated Display
        women: 'Women',
        men: 'Men',
        kids: 'Kids',
        electronics: 'Electronics',
        beauty: 'Beauty',
        home: 'Home & Living',
        sports: 'Sports',
        accessories: 'Accessories'
      },
    }
  },
  ar: {
    translation: {
      welcome: 'مرحبا',
      loading: 'جار التحميل...',
      navigation: {
        shop: 'المتجر',
        category: 'الفئات',
        cart: 'السلة',
        me: 'حسابي',
        gift: 'هدية'
      },
      common: {
        all: 'الكل',
        addToCart: 'أضف إلى السلة',
        wishlist: 'المفضلة',
        close: 'إغلاق',
        defaultSize: 'المقاس الافتراضي',
        size: 'المقاس',
        color: 'اللون',
        trends: 'رائج',
  highRepeat: 'معدل إعادة شراء مرتفع',
  // freeShipping / flashSale removed
        categories: 'الفئات',
  quickAdd: 'إضافة سريعة',
  errorMessage: 'حدث خطأ ما.'
      },
      commonExtra: {
        submit: 'إرسال',
        error: 'خطأ',
        cancel: 'إلغاء',
        ok: 'موافق',
        limit: 'حد',
        permission: 'إذن',
        showMore: 'عرض المزيد',
        showLess: 'عرض أقل'
      },
      reviews: {
        addYourReview: 'أضف مراجعتك',
        validation: 'الرجاء إضافة تقييم وتعليق (10 أحرف على الأقل).',
        commentPlaceholder: 'شارك تجربتك بالتفصيل...',
        addPhotos: 'أضف صور',
        maxPhotos: 'الحد الأقصى {{count}} صور',
        photosPermission: 'نحتاج إذن للوصول للصور.',
        report: 'إبلاغ',
        confirmReport: 'الإبلاغ عن هذه المراجعة غير لائقة؟',
        fit: 'المقاس',
        fitScale: '1 صغير جداً 3 مناسب 5 كبير',
        quality: 'الجودة',
        qualityScale: '1 ضعيف 5 ممتاز'
      },
      profile: {
        title: 'الملف الشخصي',
        welcome: 'مرحباً، {{name}}',
        orderHistory: 'سجل الطلبات',
        logout: 'تسجيل الخروج',
        guestMessage: 'أنت تتصفح كضيف. سجّل الدخول لعرض طلباتك وإدارة حسابك.',
        signIn: 'تسجيل الدخول',
        createAccount: 'إنشاء حساب'
      },
      profileHeader: {
        myProfile: 'ملفي',
        edit: 'تعديل',
        viewAll: 'عرض الكل',
        myOrders: 'طلباتي',
        unpaid: 'غير مدفوع',
        processing: 'قيد المعالجة',
        shipped: 'تم الشحن',
        review: 'مراجعة',
        returns: 'الإرجاعات'
      },
      login: {
        title: 'تسجيل الدخول',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        loggingIn: 'جاري تسجيل الدخول...',
        validationTitle: 'تحقق',
        invalidEmail: 'أدخل بريداً إلكترونياً صحيحاً',
        invalidPassword: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
        success: 'تم تسجيل الدخول بنجاح',
        welcomeUser: 'مرحباً {{name}}',
        failed: 'فشل تسجيل الدخول',
        skip: 'تخطي الآن',
  signupPrompt: 'ليس لديك حساب؟ سجّل',
  continueWithGoogle: 'المتابعة مع جوجل',
  continueWithFacebook: 'المتابعة مع فيسبوك',
  identifierPlaceholder: 'البريد الإلكتروني أو رقم الهاتف',
  continue: 'متابعة'
      },
      auth: {
        agreeLine: 'بمتابعتك فإنك توافق على',
        privacy: 'سياسة الخصوصية وملفات تعريف الارتباط',
        and: 'و',
  terms: 'الشروط والأحكام',
  dataProtected: 'بياناتك محمية.'
      },
      signup: {
        title: 'إنشاء حساب',
        name: 'الاسم',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        signingUp: 'جاري إنشاء الحساب...',
        nameInvalid: 'يجب أن يكون الاسم حرفين على الأقل',
        emailInvalid: 'بريد إلكتروني غير صالح',
        passwordInvalid: 'كلمة المرور 6 أحرف على الأقل',
        success: 'تم إنشاء الحساب',
        successLogin: 'تم إنشاء الحساب. الرجاء تسجيل الدخول.',
        welcome: 'مرحباً',
  accountExists: 'لديك حساب؟ سجل الدخول',
  continueWithGoogle: 'المتابعة مع جوجل',
  continueWithFacebook: 'المتابعة مع فيسبوك'
      },
      product: {
        sold: '{{count}}+ مبيع'
      },
      banner: {
  cozy: { title: 'عروض الموسم الدافئ', subtitle: 'أكثر من 500 ألف من الأفضل مبيعاً', cta: 'وفر الآن' },
  // flash banner removed
  new: { title: 'وصل حديثاً', subtitle: 'تصاميم جديدة', cta: 'اكتشف' },
        carouselLabel: 'شريط لافتات ترويجية',
        bannerFallback: 'لافتة'
      },
      home: {
        featured: 'مميزة',
        newArrivals: 'وصل حديثاً',
        topRated: 'أعلى تقييماً',
        signInEnjoy: 'سجّل الدخول وتمتع بالمزيد',
        signIn: 'تسجيل الدخول',
        searchProductsA11y: 'ابحث عن المنتجات'
      },
      productList: {
        recommend: 'مقترح',
        mostPopular: 'الأكثر شيوعاً',
        price: 'السعر',
        filter: 'تصفية',
        clear: 'مسح',
        done: 'تم',
        productType: 'نوع المنتج',
        category: 'الفئة',
        priceRange: 'نطاق السعر ({{currency}})',
        min: 'الأدنى',
        max: 'الأعلى',
        searchProducts: 'ابحث عن المنتجات...',
        size: 'المقاس',
        patternType: 'نوع النمط',
  color: 'اللون',
  scrollTop: 'الرجوع للأعلى'
      },
      cart: {
        title: 'السلة',
        selectItems: 'حدد العناصر',
        selectItemsMsg: 'الرجاء اختيار عنصر واحد على الأقل لإتمام الشراء.',
        orderPlaced: 'تم الطلب',
        orderPlacedMsg: 'تم تقديم طلبك بنجاح!',
        checkoutFailed: 'فشل إتمام الشراء',
        all: 'الكل',
        manage: 'إدارة',
        done: 'تم',
        moveToWishlist: 'انقل إلى المفضلة',
        delete: 'حذف',
        empty: 'عربة التسوق فارغة.',
        signInSync: 'قم بتسجيل الدخول لمزامنة عربة التسوق الخاصة بك',
        youMightLike: 'قد ترغب بإضافتها',
  shipTo: 'الشحن إلى {{country}}',
  checkout: 'إتمام الشراء'
      },
      checkout: {
        shippingAddress: 'عنوان الشحن',
        location: 'الموقع',
        detecting: 'جاري التحديد...',
  retryDetect: 'إعادة المحاولة',
        firstName: 'الاسم الأول',
        lastName: 'اسم العائلة',
        phone: 'رقم الهاتف',
        phonePlaceholder: 'رقمك',
        phoneHint: 'نحتاج رقم هاتف صحيح للتسليم.',
        city: 'المدينة',
        state: 'الولاية/المحافظة (اختياري)',
        zip: 'الرمز البريدي',
        address1: 'العنوان سطر 1*',
        address2: 'العنوان سطر 2',
  continue: 'متابعة',
  save: 'حفظ',
  makeDefault: 'اجعله افتراضياً',
  securityTitle: 'الأمان والخصوصية',
  securityDesc: 'نحافظ على تدابير مادية وتقنية وإدارية معيارية لحماية معلوماتك.',
  privacyPolicy: 'سياسة الخصوصية وملفات تعريف الارتباط',
  paymentMethod: 'طريقة الدفع',
  paymentSecure: 'جميع البيانات مشفرة',
  creditDebitCard: 'بطاقة ائتمان/خصم',
  cashOnDelivery: 'الدفع عند الاستلام',
  applyCoupon: 'تطبيق كوبون',
  giftCard: 'بطاقة هدية',
  couponCode: 'رمز الكوبون',
  giftCardCode: 'رمز بطاقة الهدية',
  apply: 'تطبيق',
  remove: 'إزالة',
  discountApplied: 'تم تطبيق الخصم',
  invalidCoupon: 'كوبون غير صالح أو منتهي',
  giftBalance: 'الرصيد: {{balance}}',
  giftApplied: 'تم تطبيق بطاقة الهدية',
  invalidGiftCard: 'بطاقة هدية غير صالحة أو فارغة',
  amountApplied: 'المبلغ المطبق: {{amount}}',
  myCoupons: 'كوبوناتي',
  availableCoupons: 'المتاحة',
  unavailableCoupons: 'غير المتاحة',
  onlyOneCoupon: 'يمكن استخدام كوبون واحد فقط لكل طلب.',
  emptyCoupons: 'لا يوجد شيء هنا :-(',
  viewMore: 'عرض المزيد',
  viewLess: 'عرض أقل',
  retailPrice: 'السعر التجزئة',
  shippingFee: 'رسوم الشحن',
  shippingGuarantee: 'ضمان الشحن',
  promotions: 'العروض',
  orderTotal: 'إجمالي الطلب',
  saved: 'تم التوفير {{amount}}',
  rewardPoints: 'سوف تكسب {{points}} نقطة',
  shopSafely: 'تسوق بأمان واستدامة',
  secureDelivery: 'ضمان تسليم آمن',
  securePayment: 'أمان الدفع',
  customerSupport: 'دعم العملاء',
  placeOrder: 'تأكيد الطلب',
  onlyLeft: '{{count}} عنصر متبقٍ عدد قليل'
      },
      countries: {
        PS: 'فلسطين',
        US: 'الولايات المتحدة',
        GB: 'المملكة المتحدة',
        AE: 'الإمارات العربية المتحدة',
        SA: 'المملكة العربية السعودية',
        EG: 'مصر',
        JO: 'الأردن',
        IL: 'إسرائيل'
      },
      wishlistScreen: {
        introTitle: 'لنبدأ!',
        introDesc: 'هذه الأنماط الأكثر مبيعاً تذكرتك لأروع الإطلالات. تشتري أم لا؟',
        youMayAlsoLike: 'قد يعجبك أيضاً',
  remove: 'إزالة',
  title: 'المفضلة',
  empty: 'لا يوجد شيء هنا.',
  heartIt: 'ضع إشارة إعجاب.',
  line1: 'احفظ كل ما تحبه في صفحة واحدة.',
  line2: 'فكر فيه قبل الشراء.',
  line3: 'احصل على إشعارات عن العناصر غير المتوفرة.'
      },
      search: {
        placeholder: 'بحث',
        recently: 'بحثت مؤخراً',
        clearRecent: 'مسح السجل',
        trending: 'رائج',
        new: 'جديد',
        popular: 'شائع'
      },
      productDetails: {
        addedToCart: 'أضيفت إلى السلة',
  addedToCartMsg: '{{name}} تمت إضافته إلى سلتك.',
  fiveStarRating: 'تقييم 5 نجوم',
  fiveStarReviews: '{{count}}+ مراجعات 5 نجوم',
  bestsellerRank: '#{{rank}} الأكثر مبيعاً',
  color: 'اللون',
  size: 'المقاس',
  option: 'خيار {{index}}',
  sizeOption: 'مقاس {{index}}',
  headerPromo: 'LLcp4 كود خصم 90'
      },
      categoriesMap: {
        women: 'نساء',
        men: 'رجال',
        kids: 'أطفال',
        electronics: 'إلكترونيات',
        beauty: 'جمال',
        home: 'المنزل والمعيشة',
        sports: 'رياضة',
        accessories: 'إكسسوارات'
      },
    }
  },
  he: {
    translation: {
      welcome: 'ברוך הבא',
      loading: 'טוען...',
      navigation: {
        shop: 'חנות',
        category: 'קטגוריות',
        cart: 'עגלה',
        me: 'החשבון שלי',
        gift: 'מתנה'
      },
      common: {
        all: 'הכל',
        addToCart: 'הוסף לעגלה',
        wishlist: 'מועדפים',
        close: 'סגור',
        defaultSize: 'מידה ברירת מחדל',
        size: 'מידה',
        color: 'צבע',
        trends: 'חם',
  highRepeat: 'לקוחות חוזרים רבים',
  // freeShipping / flashSale removed
        categories: 'קטגוריות',
        quickAdd: 'הוספה מהירה',
        errorMessage: 'משהו השתבש.'
      },
      commonExtra: {
        submit: 'שלח',
        error: 'שגיאה',
        cancel: 'בטל',
        ok: 'אישור',
        limit: 'מגבלה',
        permission: 'הרשאה',
        showMore: 'הצג עוד',
        showLess: 'הצג פחות'
      },
      reviews: {
        addYourReview: 'הוסף את הביקורת שלך',
        validation: 'אנא הוסף דירוג והערה (לפחות 10 תווים).',
        commentPlaceholder: 'שתף פרטים מהחוויה שלך...',
        addPhotos: 'הוסף תמונות',
        maxPhotos: 'מקסימום {{count}} תמונות',
        photosPermission: 'נדרש אישור לגשת לספריית התמונות.',
        report: 'דווח',
        confirmReport: 'לדווח על ביקורת זו כלא הולמת?',
        fit: 'מידה',
        fitScale: '1 קטן מדי 3 מתאים 5 גדול',
        quality: 'איכות',
        qualityScale: '1 נמוכה 5 מצוינת'
      },
      profile: {
        title: 'פרופיל',
        welcome: 'ברוך הבא, {{name}}',
        orderHistory: 'היסטוריית הזמנות',
        logout: 'יציאה',
        guestMessage: 'אתה גולש כאורח. היכנס כדי לראות את ההזמנות שלך ולנהל את הפרופיל.',
        signIn: 'התחברות',
        createAccount: 'יצירת חשבון'
      },
      login: {
        title: 'התחברות',
        email: 'אימייל',
        password: 'סיסמה',
        loggingIn: 'מתחבר...',
        validationTitle: 'אימות',
        invalidEmail: 'הזן אימייל תקין',
        invalidPassword: 'הסיסמה חייבת להיות באורך 6 תווים לפחות',
        success: 'התחברת בהצלחה',
        welcomeUser: 'ברוך הבא {{name}}',
        failed: 'ההתחברות נכשלה',
        skip: 'דלג לעכשיו',
  signupPrompt: 'אין לך חשבון? הירשם',
  continueWithGoogle: 'המשך עם Google',
  continueWithFacebook: 'המשך עם Facebook',
  identifierPlaceholder: 'אימייל או מספר טלפון',
  continue: 'המשך'
      },
      signup: {
        title: 'הרשמה',
        name: 'שם',
        email: 'אימייל',
        password: 'סיסמה',
        signingUp: 'נרשם...',
        nameInvalid: 'השם חייב להיות באורך 2 תווים לפחות',
        emailInvalid: 'אימייל לא תקין',
        passwordInvalid: 'סיסמה באורך 6 תווים לפחות',
        success: 'נרשמת בהצלחה',
        successLogin: 'החשבון נוצר. אנא התחבר.',
        welcome: 'ברוך הבא',
        accountExists: 'כבר יש לך חשבון? התחבר',
        continueWithGoogle: 'המשך עם Google',
        continueWithFacebook: 'המשך עם Facebook'
      },
      auth: {
        agreeLine: 'בהמשך אתה מסכים ל',
        privacy: 'מדיניות פרטיות ועוגיות',
        and: 'ו',
  terms: 'תנאים והגבלות',
  dataProtected: 'הנתונים שלך מוגנים.'
      },
      product: {
        sold: '{{count}}+ נמכר'
      },
      banner: {
  cozy: { title: 'מבצעי עונת חורף', subtitle: '500K+ הנמכרים ביותר', cta: 'חסוך עכשיו' },
  // flash banner removed
  new: { title: 'הגעות חדשות', subtitle: 'סגנונות רעננים', cta: 'גלה' },
        carouselLabel: 'קרוסלת באנרים פרסומיים',
        bannerFallback: 'באנר'
      },
      home: {
        featured: 'נבחרים',
        newArrivals: 'הגעות חדשות',
        topRated: 'מדורגים גבוה',
        signInEnjoy: 'התחבר ותהנה יותר',
        signIn: 'התחברות',
        searchProductsA11y: 'חפש מוצרים'
      },
      productList: {
        recommend: 'מומלץ',
        mostPopular: 'הפופולריים ביותר',
        price: 'מחיר',
        filter: 'סינון',
        clear: 'נקה',
        done: 'סיום',
        productType: 'סוג מוצר',
        category: 'קטגוריה',
        priceRange: 'טווח מחירים ({{currency}})',
        min: 'מינ',
        max: 'מקס',
        searchProducts: 'חפש מוצרים...',
        size: 'מידה',
        patternType: 'סוג דוגמה',
  color: 'צבע',
  scrollTop: 'גלול למעלה'
      },
      cart: {
        title: 'עגלה',
        selectItems: 'בחר פריטים',
        selectItemsMsg: 'בחר לפחות פריט אחד לקופה.',
        orderPlaced: 'הזמנה בוצעה',
        orderPlacedMsg: 'ההזמנה שלך בוצעה בהצלחה!',
        checkoutFailed: 'התשלום נכשל',
        all: 'הכל',
        manage: 'ניהול',
        done: 'סיום',
        moveToWishlist: 'העבר למועדפים',
        delete: 'מחק',
        empty: 'העגלה שלך ריקה.',
        signInSync: 'היכנס כדי לסנכרן את עגלת הקניות שלך',
        youMightLike: 'אולי תאהב להוסיף',
  shipTo: 'משלוח ל{{country}}',
  checkout: 'לתשלום'
      },
      checkout: {
        shippingAddress: 'כתובת משלוח',
        location: 'מיקום',
        detecting: 'מאתר...',
  retryDetect: 'נסה שוב',
        firstName: 'שם פרטי',
        lastName: 'שם משפחה',
        phone: 'מספר טלפון',
        phonePlaceholder: 'הטלפון שלך',
        phoneHint: 'נדרש מספר טלפון נכון למשלוח.',
        city: 'עיר',
        state: 'מדינה/מחוז (רשות)',
        zip: 'מיקוד',
        address1: 'שורת כתובת 1*',
        address2: 'שורת כתובת 2',
  continue: 'המשך',
  save: 'שמור',
  makeDefault: 'הפוך לברירת מחדל',
  securityTitle: 'אבטחה ופרטיות',
  securityDesc: 'אנו שומרים על אמצעים סטנדרטיים כדי להגן על המידע האישי שלך.',
  privacyPolicy: 'מדיניות פרטיות ועוגיות',
  paymentMethod: 'אמצעי תשלום',
  paymentSecure: 'כל הנתונים מוצפנים',
  creditDebitCard: 'כרטיס אשראי/חיוב',
  cashOnDelivery: 'תשלום במזומן בשליח',
  applyCoupon: 'החל קופון',
  giftCard: 'כרטיס מתנה',
  couponCode: 'קוד קופון',
  giftCardCode: 'קוד כרטיס מתנה',
  apply: 'החל',
  remove: 'הסר',
  discountApplied: 'ההנחה הוחלה',
  invalidCoupon: 'קופון לא תקין או שפג תוקפו',
  giftBalance: 'יתרה: {{balance}}',
  giftApplied: 'כרטיס מתנה הופעל',
  invalidGiftCard: 'כרטיס מתנה לא תקין או ריק',
  amountApplied: 'הוחל: {{amount}}',
  myCoupons: 'הקופונים שלי',
  availableCoupons: 'זמינים',
  unavailableCoupons: 'לא זמינים',
  onlyOneCoupon: 'ניתן להשתמש בקופון אחד בלבד להזמנה.',
  emptyCoupons: 'ריק כאן :-(',
  viewMore: 'הצג עוד',
  viewLess: 'הצג פחות',
  retailPrice: 'מחיר קמעונאי',
  shippingFee: 'דמי משלוח',
  shippingGuarantee: 'אחריות משלוח',
  promotions: 'מבצעים',
  orderTotal: 'סה"כ הזמנה',
  saved: 'נחסך {{amount}}',
  rewardPoints: 'תגמול {{points}} נקודות',
  shopSafely: 'קנה בבטחה ובקיימות',
  secureDelivery: 'אחריות משלוח מאובטח',
  securePayment: 'אבטחת תשלום',
  customerSupport: 'תמיכת לקוחות',
  placeOrder: 'בצע הזמנה',
  onlyLeft: '{{count}} פריטים נותרו מעט'
      },
      countries: {
        PS: 'פלסטין',
        US: 'ארצות הברית',
        GB: 'הממלכה המאוחדת',
        AE: 'איחוד האמירויות',
        SA: 'ערב הסעודית',
        EG: 'מצרים',
        JO: 'ירדן',
        IL: 'ישראל'
      },
      wishlistScreen: {
        introTitle: 'בוא נתחיל!',
        introDesc: 'הסגנונות הנמכרים ביותר הם הכרטיס שלך לפוסטים הלוהטים. לקנות או לא?',
        youMayAlsoLike: 'ייתכן שתאהב גם',
  remove: 'הסר',
  title: 'מועדפים',
  empty: 'ריק כאן.',
  heartIt: 'סמן בלב.',
  line1: 'שמור הכל שאהבת בעמוד אחד.',
  line2: 'תחשוב על זה לפני הקנייה.',
  line3: 'קבל התראות על פריטים שאזלו מהמלאי.'
      },
      search: {
        placeholder: 'חיפוש',
        recently: 'חיפושים אחרונים',
        clearRecent: 'נקה חיפושים אחרונים',
        trending: 'חם',
        new: 'חדש',
        popular: 'פופולרי'
      },
      productDetails: {
        addedToCart: 'נוסף לעגלה',
  addedToCartMsg: '{{name}} נוסף לעגלה שלך.',
  fiveStarRating: 'דירוג 5 כוכבים',
  fiveStarReviews: '{{count}}+ ביקורות 5 כוכבים',
  bestsellerRank: '#{{rank}} רב מכר',
  color: 'צבע',
  size: 'מידה',
  option: 'אפשרות {{index}}',
  sizeOption: 'מידה {{index}}',
  headerPromo: 'LLcp4 קוד 90off'
      },
      categoriesMap: {
        women: 'נשים',
        men: 'גברים',
        kids: 'ילדים',
        electronics: 'אלקטרוניקה',
        beauty: 'יופי',
        home: 'בית וחיים',
        sports: 'ספורט',
        accessories: 'אקססוריז'
      },
    }
  }
};

// Use extracted detector
const primaryLang = deviceLanguage;

// Initialize i18next
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v4',
      resources,
      lng: primaryLang,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      defaultNS: 'translation',
    })
    .then(() => applyRtlIfNeeded(i18n.language))
    .catch(err => console.warn('i18n init error', err));
  // Dynamically add extended country names if not present
  const addCountries = (lang: string, map: Record<string,string>) => {
    Object.entries(map).forEach(([code, name]) => {
      const key = `countries.${code}`;
      const existing = i18n.getResource(lang, 'translation', key);
      if (!existing) i18n.addResource(lang, 'translation', key, name);
    });
  };
  addCountries('ar', COUNTRY_NAMES_AR);
  addCountries('he', COUNTRY_NAMES_HE);
  // Ensure every country code has a translation key (fallback English) for ar & he
  ['ar','he'].forEach(lang => {
    COUNTRIES.forEach(c => {
      const key = `countries.${c.code}`;
      const existing = i18n.getResource(lang, 'translation', key);
      if (!existing) {
        // Use Arabic/Hebrew map if exists else English name as placeholder
        const alt = (lang === 'ar' ? COUNTRY_NAMES_AR[c.code] : COUNTRY_NAMES_HE[c.code]) || c.name;
        i18n.addResource(lang, 'translation', key, alt);
      }
    });
  });
}

export default i18n;
// Helper: resolve a backend category name/slug to localized label
export function tCategory(raw?: string) {
  if (!raw) return raw;
  const key = raw.trim().toLowerCase();
  // Try exact match
  const map = (i18n.getResource(i18n.language, 'translation', 'categoriesMap') as Record<string,string>) || {};
  if (map[key]) return map[key];
  // Slug variant replacements (e.g., spaces to dashes) fallback
  const normalized = key.replace(/\s+/g, '-');
  if (map[normalized]) return map[normalized];
  return raw; // fallback to original name
}

// Dynamically register backend categories as fallback translations so UI can still use tCategory
export function registerCategoryNames(cats: { name?: string; slug?: string }[] = []) {
  if (!Array.isArray(cats) || cats.length === 0) return;
  const langs = i18n.languages && i18n.languages.length ? i18n.languages : ['en'];
  cats.forEach(c => {
    const raw = c?.slug || c?.name;
    const display = c?.name || raw;
    if (!raw || !display) return;
    const key = raw.trim().toLowerCase();
    langs.forEach(l => {
      const existing = i18n.getResource(l, 'translation', `categoriesMap.${key}`);
      if (!existing) {
        i18n.addResource(l, 'translation', `categoriesMap.${key}`, display);
      }
    });
  });
}