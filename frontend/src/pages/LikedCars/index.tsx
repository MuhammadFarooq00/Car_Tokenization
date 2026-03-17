import { motion } from 'framer-motion';
import { Heart, Car, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ApiCarCard } from '@/components/car/ApiCarCard';
import { useLikedCars } from '@/hooks/api/useLikes';

export function LikedCars() {
  const { likedCars, isLoading, likedCount } = useLikedCars();

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/discover">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10">
              <Heart className="h-5 w-5 text-error fill-error" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-2xl text-text-primary">
                Liked Cars
              </h1>
              <p className="text-sm text-text-muted">
                {likedCount === 0
                  ? 'No cars liked yet'
                  : `${likedCount} car${likedCount > 1 ? 's' : ''} in your collection`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-xl bg-surface border border-border animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && likedCount === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-error/10 mb-6">
            <Heart className="h-10 w-10 text-error/40" />
          </div>
          <h2 className="font-heading font-bold text-xl text-text-primary mb-2">
            No favourites yet
          </h2>
          <p className="text-text-muted text-sm mb-6 max-w-sm">
            Browse cars and tap the heart icon on any car to add it to your collection.
          </p>
          <Link to="/discover">
            <Button variant="default">
              <Car className="h-4 w-4 mr-2" />
              Discover Cars
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Car grid */}
      {!isLoading && likedCars.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {likedCars.map((car) => (
            <ApiCarCard key={car.id} car={car} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
