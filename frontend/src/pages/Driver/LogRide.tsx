import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Navigation, MapPin, Clock, DollarSign, ChevronLeft, ChevronRight,
  Car, CheckCircle2, Plus, Loader2, AlertCircle, Zap, Route
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlacesAutocomplete, type PlaceResult } from '@/components/ui/places-autocomplete';
import { useGeoapify, geoapifyRoute } from '@/hooks/useGoogleMaps';
import { useDriverProfile, useDriverRides, useLogRide } from '@/hooks/api/useDriverApi';
import { weiToEth } from '@/lib/utils';

// ─── Earnings rate constants (per km / per min in ETH) ───────────────────────
const BASE_FARE_ETH = 0.0005;        // base fare per ride
const RATE_PER_KM_ETH = 0.0003;      // per kilometre
const RATE_PER_MIN_ETH = 0.00005;    // per minute

function suggestEarnings(distanceKm: number, durationMin: number): string {
  if (distanceKm <= 0 && durationMin <= 0) return '';
  const estimated = BASE_FARE_ETH + (distanceKm * RATE_PER_KM_ETH) + (durationMin * RATE_PER_MIN_ETH);
  return estimated.toFixed(6);
}

export function LogRide() {
  const { data: driverProfile } = useDriverProfile();
  const { data: ridesResponse } = useDriverRides({ page: 1, limit: 5 });
  const logRideMutation = useLogRide();
  const { isReady: mapsReady } = useGeoapify();

  const assignedCars = driverProfile?.assignedCar ? [driverProfile.assignedCar] : [];
  const recentRides = ridesResponse?.data ?? [];

  const [selectedCar, setSelectedCar] = useState<number | null>(null);
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [pickupPlace, setPickupPlace] = useState<PlaceResult | null>(null);
  const [dropoffPlace, setDropoffPlace] = useState<PlaceResult | null>(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [earnings, setEarnings] = useState('');
  const [suggestedEarnings, setSuggestedEarnings] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // ─── Calculate route when both places are selected ─────────────────────────
  const calculateRoute = useCallback(async (origin: PlaceResult, destination: PlaceResult) => {
    if (!origin.lat || !destination.lat) return;

    setIsCalculating(true);
    setRouteError(null);

    try {
      const result = await geoapifyRoute(
        { lat: origin.lat, lng: origin.lng },
        { lat: destination.lat, lng: destination.lng },
      );

      if (result) {
        setDistance(result.distanceKm.toString());
        setDuration(result.durationMin.toString());

        // Suggest earnings
        const suggested = suggestEarnings(result.distanceKm, result.durationMin);
        setSuggestedEarnings(suggested);
        if (!earnings) {
          setEarnings(suggested);
        }
      } else {
        setRouteError('Could not calculate route. Please check the locations.');
      }
    } catch {
      setRouteError('Could not calculate route. Please check the locations.');
    } finally {
      setIsCalculating(false);
    }
  }, [earnings]);

  // Trigger route calculation when both places change
  useEffect(() => {
    if (pickupPlace?.lat && dropoffPlace?.lat) {
      calculateRoute(pickupPlace, dropoffPlace);
    }
  }, [pickupPlace, dropoffPlace, calculateRoute]);

  const handlePickupSelect = useCallback((place: PlaceResult) => {
    setPickupPlace(place.placeId ? place : null);
    if (!place.placeId) {
      setDistance('');
      setDuration('');
      setSuggestedEarnings('');
    }
  }, []);

  const handleDropoffSelect = useCallback((place: PlaceResult) => {
    setDropoffPlace(place.placeId ? place : null);
    if (!place.placeId) {
      setDistance('');
      setDuration('');
      setSuggestedEarnings('');
    }
  }, []);

  const handleSubmit = async () => {
    if (!selectedCar) return;
    setIsSubmitting(true);
    try {
      const grossWei = (parseFloat(earnings) * 1e18).toFixed(0);
      await logRideMutation.mutateAsync({
        carId: selectedCar,
        pickup: pickupLocation,
        dropoff: dropoffLocation,
        distance: parseFloat(distance) || 0,
        duration: parseInt(duration) || 0,
        grossEarnings: grossWei,
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setSelectedCar(null);
        setPickupLocation('');
        setDropoffLocation('');
        setPickupPlace(null);
        setDropoffPlace(null);
        setDistance('');
        setDuration('');
        setEarnings('');
        setSuggestedEarnings('');
      }, 3000);
    } catch (err) {
      console.error('Failed to log ride:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseSuggested = () => {
    setEarnings(suggestedEarnings);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-text-secondary bg-background-elevated border border-border hover:text-text-primary hover:border-primary/40 hover:bg-background-hover transition-all mb-6"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Navigation className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Log Ride</span>
            </div>

            <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Log a New Ride
            </h1>
            <p className="text-text-secondary">
              Record your completed rides to track earnings and share with vehicle owners.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl border border-border bg-surface p-6 md:p-8"
            >
              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="font-heading font-bold text-xl text-text-primary mb-2">
                    Ride Logged Successfully!
                  </h3>
                  <p className="text-text-secondary">
                    Your ride has been recorded and earnings will be distributed accordingly.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="font-heading font-bold text-xl text-text-primary mb-6">
                    Ride Details
                  </h2>

                  {/* Car Selection */}
                  <div className="mb-6">
                    <Label className="text-text-secondary mb-3 block">Select Vehicle</Label>
                    {assignedCars.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center rounded-xl border-2 border-dashed border-border">
                        <Car className="h-8 w-8 text-text-muted mb-2" />
                        <p className="text-sm text-text-muted">No vehicles assigned yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {assignedCars.map((car) => (
                          <button
                            key={car.id}
                            onClick={() => setSelectedCar(car.id)}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                              selectedCar === car.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-border-hover'
                            }`}
                          >
                            <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-background-elevated shrink-0">
                              <Car className="h-6 w-6 text-text-muted" />
                            </div>
                            <p className="text-sm font-medium text-text-primary text-left">{car.name}</p>
                            {selectedCar === car.id && (
                              <CheckCircle2 className="h-5 w-5 text-primary ml-auto shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Route — Geoapify Places Autocomplete */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Route className="h-5 w-5 text-primary" />
                      <span className="font-medium text-text-primary">Route</span>
                      {!mapsReady && (
                        <span className="text-xs text-warning ml-auto">API key missing — type manually</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <Label htmlFor="pickup" className="text-text-secondary">Pickup Location</Label>
                        <div className="mt-2">
                          {mapsReady ? (
                            <PlacesAutocomplete
                              id="pickup"
                              value={pickupLocation}
                              onChange={setPickupLocation}
                              onPlaceSelect={handlePickupSelect}
                              placeholder="Search pickup address..."
                              icon={<MapPin className="h-5 w-5 text-success" />}
                            />
                          ) : (
                            <Input
                              id="pickup"
                              value={pickupLocation}
                              onChange={(e) => setPickupLocation(e.target.value)}
                              placeholder="Enter pickup address"
                              inputSize="lg"
                              leftIcon={<MapPin className="h-5 w-5" />}
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="dropoff" className="text-text-secondary">Dropoff Location</Label>
                        <div className="mt-2">
                          {mapsReady ? (
                            <PlacesAutocomplete
                              id="dropoff"
                              value={dropoffLocation}
                              onChange={setDropoffLocation}
                              onPlaceSelect={handleDropoffSelect}
                              placeholder="Search dropoff address..."
                              icon={<MapPin className="h-5 w-5 text-error" />}
                            />
                          ) : (
                            <Input
                              id="dropoff"
                              value={dropoffLocation}
                              onChange={(e) => setDropoffLocation(e.target.value)}
                              placeholder="Enter dropoff address"
                              inputSize="lg"
                              leftIcon={<MapPin className="h-5 w-5" />}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Route calculation status */}
                    {isCalculating && (
                      <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-primary">Calculating route...</span>
                      </div>
                    )}
                    {routeError && (
                      <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-error/5 border border-error/10">
                        <AlertCircle className="h-4 w-4 text-error" />
                        <span className="text-sm text-error">{routeError}</span>
                      </div>
                    )}
                  </div>

                  {/* Distance & Duration — auto-filled, but still editable */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    <div>
                      <Label htmlFor="distance" className="text-text-secondary flex items-center gap-2">
                        Distance (km)
                        {pickupPlace && dropoffPlace && distance && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success font-medium">
                            Auto-calculated
                          </span>
                        )}
                      </Label>
                      <Input
                        id="distance"
                        type="number"
                        value={distance}
                        onChange={(e) => setDistance(e.target.value)}
                        placeholder="0.0"
                        className="mt-2"
                        inputSize="lg"
                        leftIcon={<Navigation className="h-5 w-5" />}
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration" className="text-text-secondary flex items-center gap-2">
                        Duration (minutes)
                        {pickupPlace && dropoffPlace && duration && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success font-medium">
                            Auto-calculated
                          </span>
                        )}
                      </Label>
                      <Input
                        id="duration"
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="0"
                        className="mt-2"
                        inputSize="lg"
                        leftIcon={<Clock className="h-5 w-5" />}
                      />
                    </div>
                  </div>

                  {/* Earnings with suggestion */}
                  <div className="mb-8">
                    <Label htmlFor="earnings" className="text-text-secondary">Earnings (ETH)</Label>
                    <Input
                      id="earnings"
                      type="number"
                      step="0.000001"
                      value={earnings}
                      onChange={(e) => setEarnings(e.target.value)}
                      placeholder="0.00"
                      className="mt-2"
                      inputSize="lg"
                      leftIcon={<DollarSign className="h-5 w-5" />}
                    />

                    {/* Earnings suggestion pill */}
                    {suggestedEarnings && (
                      <div className="flex items-center gap-3 mt-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
                        <Zap className="h-4 w-4 text-accent shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-text-primary">
                            Suggested fare: <span className="font-mono font-semibold text-accent">{suggestedEarnings} ETH</span>
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">
                            Based on {distance} km &middot; {duration} min (base + per-km + per-min)
                          </p>
                        </div>
                        {earnings !== suggestedEarnings && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleUseSuggested}
                            className="shrink-0 text-xs h-7"
                          >
                            Use Suggested
                          </Button>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-text-muted mt-2">
                      The suggested fare is an estimate. You can change it to the actual amount collected.
                    </p>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    variant="glow"
                    size="lg"
                    className="w-full"
                    disabled={!selectedCar || !pickupLocation || !dropoffLocation || !earnings}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Log Ride
                  </Button>
                </>
              )}
            </motion.div>
          </div>

          {/* Recent Rides Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-text-primary">Recent Rides</h3>
                </div>
              </div>

              <div className="divide-y divide-border">
                {recentRides.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Navigation className="h-8 w-8 text-text-muted mb-2" />
                    <p className="text-sm text-text-muted">No rides logged yet.</p>
                  </div>
                ) : (
                  recentRides.map((ride) => (
                    <div key={ride.id} className="p-4 hover:bg-background-elevated/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background-elevated shrink-0">
                          <Car className="h-5 w-5 text-text-muted" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary truncate">
                            {ride.car?.name ?? `Car #${ride.carId}`}
                          </p>
                          <p className="text-xs text-text-muted truncate">
                            {ride.pickup} &rarr; {ride.dropoff}
                          </p>
                          <p className="text-xs text-text-muted mt-1">
                            {new Date(ride.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="success" className="shrink-0">
                          +{weiToEth(ride.grossEarnings)} ETH
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-border">
                <Button variant="ghost" className="w-full">
                  View All Rides
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
