import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles, TrendingUp, Verified } from 'lucide-react';

interface CardData {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  price: string;
  change: string;
  isPositive: boolean;
}

const cardsData: CardData[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400',
    title: '2024 Porsche 911 GT3',
    subtitle: 'Premium Sports',
    price: '0.025 ETH',
    change: '+12.5%',
    isPositive: true,
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400',
    title: '2023 Ferrari SF90',
    subtitle: 'Exotic Supercar',
    price: '0.048 ETH',
    change: '+8.2%',
    isPositive: true,
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400',
    title: '2024 BMW M4',
    subtitle: 'Luxury Performance',
    price: '0.015 ETH',
    change: '+5.7%',
    isPositive: true,
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400',
    title: '2024 Mercedes-AMG',
    subtitle: 'German Engineering',
    price: '0.022 ETH',
    change: '-2.1%',
    isPositive: false,
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=400',
    title: '2024 Lamborghini',
    subtitle: 'Italian Excellence',
    price: '0.035 ETH',
    change: '+15.3%',
    isPositive: true,
  },
];

interface DecorativeCardStackProps {
  variant?: 'primary' | 'accent';
  className?: string;
}

export function DecorativeCardStack({ variant = 'primary', className }: DecorativeCardStackProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-rotate cards
  useEffect(() => {
    if (isHovering) return; // Pause rotation on hover
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cardsData.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isHovering]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setMousePosition({ x: 0, y: 0 });
  };

  const getCardStyle = (index: number) => {
    const offset = (index - activeIndex + cardsData.length) % cardsData.length;

    // Base rotations for fan effect
    const baseRotations = [-12, 6, -4, 10, -8];
    const baseRotation = baseRotations[index % baseRotations.length];

    // Mouse influence - strongest on top card, decreasing for others
    const mouseInfluence = offset === 0 ? 18 : offset === 1 ? 10 : offset === 2 ? 5 : offset === 3 ? 2 : 0;
    const rotateY = mousePosition.x * mouseInfluence;
    const rotateX = -mousePosition.y * mouseInfluence;

    // Stack positioning with cascading effect
    let translateX = 0;
    let translateY = 0;
    let scale = 1;
    const zIndex = cardsData.length - offset;
    let opacity = 1;
    let blur = 0;

    switch (offset) {
      case 0: // Top card
        translateX = 0;
        translateY = 0;
        scale = 1;
        opacity = 1;
        break;
      case 1: // Second card
        translateX = 25;
        translateY = 18;
        scale = 0.94;
        opacity = 0.95;
        break;
      case 2: // Third card
        translateX = 48;
        translateY = 34;
        scale = 0.88;
        opacity = 0.85;
        break;
      case 3: // Fourth card
        translateX = 68;
        translateY = 48;
        scale = 0.82;
        opacity = 0.6;
        blur = 1;
        break;
      case 4: // Fifth card (barely visible)
        translateX = 85;
        translateY = 60;
        scale = 0.76;
        opacity = 0.3;
        blur = 2;
        break;
      default:
        opacity = 0;
    }

    return {
      zIndex,
      translateX,
      translateY,
      scale,
      rotation: baseRotation + offset * 3,
      rotateY,
      rotateX,
      opacity,
      blur,
    };
  };

  const isPrimary = variant === 'primary';
  const glowColor = isPrimary ? 'rgba(14, 165, 233, 0.4)' : 'rgba(212, 165, 116, 0.4)';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative w-[320px] h-[400px]',
        'select-none pointer-events-auto',
        className
      )}
      style={{ perspective: '1200px' }}
    >
      {/* Ambient glow effects */}
      <div
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'w-[280px] h-[320px] rounded-3xl blur-3xl',
          'transition-opacity duration-500',
          isHovering ? 'opacity-50' : 'opacity-30'
        )}
        style={{ background: `radial-gradient(ellipse at center, ${glowColor}, transparent 70%)` }}
      />

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              'absolute w-1.5 h-1.5 rounded-full',
              isPrimary ? 'bg-primary/60' : 'bg-accent/60'
            )}
            initial={{
              x: Math.random() * 280 + 20,
              y: Math.random() * 360 + 20,
              opacity: 0
            }}
            animate={{
              y: [null, Math.random() * -100 - 50],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* Cards */}
      {cardsData.map((card, index) => {
        const style = getCardStyle(index);
        const isTopCard = style.zIndex === cardsData.length;

        return (
          <motion.div
            key={card.id}
            className={cn(
              'absolute top-0 left-0 w-[220px] h-[300px]',
              'rounded-2xl overflow-hidden',
              'border-2 cursor-default select-none',
              isPrimary
                ? 'border-primary/40 shadow-[0_8px_32px_rgba(14,165,233,0.25)]'
                : 'border-accent/40 shadow-[0_8px_32px_rgba(212,165,116,0.25)]',
              isTopCard && isHovering && 'border-opacity-80'
            )}
            style={{
              zIndex: style.zIndex,
              transformStyle: 'preserve-3d',
              filter: style.blur > 0 ? `blur(${style.blur}px)` : undefined,
            }}
            animate={{
              x: style.translateX,
              y: style.translateY,
              scale: style.scale,
              rotateZ: style.rotation,
              rotateY: style.rotateY,
              rotateX: style.rotateX,
              opacity: style.opacity,
            }}
            transition={{
              type: 'spring',
              stiffness: 120,
              damping: 18,
              mass: 0.8,
            }}
          >
            {/* Card Background Image */}
            <div className="absolute inset-0">
              <img
                src={card.image}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />
              {/* Multi-layer gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
              <div className={cn(
                'absolute inset-0 bg-gradient-to-br opacity-60',
                isPrimary
                  ? 'from-primary/30 via-transparent to-transparent'
                  : 'from-accent/30 via-transparent to-transparent'
              )} />
            </div>

            {/* Top badge area */}
            <div
              className="absolute top-3 left-3 right-3 flex items-center justify-between"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none' }}
            >
              <div className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-md',
                'text-[9px] font-bold uppercase tracking-wider',
                isPrimary
                  ? 'bg-primary/30 text-primary-foreground border border-primary/30'
                  : 'bg-accent/30 text-accent-foreground border border-accent/30'
              )}>
                <Sparkles className="w-2.5 h-2.5" />
                Tokenized
              </div>
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/10 backdrop-blur-md border border-white/10">
                <Verified className="w-2.5 h-2.5 text-green-400" />
              </div>
            </div>

            {/* Card Content */}
            <div
              className="absolute inset-x-0 bottom-0 p-4"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none' }}
            >
              {/* Price & Change row */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-semibold text-white/90 bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm">
                  {card.price}
                </span>
                <span className={cn(
                  'flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                  card.isPositive
                    ? 'text-green-400 bg-green-500/20'
                    : 'text-red-400 bg-red-500/20'
                )}>
                  <TrendingUp className={cn('w-2.5 h-2.5', !card.isPositive && 'rotate-180')} />
                  {card.change}
                </span>
              </div>

              {/* Title */}
              <h4 className="font-heading font-bold text-sm text-white mb-0.5 line-clamp-1 drop-shadow-lg">
                {card.title}
              </h4>

              {/* Subtitle with decorative line */}
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-0.5 rounded-full',
                  isPrimary ? 'bg-primary' : 'bg-accent'
                )} />
                <p className="text-[11px] text-white/70 font-medium">
                  {card.subtitle}
                </p>
              </div>

              {/* Mini progress bar */}
              <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    isPrimary
                      ? 'bg-gradient-to-r from-primary to-sky-400'
                      : 'bg-gradient-to-r from-accent to-amber-400'
                  )}
                  initial={{ width: '0%' }}
                  animate={{ width: `${60 + (card.id * 8)}%` }}
                  transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] text-white/50 font-medium">Funded</span>
                <span className="text-[8px] text-white/70 font-mono font-semibold">{60 + (card.id * 8)}%</span>
              </div>
            </div>

            {/* Animated shine effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 55%, transparent 60%)',
                transform: `translateX(${-100 + mousePosition.x * 200}%)`,
              }}
            />

            {/* Edge highlight on hover */}
            {isTopCard && (
              <motion.div
                className={cn(
                  'absolute inset-0 rounded-2xl pointer-events-none',
                  'border-2',
                  isPrimary ? 'border-primary/50' : 'border-accent/50'
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovering ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </motion.div>
        );
      })}

      {/* Bottom decorative elements */}
      <motion.div
        className={cn(
          'absolute -bottom-6 -right-6 w-32 h-32 rounded-full blur-2xl',
          isPrimary ? 'bg-primary/40' : 'bg-accent/40'
        )}
        animate={{
          scale: isHovering ? 1.2 : 1,
          opacity: isHovering ? 0.5 : 0.3,
        }}
        transition={{ duration: 0.4 }}
      />
      <motion.div
        className={cn(
          'absolute -top-4 -left-4 w-20 h-20 rounded-full blur-xl',
          isPrimary ? 'bg-primary/30' : 'bg-accent/30'
        )}
        animate={{
          scale: isHovering ? 1.3 : 1,
          opacity: isHovering ? 0.4 : 0.2,
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Ring decoration */}
      <div
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'w-[350px] h-[350px] rounded-full',
          'border border-dashed opacity-20',
          isPrimary ? 'border-primary' : 'border-accent'
        )}
        style={{ transform: 'translate(-50%, -50%) rotate(45deg)' }}
      />
    </div>
  );
} 
