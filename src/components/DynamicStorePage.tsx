import { useState } from 'react';
import { usePageLayout } from '../context/PageLayoutContext';
import { Hero } from '../components/Hero';
import { Featured } from '../components/Featured/Featured';
import { CategorySlider } from '../components/Categories/CategorySlider';
import { CategoryGrid } from '../components/Categories/CategoryGrid';
import { HomepageSliders } from '../components/Homepage/HomepageSliders';
import { HomepageSideCategoryBanners } from '../components/Homepage/HomepageSideCategoryBanners';
import { NewArrivalsSection } from './Homepage/NewArrivalsSection';
import { CarouselWithSideBanners } from '../components/Homepage/CarouselWithSideBanners';
import { ProductGrid } from '../components/ProductGrid/ProductGrid';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { 
  Star, MapPin, Search, TrendingUp, Award, 
  CheckCircle, Clock, User, Camera, ArrowRight,
  AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';

// Dynamic section components
const DynamicTextSection = ({ settings }: { settings: any }) => (
  <section 
    className="py-16"
    style={{ backgroundColor: settings.backgroundColor || '#FFFFFF' }}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        {settings.title && (
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {settings.title}
          </h2>
        )}
        {settings.subtitle && (
          <p className="text-lg text-gray-600 mb-8">
            {settings.subtitle}
          </p>
        )}
        {settings.content && (
          <div 
            className="prose max-w-none mx-auto"
            dangerouslySetInnerHTML={{ __html: settings.content }}
          />
        )}
      </div>
    </div>
  </section>
);

const DynamicImageSection = ({ settings }: { settings: any }) => {
  const imageClasses = `
    ${settings.width === '3/4' ? 'w-3/4' : 
      settings.width === '1/2' ? 'w-1/2' : 
      settings.width === '1/3' ? 'w-1/3' : 
      settings.width === 'auto' ? 'w-auto' : 'w-full'}
    ${settings.objectFit === 'contain' ? 'object-contain' :
      settings.objectFit === 'fill' ? 'object-fill' :
      settings.objectFit === 'scale-down' ? 'object-scale-down' :
      settings.objectFit === 'none' ? 'object-none' : 'object-cover'}
    ${settings.aspectRatio === '16/9' ? 'aspect-video' :
      settings.aspectRatio === '4/3' ? 'aspect-[4/3]' :
      settings.aspectRatio === '1/1' ? 'aspect-square' :
      settings.aspectRatio === '3/2' ? 'aspect-[3/2]' :
      settings.aspectRatio === '21/9' ? 'aspect-[21/9]' : 'h-auto'}
    rounded-lg shadow-lg
  `;

  const ImageComponent = (
    <div className="relative">
      <img
        src={settings.imageUrl}
        alt={settings.altText || 'Image'}
        className={imageClasses}
        loading={settings.lazy ? 'lazy' : 'eager'}
      />
      {settings.caption && (
        <p className="text-sm text-gray-500 mt-4 italic">
          {settings.caption}
        </p>
      )}
    </div>
  );

  return (
    <section 
      className="py-16"
      style={{ backgroundColor: settings.backgroundColor || '#FFFFFF' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {settings.title && (
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              {settings.title}
            </h2>
          )}
          {settings.imageUrl && (
            settings.clickable && settings.linkUrl ? (
              <a href={settings.linkUrl} className="inline-block">
                {ImageComponent}
              </a>
            ) : (
              ImageComponent
            )
          )}
        </div>
      </div>
    </section>
  );
};

const DynamicVideoSection = ({ settings }: { settings: any }) => {
  const getVideoEmbedUrl = (url: string) => {
    // Convert YouTube URLs to embed format
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      const videoId = url.includes('youtu.be/') 
        ? url.split('youtu.be/')[1].split('?')[0]
        : url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Convert Vimeo URLs to embed format
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1].split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    // Return direct video URL as is
    return url;
  };

  const isEmbedVideo = settings.videoUrl && (
    settings.videoUrl.includes('youtube.com') || 
    settings.videoUrl.includes('youtu.be') || 
    settings.videoUrl.includes('vimeo.com')
  );

  const aspectRatioMap: Record<'16:9' | '4:3' | '1:1' | '21:9', string> = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    '21:9': 'aspect-[21/9]'
  };
  const arKey = (settings.aspectRatio as '16:9' | '4:3' | '1:1' | '21:9') || '16:9';
  const aspectRatioClass = aspectRatioMap[arKey] || 'aspect-video';

  return (
    <section 
      className="py-16"
      style={{ backgroundColor: settings.backgroundColor || '#FFFFFF' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {settings.title && (
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              {settings.title}
            </h2>
          )}
          
          {settings.videoUrl && (
            <div className={`relative ${aspectRatioClass} max-w-4xl mx-auto`}>
              {isEmbedVideo ? (
                <iframe
                  src={getVideoEmbedUrl(settings.videoUrl)}
                  className="absolute inset-0 w-full h-full rounded-lg"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Video"
                />
              ) : (
                <video
                  src={settings.videoUrl}
                  className="absolute inset-0 w-full h-full rounded-lg object-cover"
                  controls={settings.controls !== false}
                  autoPlay={settings.autoplay || false}
                  muted={settings.muted || false}
                  loop={settings.loop || false}
                  poster={settings.posterUrl}
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}
          
          {settings.description && (
            <p className="text-gray-600 mt-6 max-w-2xl mx-auto">
              {settings.description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

const DynamicBannerSection = ({ settings }: { settings: any }) => (
  <section 
    className="py-4"
    style={{ 
      backgroundColor: settings.backgroundColor || '#EF4444',
      color: settings.textColor || '#FFFFFF'
    }}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="font-medium">
          {settings.text || '🎉 Special Offer! Free shipping on orders over $50'}
        </p>
      </div>
    </div>
  </section>
);

const DynamicCountdownSection = ({ settings }: { settings: any }) => {
  const targetDate = new Date(settings.targetDate || Date.now() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const timeDiff = targetDate.getTime() - now.getTime();
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

  return (
    <section 
      className="py-16"
      style={{ backgroundColor: settings.backgroundColor || '#1F2937' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {settings.title || 'Limited Time Offer!'}
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            {settings.subtitle || 'Hurry up! Sale ends in:'}
          </p>
          <div className="flex justify-center space-x-4">
            {[
              { label: 'Days', value: days },
              { label: 'Hours', value: hours },
              { label: 'Minutes', value: minutes },
              { label: 'Seconds', value: seconds }
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-lg p-4 min-w-[80px]">
                <div className="text-2xl font-bold text-gray-900">
                  {item.value.toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const DynamicNewsletterSection = ({ settings }: { settings: any }) => (
  <section 
    className="py-16"
    style={{ backgroundColor: settings.backgroundColor || '#F3F4F6' }}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {settings.title || 'Stay in the Loop'}
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          {settings.subtitle || 'Subscribe to our newsletter for the latest updates and exclusive offers'}
        </p>
        <div className="max-w-md mx-auto">
          <div className="flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition-colors">
              Subscribe
            </button>
          </div>
          {settings.showBenefits && (
            <div className="mt-4 text-sm text-gray-500">
              <p>✓ Exclusive deals  ✓ New product alerts  ✓ Style tips</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </section>
);

const DynamicTestimonialsSection = ({ settings }: { settings: any }) => {
  const testimonials = [
    {
      text: "Amazing quality and fast delivery! Highly recommend this store.",
      author: "Sarah Johnson",
      rating: 5
    },
    {
      text: "Great customer service and beautiful products. Will shop again!",
      author: "Mike Chen",
      rating: 5
    },
    {
      text: "Love the variety and competitive prices. My go-to store now.",
      author: "Emma Davis",
      rating: 5
    }
  ];

  return (
    <section 
      className="py-16"
      style={{ backgroundColor: settings.backgroundColor || '#FFFFFF' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {settings.title || 'What Our Customers Say'}
          </h2>
          <p className="text-lg text-gray-600">
            {settings.subtitle || 'Real reviews from real customers'}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-6">
              {settings.showRatings && (
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
              )}
              <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
              <p className="font-medium text-gray-900">- {testimonial.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// New Advanced Components
const DynamicGallerySection = ({ settings }: { settings: any }) => {
  const images: { url: string; alt: string }[] = (settings.images as { url: string; alt: string }[]) || [
    { url: '/placeholder-image.jpg', alt: 'Gallery Image 1' },
    { url: '/placeholder-image.jpg', alt: 'Gallery Image 2' },
    { url: '/placeholder-image.jpg', alt: 'Gallery Image 3' },
    { url: '/placeholder-image.jpg', alt: 'Gallery Image 4' },
  ];

  return (
    <section className="py-16" style={{ backgroundColor: settings.backgroundColor || '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {settings.title && (
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{settings.title}</h2>
            {settings.subtitle && <p className="text-lg text-gray-600">{settings.subtitle}</p>}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image: { url: string; alt: string }, index: number) => (
            <div key={index} className="relative group cursor-pointer">
              <img 
                src={image.url} 
                alt={image.alt}
                className="w-full h-48 object-cover rounded-lg transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
                <Camera className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const DynamicBlogSection = ({ settings }: { settings: any }) => {
  const posts = [
    {
      title: "10 Tips for Better Shopping",
      excerpt: "Discover the best ways to find great deals and quality products.",
      date: "2025-07-15",
      image: "/placeholder-image.jpg"
    },
    {
      title: "Summer Collection Launch",
      excerpt: "Check out our latest summer arrivals and trending styles.",
      date: "2025-07-10",
      image: "/placeholder-image.jpg"
    },
    {
      title: "Customer Success Stories",
      excerpt: "Read about how our products made a difference for customers.",
      date: "2025-07-05",
      image: "/placeholder-image.jpg"
    }
  ];

  return (
    <section className="py-16" style={{ backgroundColor: settings.backgroundColor || '#F9FAFB' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {settings.title || 'Latest Blog Posts'}
          </h2>
          <p className="text-lg text-gray-600">
            {settings.subtitle || 'Stay updated with our latest news and insights'}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <article key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
              <div className="p-6">
                <div className="text-sm text-gray-500 mb-2">{post.date}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h3>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <button className="text-indigo-600 font-medium hover:text-indigo-700">
                  Read More →
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

const DynamicTeamSection = ({ settings }: { settings: any }) => {
  const teamMembers = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      image: "/placeholder-image.jpg",
      bio: "Leading the company with 10+ years of experience"
    },
    {
      name: "Mike Chen",
      role: "CTO",
      image: "/placeholder-image.jpg",
      bio: "Technical visionary driving innovation"
    },
    {
      name: "Emma Davis",
      role: "Head of Design",
      image: "/placeholder-image.jpg",
      bio: "Creating beautiful user experiences"
    }
  ];

  return (
    <section className="py-16" style={{ backgroundColor: settings.backgroundColor || '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {settings.title || 'Meet Our Team'}
          </h2>
          <p className="text-lg text-gray-600">
            {settings.subtitle || 'The talented people behind our success'}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="text-center">
              <div className="relative mb-4">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
              <p className="text-indigo-600 font-medium mb-2">{member.role}</p>
              <p className="text-gray-600">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const DynamicStatsSection = ({ settings }: { settings: any }) => {
  const stats = [
    { value: "10K+", label: "Happy Customers", icon: User },
    { value: "500+", label: "Products Sold", icon: Star },
    { value: "99%", label: "Satisfaction Rate", icon: CheckCircle },
    { value: "24/7", label: "Customer Support", icon: Clock }
  ];

  return (
    <section className="py-16" style={{ backgroundColor: settings.backgroundColor || '#1F2937' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {settings.title && (
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">{settings.title}</h2>
            {settings.subtitle && <p className="text-lg text-gray-300">{settings.subtitle}</p>}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <IconComponent className="text-indigo-400" size={32} />
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-gray-300">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const DynamicPricingSection = ({ settings }: { settings: any }) => {
  const plans = [
    {
      name: "Basic",
      price: "$29",
      period: "/month",
      features: ["5 Products", "Basic Support", "1 Store"],
      popular: false
    },
    {
      name: "Pro",
      price: "$79",
      period: "/month",
      features: ["50 Products", "Priority Support", "3 Stores", "Analytics"],
      popular: true
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "/month",
      features: ["Unlimited Products", "24/7 Support", "Unlimited Stores", "Advanced Analytics", "Custom Integration"],
      popular: false
    }
  ];

  return (
    <section className="py-16" style={{ backgroundColor: settings.backgroundColor || '#F9FAFB' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {settings.title || 'Choose Your Plan'}
          </h2>
          <p className="text-lg text-gray-600">
            {settings.subtitle || 'Select the perfect plan for your business needs'}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div key={index} className={`bg-white rounded-lg shadow-lg overflow-hidden ${plan.popular ? 'ring-2 ring-indigo-500' : ''}`}>
              {plan.popular && (
                <div className="bg-indigo-500 text-white text-center py-2 font-medium">
                  Most Popular
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="text-green-500 mr-3" size={16} />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  plan.popular 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}>
                  Get Started
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const DynamicFeaturesSection = ({ settings }: { settings: any }) => {
  const features = [
    {
      icon: CheckCircle,
      title: "Easy to Use",
      description: "Intuitive interface that anyone can master"
    },
    {
      icon: TrendingUp,
      title: "Analytics Included",
      description: "Track your performance with detailed insights"
    },
    {
      icon: Award,
      title: "Award Winning",
      description: "Recognized by industry leaders worldwide"
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Get help whenever you need it"
    }
  ];

  return (
    <section className="py-16" style={{ backgroundColor: settings.backgroundColor || '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {settings.title || 'Why Choose Us'}
          </h2>
          <p className="text-lg text-gray-600">
            {settings.subtitle || 'Discover what makes us different'}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <IconComponent className="text-indigo-600" size={24} />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const DynamicTimelineSection = ({ settings }: { settings: any }) => {
  const events = [
    { year: "2020", title: "Company Founded", description: "Started with a simple idea" },
    { year: "2021", title: "First Product Launch", description: "Launched our flagship product" },
    { year: "2022", title: "10K Customers", description: "Reached our first major milestone" },
    { year: "2023", title: "International Expansion", description: "Expanded to 5 new countries" },
    { year: "2024", title: "Award Recognition", description: "Won industry excellence award" }
  ];

  return (
    <section className="py-16" style={{ backgroundColor: settings.backgroundColor || '#F9FAFB' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {settings.title || 'Our Journey'}
          </h2>
          <p className="text-lg text-gray-600">
            {settings.subtitle || 'The milestones that shaped our story'}
          </p>
        </div>
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-gray-300"></div>
          {events.map((event, index) => (
            <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'} mb-8`}>
              <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-sm font-medium text-indigo-600 mb-1">{event.year}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
                  <p className="text-gray-600">{event.description}</p>
                </div>
              </div>
              <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-indigo-600 rounded-full border-4 border-white"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const DynamicAccordionSection = ({ settings }: { settings: any }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  
  const items = [
    {
      title: "What is your return policy?",
      content: "We offer a 30-day return policy for all unused items in original condition."
    },
    {
      title: "How long does shipping take?",
      content: "Standard shipping takes 3-5 business days. Express shipping is 1-2 business days."
    },
    {
      title: "Do you offer international shipping?",
      content: "Yes, we ship to most countries worldwide. Shipping costs vary by location."
    },
    {
      title: "How can I track my order?",
      content: "You'll receive a tracking number via email once your order ships."
    }
  ];

  return (
    <section className="py-16" style={{ backgroundColor: settings.backgroundColor || '#FFFFFF' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {settings.title || 'Frequently Asked Questions'}
          </h2>
          <p className="text-lg text-gray-600">
            {settings.subtitle || 'Find answers to common questions'}
          </p>
        </div>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg">
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-medium text-gray-900">{item.title}</span>
                {openIndex === index ? (
                  <ChevronUp className="text-gray-500" size={20} />
                ) : (
                  <ChevronDown className="text-gray-500" size={20} />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600">{item.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const DynamicSearchSection = ({ settings }: { settings: any }) => {
  return (
    <section className="py-16" style={{ backgroundColor: settings.backgroundColor || '#F9FAFB' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {settings.title || 'Find What You\'re Looking For'}
          </h2>
          <p className="text-lg text-gray-600">
            {settings.subtitle || 'Search through our entire product catalog'}
          </p>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
          />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {['Electronics', 'Fashion', 'Home', 'Sports', 'Books'].map((tag) => (
            <button
              key={tag}
              className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

const DynamicMapSection = ({ settings }: { settings: any }) => {
  return (
    <section className="py-16" style={{ backgroundColor: settings.backgroundColor || '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {settings.title || 'Visit Our Store'}
          </h2>
          <p className="text-lg text-gray-600">
            {settings.subtitle || 'Find us at our physical location'}
          </p>
        </div>
        <div className="bg-gray-200 h-96 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">Interactive map will be displayed here</p>
            <p className="text-sm text-gray-500 mt-2">
              {settings.address || '123 Main Street, City, State 12345'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const DynamicCTASection = ({ settings }: { settings: any }) => {
  return (
    <section className="py-16" style={{ backgroundColor: settings.backgroundColor || '#1F2937' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          {settings.title || 'Ready to Get Started?'}
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          {settings.subtitle || 'Join thousands of satisfied customers today'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center">
            {settings.primaryButtonText || 'Get Started Now'}
            <ArrowRight className="ml-2" size={20} />
          </button>
          <button className="px-8 py-4 border border-gray-300 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
            {settings.secondaryButtonText || 'Learn More'}
          </button>
        </div>
      </div>
    </section>
  );
};

const DynamicDividerSection = ({ settings }: { settings: any }) => {
  return (
    <section className="py-8" style={{ backgroundColor: settings.backgroundColor || 'transparent' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          {settings.text && (
            <>
              <span className="px-4 text-gray-500 text-sm">{settings.text}</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

const DynamicSpacerSection = ({ settings }: { settings: any }) => {
  const height = settings.height || 60;
  return (
    <div style={{ height: `${height}px`, backgroundColor: settings.backgroundColor || 'transparent' }}>
    </div>
  );
};

const DynamicAlertSection = ({ settings }: { settings: any }) => {
  const alertTypes = {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: AlertCircle },
    success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: CheckCircle },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: AlertCircle },
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: AlertCircle }
  };

  const alertType = alertTypes[settings.type as keyof typeof alertTypes] || alertTypes.info;
  const IconComponent = alertType.icon;

  return (
    <section className="py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`${alertType.bg} ${alertType.border} border rounded-lg p-4`}>
          <div className="flex items-start">
            <IconComponent className={`${alertType.text} mr-3 mt-0.5`} size={20} />
            <div className={alertType.text}>
              <p className="font-medium">{settings.title || 'Information'}</p>
              {settings.message && <p className="mt-1">{settings.message}</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export function DynamicStorePage() {
  const { sections, isLoading } = usePageLayout();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const enabledSections = sections
    .filter(section => section.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen">
      {enabledSections.map((section) => {
        const sectionProps = {
          className: `section-${section.type}`,
          style: {
            animationName: section.animations?.entrance || 'fadeIn',
            animationDuration: `${section.animations?.duration || 600}ms`,
            animationDelay: `${section.animations?.delay || 0}ms`,
            animationFillMode: 'both'
          }
        };

        switch (section.type) {
          case 'sliders':
            return (
              <div key={section.id} {...sectionProps}>
                <section className="py-6" style={{ backgroundColor: section.settings.backgroundColor || '#FFFFFF' }}>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {section.settings.title && (
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">{section.settings.title}</h2>
                        {section.settings.subtitle && (
                          <p className="text-gray-600 mt-1">{section.settings.subtitle}</p>
                        )}
                      </div>
                    )}
                    <HomepageSliders />
                  </div>
                </section>
              </div>
            );
          
          case 'side-banners':
            return (
              <div key={section.id} {...sectionProps}>
                <section className="py-6" style={{ backgroundColor: section.settings.backgroundColor || '#FFFFFF' }}>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {section.settings.title && (
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">{section.settings.title}</h2>
                        {section.settings.subtitle && (
                          <p className="text-gray-600 mt-1">{section.settings.subtitle}</p>
                        )}
                      </div>
                    )}
                    <HomepageSideCategoryBanners />
                  </div>
                </section>
              </div>
            );
          case 'new-arrivals':
            return (
              <div key={section.id} {...sectionProps}>
                <NewArrivalsSection
                  title={section.settings.title || 'New Arrivals'}
                  subtitle={section.settings.subtitle}
                  maxRows={section.settings.maxRows || 2}
                  className={section.settings.customClass || ''}
                />
              </div>
            );
          case 'hero':
            return (
              <div key={section.id} {...sectionProps}>
                <Hero />
              </div>
            );

          case 'featured':
            return (
              <div key={section.id} {...sectionProps}>
                <section 
                  className="py-16"
                  style={{ backgroundColor: section.settings.backgroundColor || '#FFFFFF' }}
                >
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {section.settings.title && (
                      <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                          {section.settings.title}
                        </h2>
                        {section.settings.subtitle && (
                          <p className="text-lg text-gray-600">
                            {section.settings.subtitle}
                          </p>
                        )}
                      </div>
                    )}
                    <Featured />
                  </div>
                </section>
              </div>
            );

          case 'categories': {
            const displayStyle = section.settings.displayStyle || 'grid';
            const itemsPerRow = section.settings.itemsPerRow ?? 6;
            const showNames = section.settings.showNames !== false;
            return (
              <div key={section.id} {...sectionProps}>
                <section 
                  className="py-16"
                  style={{ backgroundColor: section.settings.backgroundColor || '#F9FAFB' }}
                >
                  <div className={`${displayStyle === 'slider' ? 'max-w-none lg:max-w-[1647px] mx-auto px-2 sm:px-4 lg:pl-4 lg:pr-0' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
                    {section.settings.title && (
                      <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                          {section.settings.title}
                        </h2>
                        {section.settings.subtitle && (
                          <p className="text-lg text-gray-600">
                            {section.settings.subtitle}
                          </p>
                        )}
                      </div>
                    )}
                    {displayStyle === 'slider' ? (
                      <CategorySlider
                        showHeader={false}
                        itemsToShow={itemsPerRow}
                        rows={section.settings.sliderRows ?? 2}
                        columns={section.settings.sliderColumns ?? 9}
                        forceExactColumns={section.settings.forceExactColumns === true}
                      />
                    ) : (
                      <CategoryGrid itemsPerRow={itemsPerRow} showNames={showNames} />
                    )}
                  </div>
                </section>
              </div>
            );
          }

          case 'products':
            return (
              <div key={section.id} {...sectionProps}>
                <section 
                  className="py-16"
                  style={{ backgroundColor: section.settings.backgroundColor || '#FFFFFF' }}
                >
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {section.settings.title && (
                      <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                          {section.settings.title}
                        </h2>
                        {section.settings.subtitle && (
                          <p className="text-lg text-gray-600">
                            {section.settings.subtitle}
                          </p>
                        )}
                      </div>
                    )}
                    <ProductGrid />
                  </div>
                </section>
              </div>
            );

          case 'text':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicTextSection settings={section.settings} />
              </div>
            );

          case 'image':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicImageSection settings={section.settings} />
              </div>
            );

          case 'video':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicVideoSection settings={section.settings} />
              </div>
            );

          case 'banner':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicBannerSection settings={section.settings} />
              </div>
            );

          case 'carousel-with-side-banners':
            return (
              <section key={section.id} className="py-2" style={{ backgroundColor: section.settings.backgroundColor || '#FFFFFF' }}>
                <CarouselWithSideBanners settings={{
                  title: section.settings.title,
                  subtitle: section.settings.subtitle,
                  autoPlay: section.settings.autoPlay,
                  intervalMs: section.settings.intervalMs,
                  showArrows: section.settings.showArrows,
                  showDots: section.settings.showDots,
                  centerHeight: section.settings.centerHeight,
                }} />
              </section>
            );
          case 'countdown':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicCountdownSection settings={section.settings} />
              </div>
            );

          case 'newsletter':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicNewsletterSection settings={section.settings} />
              </div>
            );

          case 'testimonials':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicTestimonialsSection settings={section.settings} />
              </div>
            );

          case 'gallery':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicGallerySection settings={section.settings} />
              </div>
            );

          case 'blog':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicBlogSection settings={section.settings} />
              </div>
            );

          case 'team':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicTeamSection settings={section.settings} />
              </div>
            );

          case 'stats':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicStatsSection settings={section.settings} />
              </div>
            );

          case 'pricing':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicPricingSection settings={section.settings} />
              </div>
            );

          case 'features':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicFeaturesSection settings={section.settings} />
              </div>
            );

          case 'timeline':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicTimelineSection settings={section.settings} />
              </div>
            );

          case 'accordion':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicAccordionSection settings={section.settings} />
              </div>
            );

          case 'search':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicSearchSection settings={section.settings} />
              </div>
            );

          case 'map':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicMapSection settings={section.settings} />
              </div>
            );

          case 'cta':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicCTASection settings={section.settings} />
              </div>
            );

          case 'divider':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicDividerSection settings={section.settings} />
              </div>
            );

          case 'spacer':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicSpacerSection settings={section.settings} />
              </div>
            );

          case 'alert':
            return (
              <div key={section.id} {...sectionProps}>
                <DynamicAlertSection settings={section.settings} />
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
