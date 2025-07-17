import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import SlideIndicators from './SlideIndicators';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  backgroundImage: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: 'Experience luxury with every ride',
    subtitle: 'The most professional and comfortable ride service I\'ve ever used. Consistently excellent experience every time.',
    backgroundImage: '/curated-lifestyle-g-wPCjUq8qU-unsplash.jpg?w=1920&q=80',
  },
  {
    id: 2,
    title: 'Premium vehicles for every occasion',
    subtitle: 'Our fleet features the latest luxury sedans and SUVs, meticulously maintained and equipped with premium amenities for your comfort.',
    backgroundImage: 'https://images.unsplash.com/photo-1692821565372-15f7219ede0b?w=1920&q=80',
  },
  {
    id: 3,
    title: 'Professional drivers you can trust',
    subtitle: 'Experienced, licensed chauffeurs with extensive background checks and local expertise to ensure your safety and punctuality.',
    backgroundImage: 'https://images.unsplash.com/photo-1642789663978-bd9fb6c1dc62?w=1920&q=80',
  },
];

interface HeroCarouselProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ onLoginClick, onSignupClick }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSlideChange = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative h-screen overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
        </div>
      ))}

      <div className="relative z-10 flex h-full flex-col px-5 pt-8 pb-10 md:px-10 md:pt-10 md:pb-[60px]">
        <div className="flex items-start justify-between">
          <img 
            src="/logo_white.png"
            alt="Stable Ride" 
            className="h-8 md:h-10 w-auto object-contain"
          />
          <SlideIndicators
            total={slides.length}
            current={currentSlide}
            onChange={handleSlideChange}
          />
        </div>

        <div className="flex flex-1 flex-col justify-between">
          <div className="mt-6 md:mt-8">
            <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
              {slides[currentSlide].title.split(' ').slice(0, 2).join(' ')}
              <br />
              {slides[currentSlide].title.split(' ').slice(2).join(' ')}
            </h1>
          </div>

          <div>
            <p className="mb-8 text-right text-base leading-relaxed text-white/90 md:text-center md:text-lg lg:max-w-2xl lg:mx-auto">
              {slides[currentSlide].subtitle}
            </p>

            <div className="flex flex-col gap-4 md:flex-row md:justify-center md:gap-6">
              <button
                onClick={onSignupClick}
                className="w-full rounded-full bg-white px-8 py-4 font-medium text-black transition-all hover:bg-white/90 md:w-auto"
              >
                Start booking my ride now
              </button>
              <button
                onClick={onLoginClick}
                className="group flex items-center justify-center gap-2 text-white transition-all hover:gap-3 md:px-4"
              >
                <span className="underline underline-offset-4">I already have an account</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;