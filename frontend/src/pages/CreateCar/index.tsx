import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { decodeEventLog } from 'viem';
import { usePublicClient } from 'wagmi';
import {
  X, Check, Loader2, Sparkles, Car, Settings, FileCheck,
  ChevronRight, ImagePlus, Info, Coins, Package, PercentIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { RequireWallet } from '@/components/wallet/RequireWallet';
import { useCreateCar } from '@/hooks/contracts/useCarShares';
import { CarSharesABI } from '@/contracts/abis/CarShares';
import { useCreateCarApi } from '@/hooks/api/useCarsApi';
import { useReportCarCreated } from '@/hooks/api/useBlockchainReportApi';
import { useIPFS } from '@/hooks/useIPFS';
import { parseEth, percentToBps } from '@/lib/utils';
import type { CarMetadata } from '@/types';

interface CreateCarFormData {
  name: string;
  description: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  mileage: number;
  color: string;
  totalSupply: number;
  publicRatio: number;
  pricePerShare: string;
  minPrimaryBuy: number;
}

const createCarSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  vin: z.string().min(11, 'VIN must be at least 11 characters'),
  mileage: z.coerce.number().min(0),
  color: z.string().min(1, 'Color is required'),
  totalSupply: z.coerce.number().min(1, 'Total supply must be at least 1'),
  publicRatio: z.coerce.number().min(0).max(100, 'Public ratio must be 0-100'),
  pricePerShare: z.string().min(1, 'Price is required'),
  minPrimaryBuy: z.coerce.number().min(1, 'Minimum buy must be at least 1'),
});

const steps = [
  { id: 1, title: 'Car Details', description: 'Vehicle information', icon: Car },
  { id: 2, title: 'Tokenization', description: 'Share settings', icon: Settings },
  { id: 3, title: 'Review', description: 'Confirm & create', icon: FileCheck },
];

export function CreateCar() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dbSaved, setDbSaved] = useState(false);

  const { uploadImage, uploadMetadata, uploadProgress, resetProgress } = useIPFS();
  const { createCar, hash, isPending, isConfirming, isSuccess, error, contractAddress } = useCreateCar();
  const { mutateAsync: saveCarToDb } = useCreateCarApi();
  const publicClient = usePublicClient();

  // Store form data + metadataCID so they're available after tx confirms
  const pendingCarData = useRef<{ form: CreateCarFormData; metadataCID: string } | null>(null);
  const { mutateAsync: reportCarCreated } = useReportCarCreated();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
  } = useForm<CreateCarFormData>({
    resolver: zodResolver(createCarSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      vin: '',
      mileage: 0,
      color: '',
      totalSupply: 1000,
      publicRatio: 70,
      pricePerShare: '',
      minPrimaryBuy: 1,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (data: CreateCarFormData) => {
    setSubmitError(null);
    resetProgress();

    if (!imageFile) {
      setSubmitError('Please upload a car image');
      return;
    }

    if (!contractAddress) {
      setSubmitError('Contract not configured for this network. Please switch to Hoodi testnet.');
      return;
    }

    try {
      const imageCID = await uploadImage(imageFile);
      if (!imageCID) throw new Error('Failed to upload image');

      const metadata: CarMetadata = {
        name: data.name,
        description: data.description,
        image: `ipfs://${imageCID}`,
        attributes: [
          { trait_type: 'Make', value: data.make },
          { trait_type: 'Model', value: data.model },
          { trait_type: 'Year', value: data.year },
          { trait_type: 'VIN', value: data.vin },
          { trait_type: 'Mileage', value: data.mileage },
          { trait_type: 'Color', value: data.color },
        ],
      };

      const metadataCID = await uploadMetadata(metadata);
      if (!metadataCID) throw new Error('Failed to upload metadata');

      // Store form data + metadataCID so the useEffect can save to DB after tx confirms
      pendingCarData.current = { form: data, metadataCID };

      createCar(
        BigInt(data.totalSupply),
        BigInt(percentToBps(data.publicRatio)),
        parseEth(data.pricePerShare),
        BigInt(data.minPrimaryBuy),
        metadataCID
      );
    } catch (err) {
      console.error('Error creating car:', err);
      setSubmitError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const [dbError, setDbError] = useState<string | null>(null);

  // After on-chain tx confirms, decode CarCreated event and save car to database
  useEffect(() => {
    if (!isSuccess || !hash || !publicClient || !pendingCarData.current || dbSaved) return;

    const saveToDb = async () => {
      try {
        setDbError(null);
        const receipt = await publicClient.getTransactionReceipt({ hash });

        // Decode CarCreated event from logs to get the on-chain carId
        let carId: number | null = null;
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: CarSharesABI,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'CarCreated') {
              carId = Number((decoded.args as { carId: bigint }).carId);
              break;
            }
          } catch {
            // Not a CarCreated event, skip
          }
        }

        if (carId === null) {
          setDbError('Could not find CarCreated event in tx receipt');
          console.error('Could not find CarCreated event in tx receipt');
          return;
        }

        const { form, metadataCID } = pendingCarData.current!;

        await saveCarToDb({
          id: carId,
          name: form.name,
          make: form.make,
          model: form.model,
          year: form.year,
          vin: form.vin,
          totalShares: form.totalSupply,
          pricePerShare: parseEth(form.pricePerShare).toString(),
          metadataCID,
        });

        // Also report car-created to create ShareHolding + Transaction records
        const publicSupply = Math.round(form.totalSupply * form.publicRatio / 100);
        await reportCarCreated({
          txHash: hash,
          carId,
          totalShares: form.totalSupply,
          publicSupply,
          pricePerShare: parseEth(form.pricePerShare).toString(),
        });

        setDbSaved(true);
        console.log(`Car #${carId} saved to database successfully (car + holdings + tx)`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error saving to database';
        setDbError(msg);
        console.error('Failed to save car to database:', err);
      }
    };

    saveToDb();
  }, [isSuccess, hash, publicClient, dbSaved, saveCarToDb, reportCarCreated]);

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-success/20 to-emerald-500/20 mx-auto mb-8 border border-success/20">
              <Check className="h-12 w-12 text-success" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-text-primary mb-4">
              Car Created Successfully!
            </h1>
            <p className="text-text-secondary mb-4 leading-relaxed max-w-md mx-auto">
              Your car has been tokenized and is now available for purchase on the platform.
              Investors can start buying shares immediately.
            </p>
            {!dbSaved && !dbError && (
              <div className="flex items-center justify-center gap-2 text-yellow-400 mb-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Saving to database...</span>
              </div>
            )}
            {dbSaved && (
              <p className="text-sm text-success mb-6">Saved to database successfully.</p>
            )}
            {dbError && (
              <p className="text-sm text-red-400 mb-6">DB save error: {dbError}</p>
            )}
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/discover')} variant="glow" size="lg">
                View Cars
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => window.location.reload()}>
                Create Another
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header Section */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Create New</span>
            </motion.div>

            <h1 className="font-heading text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Tokenize Your{' '}
              <span className="text-gradient">Vehicle</span>
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed max-w-xl mx-auto">
              Transform your vehicle into tokenized shares and offer fractional ownership to investors.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <RequireWallet>
            {/* Progress Steps */}
            <div className="mb-12">
              <div className="flex justify-between mb-6">
                {steps.map((s, index) => (
                  <div key={s.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${
                          step >= s.id
                            ? 'bg-primary text-white shadow-lg shadow-primary/25'
                            : 'bg-surface border border-border text-text-muted'
                        }`}
                      >
                        <s.icon className="h-6 w-6" />
                      </div>
                      <div className="mt-3 text-center">
                        <p className={`font-medium text-sm ${step >= s.id ? 'text-primary' : 'text-text-muted'}`}>
                          {s.title}
                        </p>
                        <p className="text-xs text-text-muted hidden sm:block">{s.description}</p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-4 mt-[-28px] ${step > s.id ? 'bg-primary' : 'bg-border'}`} />
                    )}
                  </div>
                ))}
              </div>
              <Progress value={(step / 3) * 100} className="h-2" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-8 rounded-2xl bg-surface border border-border"
                >
                  <h2 className="font-heading text-xl font-bold text-text-primary mb-6">Car Details</h2>

                  {/* Image Upload */}
                  <div className="mb-6">
                    <Label className="text-sm font-medium text-text-secondary">Car Image</Label>
                    <div className="mt-2">
                      {imagePreview ? (
                        <div className="relative rounded-2xl overflow-hidden border border-border">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-56 object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-3 right-3 p-2 bg-surface/90 backdrop-blur-sm rounded-xl border border-border hover:bg-error/20 hover:border-error/50 hover:text-error transition-all"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-background-elevated hover:border-primary/50 transition-all group">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                            <ImagePlus className="h-8 w-8 text-primary" />
                          </div>
                          <span className="text-sm text-text-primary font-medium">
                            Click to upload image
                          </span>
                          <span className="text-xs text-text-muted mt-1">
                            PNG, JPG up to 10MB
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="2023 Porsche 911 GT3"
                        error={!!errors.name}
                        className="mt-2"
                      />
                      {errors.name && (
                        <p className="text-xs text-error mt-1">{errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="vin">VIN</Label>
                      <Input
                        id="vin"
                        {...register('vin')}
                        placeholder="WP0AC2A99KS123456"
                        error={!!errors.vin}
                        className="mt-2"
                      />
                      {errors.vin && (
                        <p className="text-xs text-error mt-1">{errors.vin.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      className="mt-2 min-h-[120px]"
                      placeholder="Describe your vehicle in detail..."
                      error={!!errors.description}
                    />
                    {errors.description && (
                      <p className="text-xs text-error mt-1">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                    <div>
                      <Label htmlFor="make">Make</Label>
                      <Input id="make" {...register('make')} placeholder="Porsche" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="model">Model</Label>
                      <Input id="model" {...register('model')} placeholder="911 GT3" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="year">Year</Label>
                      <Input id="year" type="number" {...register('year')} placeholder="2023" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="color">Color</Label>
                      <Input id="color" {...register('color')} placeholder="Miami Blue" className="mt-2" />
                    </div>
                    <div className="col-span-2 sm:col-span-2">
                      <Label htmlFor="mileage">Mileage</Label>
                      <Input
                        id="mileage"
                        type="number"
                        {...register('mileage')}
                        placeholder="5000"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-4 rounded-xl bg-error/10 border border-error/20 mb-4">
                      <p className="text-sm text-error">{submitError}</p>
                    </div>
                  )}

                  <div className="flex justify-end pt-8 border-t border-border mt-8">
                    <Button
                      type="button"
                      onClick={async () => {
                        if (!imageFile) {
                          setSubmitError('Please upload a car image');
                          return;
                        }
                        setSubmitError(null);
                        const valid = await trigger(['name', 'description', 'make', 'model', 'year', 'vin', 'mileage', 'color']);
                        if (valid) setStep(2);
                      }}
                      size="lg"
                      variant="glow"
                    >
                      Next: Tokenization
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-8 rounded-2xl bg-surface border border-border"
                >
                  <h2 className="font-heading text-xl font-bold text-text-primary mb-6">Tokenization Settings</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-5 rounded-xl bg-background-elevated border border-border/50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <Label htmlFor="totalSupply" className="font-semibold">Total Shares</Label>
                      </div>
                      <Input
                        id="totalSupply"
                        type="number"
                        {...register('totalSupply')}
                        error={!!errors.totalSupply}
                      />
                      <p className="text-xs text-text-muted mt-2">
                        Total number of shares to create
                      </p>
                    </div>

                    <div className="p-5 rounded-xl bg-background-elevated border border-border/50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                          <PercentIcon className="h-5 w-5 text-accent" />
                        </div>
                        <Label htmlFor="publicRatio" className="font-semibold">Public Sale (%)</Label>
                      </div>
                      <Input
                        id="publicRatio"
                        type="number"
                        {...register('publicRatio')}
                        error={!!errors.publicRatio}
                      />
                      <p className="text-xs text-text-muted mt-2">
                        Percentage available for public sale
                      </p>
                    </div>

                    <div className="p-5 rounded-xl bg-background-elevated border border-border/50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                          <Coins className="h-5 w-5 text-success" />
                        </div>
                        <Label htmlFor="pricePerShare" className="font-semibold">Price/Share (ETH)</Label>
                      </div>
                      <Input
                        id="pricePerShare"
                        {...register('pricePerShare')}
                        placeholder="0.01"
                        error={!!errors.pricePerShare}
                      />
                    </div>

                    <div className="p-5 rounded-xl bg-background-elevated border border-border/50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                          <Info className="h-5 w-5 text-info" />
                        </div>
                        <Label htmlFor="minPrimaryBuy" className="font-semibold">Min Purchase</Label>
                      </div>
                      <Input
                        id="minPrimaryBuy"
                        type="number"
                        {...register('minPrimaryBuy')}
                        error={!!errors.minPrimaryBuy}
                      />
                      <p className="text-xs text-text-muted mt-2">
                        Minimum shares per purchase
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-8 border-t border-border mt-8">
                    <Button type="button" variant="ghost" onClick={() => setStep(1)} size="lg">
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={async () => {
                        const valid = await trigger(['totalSupply', 'publicRatio', 'pricePerShare', 'minPrimaryBuy']);
                        if (valid) setStep(3);
                      }}
                      size="lg"
                      variant="glow"
                    >
                      Next: Review
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-8 rounded-2xl bg-surface border border-border"
                >
                  <h2 className="font-heading text-xl font-bold text-text-primary mb-6">Review & Create</h2>

                  <div className="rounded-xl bg-background-elevated border border-border/50 p-6 space-y-4 mb-6">
                    <h3 className="font-semibold text-lg text-text-primary mb-4">Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-3 border-b border-border">
                        <span className="text-text-muted">Name</span>
                        <span className="font-medium text-text-primary">{watch('name') || '-'}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-border">
                        <span className="text-text-muted">Total Shares</span>
                        <span className="font-medium font-mono text-text-primary">{watch('totalSupply')}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-border">
                        <span className="text-text-muted">Public Sale</span>
                        <span className="font-medium font-mono text-text-primary">{watch('publicRatio')}%</span>
                      </div>
                      <div className="flex justify-between py-3">
                        <span className="text-text-muted">Price per Share</span>
                        <span className="font-bold text-lg text-gradient-gold">{watch('pricePerShare') || '0'} ETH</span>
                      </div>
                    </div>
                  </div>

                  {uploadProgress.status === 'uploading' && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 mb-4">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-sm text-primary font-medium">Uploading to IPFS...</span>
                    </div>
                  )}

                  {!contractAddress && (
                    <div className="p-4 rounded-xl bg-error/10 border border-error/20 mb-4">
                      <p className="text-sm text-error">
                        Contract not configured for this network. Please switch to Holesky testnet.
                      </p>
                    </div>
                  )}

                  {submitError && (
                    <div className="p-4 rounded-xl bg-error/10 border border-error/20 mb-4">
                      <p className="text-sm text-error">{submitError}</p>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 rounded-xl bg-error/10 border border-error/20 mb-4">
                      <p className="text-sm text-error">
                        Contract Error: {error.message || 'Failed to create car. Please try again.'}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between pt-8 border-t border-border">
                    <Button type="button" variant="ghost" onClick={() => setStep(2)} size="lg">
                      Back
                    </Button>
                    <Button
                      type="submit"
                      isLoading={isPending || isConfirming || uploadProgress.status === 'uploading'}
                      size="lg"
                      variant="glow"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Create Car
                    </Button>
                  </div>
                </motion.div>
              )}
            </form>
          </RequireWallet>
        </motion.div>
      </div>
    </div>
  );
}
