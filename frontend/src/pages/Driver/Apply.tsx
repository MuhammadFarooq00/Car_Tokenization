import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Gauge, Upload, FileText, Car, ChevronRight, ChevronLeft, Check,
  AlertCircle, CheckCircle2, Clock, Shield, Loader2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useCars } from '@/hooks/api/useCarsApi';
import { useApplyAsDriver } from '@/hooks/api/useDriverApi';
import { useCarMetadata } from '@/hooks/useCarMetadata';
import { getIpfsUrl, weiToEth } from '@/lib/utils';
import { api } from '@/lib/api-client';

// Sub-component to resolve IPFS image for car thumbnails
function CarThumbnail({ metadataCID, alt, className }: { metadataCID?: string; alt: string; className?: string }) {
  const { data: metadata } = useCarMetadata(metadataCID);
  const imageUrl = metadata?.image ? getIpfsUrl(metadata.image) : '/placeholder-car.svg';
  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className || 'w-full h-full object-cover'}
      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-car.svg'; }}
    />
  );
}

const STEPS = [
  { id: 1, title: 'Personal Info', icon: FileText },
  { id: 2, title: 'Documents', icon: Upload },
  { id: 3, title: 'Select Car', icon: Car },
  { id: 4, title: 'Review', icon: Check },
];

export function DriverApply() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form state
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experience, setExperience] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCar, setSelectedCar] = useState<number | null>(null);

  // Document upload state
  type DocKey = 'license' | 'insurance' | 'background';
  const [documents, setDocuments] = useState<Record<DocKey, { url: string; name: string } | null>>({
    license: null,
    insurance: null,
    background: null,
  });
  const [uploadingDoc, setUploadingDoc] = useState<DocKey | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const fileInputRefs: Record<DocKey, React.RefObject<HTMLInputElement | null>> = {
    license: licenseInputRef,
    insurance: insuranceInputRef,
    background: backgroundInputRef,
  };

  const handleDocUpload = async (key: DocKey, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File must be under 10 MB');
      return;
    }
    setUploadingDoc(key);
    setUploadError(null);
    try {
      const result = await api.uploadFile<{ url: string; originalName: string }>('/uploads/document', file);
      setDocuments((prev) => ({ ...prev, [key]: { url: result.url, name: result.originalName || file.name } }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleFileInputChange = (key: DocKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleDocUpload(key, file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const removeDocument = (key: DocKey) => {
    setDocuments((prev) => ({ ...prev, [key]: null }));
  };

  const allDocsUploaded = documents.license && documents.insurance && documents.background;

  // API hooks
  const { data: carsResponse, isLoading: carsLoading } = useCars({ page: 1, limit: 50 });
  const applyMutation = useApplyAsDriver();
  const availableCars = (carsResponse?.data ?? []).filter(c => c.status === 'active');

  const handleSubmit = async () => {
    if (!selectedCar) return;
    setIsSubmitting(true);
    try {
      await applyMutation.mutateAsync({
        carId: selectedCar,
        license: licenseNumber,
        experience: parseInt(experience) || 0,
        documents: {
          license: documents.license?.url ?? '',
          insurance: documents.insurance?.url ?? '',
          background: documents.background?.url ?? '',
        },
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error('Application failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto text-center px-4"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-success/20 to-primary/20 mx-auto mb-8 border border-success/20">
            <CheckCircle2 className="h-12 w-12 text-success" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-text-primary mb-4">
            Application Submitted!
          </h1>
          <p className="text-text-secondary leading-relaxed mb-8">
            Your driver application has been submitted successfully. We'll review your documents and get back to you within 2-3 business days.
          </p>
          <div className="p-4 rounded-xl bg-surface border border-border mb-8">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-warning" />
              <div className="text-left">
                <p className="font-medium text-text-primary">Application Status</p>
                <p className="text-sm text-text-muted">Under Review</p>
              </div>
              <Badge variant="warning" className="ml-auto">Pending</Badge>
            </div>
          </div>
          <Button asChild variant="glow">
            <Link to="/dashboard" className="inline-flex items-center gap-2">
              <span>Go to Dashboard</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-success/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-success/10 rounded-full blur-3xl" />

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

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-4">
              <Gauge className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-success">Driver Application</span>
            </div>

            <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Become a Driver
            </h1>
            <p className="text-text-secondary max-w-xl">
              Join our network of professional drivers and start earning by operating premium vehicles.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-10">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl font-medium transition-all ${
                        step > s.id
                          ? 'bg-success text-white'
                          : step === s.id
                          ? 'bg-primary text-white'
                          : 'bg-surface border border-border text-text-muted'
                      }`}
                    >
                      {step > s.id ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className="text-xs text-text-muted mt-2 hidden sm:block">{s.title}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-3 transition-colors ${
                        step > s.id ? 'bg-success' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {step === 1 && (
              <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
                <h2 className="font-heading font-bold text-xl text-text-primary mb-6">
                  Personal Information
                </h2>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label className="text-text-secondary">Full Name</Label>
                      <Input
                        value={user?.name || ''}
                        disabled
                        className="mt-2"
                        inputSize="lg"
                      />
                    </div>
                    <div>
                      <Label className="text-text-secondary">Email</Label>
                      <Input
                        value={user?.email || ''}
                        disabled
                        className="mt-2"
                        inputSize="lg"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-text-secondary">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="mt-2"
                      inputSize="lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="license" className="text-text-secondary">Driver's License Number</Label>
                    <Input
                      id="license"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="DL-XXXX-XXXX"
                      className="mt-2"
                      inputSize="lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="experience" className="text-text-secondary">Driving Experience (Years)</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="5"
                      className="mt-2"
                      inputSize="lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <Button onClick={() => setStep(2)} variant="glow" size="lg" className="inline-flex items-center gap-2">
                    <span>Continue</span>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
                <h2 className="font-heading font-bold text-xl text-text-primary mb-6">
                  Upload Documents
                </h2>

                {uploadError && (
                  <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                    {uploadError}
                  </div>
                )}

                <div className="space-y-6">
                  {([
                    { key: 'license' as DocKey, label: "Driver's License", hint: 'Front and back of your license' },
                    { key: 'insurance' as DocKey, label: 'Proof of Insurance', hint: 'Valid auto insurance document' },
                    { key: 'background' as DocKey, label: 'Background Check Consent', hint: 'Signed consent form' },
                  ]).map(({ key, label, hint }) => (
                    <div key={key}>
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRefs[key]}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                        className="hidden"
                        onChange={handleFileInputChange(key)}
                      />

                      {documents[key] ? (
                        /* Uploaded state */
                        <div className="p-4 rounded-xl border-2 border-green-500/40 bg-green-500/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-green-400 shrink-0" />
                            <div>
                              <p className="font-medium text-text-primary">{label}</p>
                              <p className="text-sm text-text-muted truncate max-w-[220px]">{documents[key]!.name}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeDocument(key)} className="text-text-muted hover:text-red-400">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        /* Upload zone */
                        <div
                          className="p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={() => fileInputRefs[key].current?.click()}
                        >
                          <div className="text-center">
                            {uploadingDoc === key ? (
                              <>
                                <div className="h-10 w-10 mx-auto mb-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                <p className="font-medium text-text-primary mb-1">Uploading…</p>
                              </>
                            ) : (
                              <>
                                <Upload className="h-10 w-10 text-text-muted mx-auto mb-3" />
                                <p className="font-medium text-text-primary mb-1">{label}</p>
                                <p className="text-sm text-text-muted mb-4">{hint}</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); fileInputRefs[key].current?.click(); }}
                                >
                                  Choose File
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between mt-8">
                  <Button onClick={() => setStep(1)} variant="ghost" size="lg" className="inline-flex items-center gap-2">
                    <ChevronLeft className="h-5 w-5" />
                    <span>Back</span>
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    variant="glow"
                    size="lg"
                    className="inline-flex items-center gap-2"
                    disabled={!allDocsUploaded}
                  >
                    <span>Continue</span>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
                <h2 className="font-heading font-bold text-xl text-text-primary mb-6">
                  Select a Car to Drive
                </h2>

                <div className="space-y-4">
                  {carsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : availableCars.length === 0 ? (
                    <div className="text-center py-12 text-text-muted">
                      No cars available at the moment.
                    </div>
                  ) : (
                    availableCars.map((car) => {
                      const status = car.assignedDriver ? 'pending' : 'available';
                      return (
                        <button
                          key={car.id}
                          onClick={() => status === 'available' && setSelectedCar(car.id)}
                          disabled={status !== 'available'}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                            selectedCar === car.id
                              ? 'border-primary bg-primary/5'
                              : status === 'available'
                              ? 'border-border hover:border-border-hover'
                              : 'border-border opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="w-24 h-16 rounded-lg overflow-hidden bg-background-elevated shrink-0">
                            <CarThumbnail metadataCID={car.metadataCID} alt={car.name} />
                          </div>
                          <div className="flex-1">
                            <p className="font-heading font-bold text-text-primary">{car.name}</p>
                            <p className="text-sm text-text-muted">Owner: {car.owner?.name ?? 'Unknown'}</p>
                            <p className="text-sm text-success mt-1">{weiToEth(car.pricePerShare)} ETH/share</p>
                          </div>
                          {selectedCar === car.id && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shrink-0">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                          {status === 'pending' && (
                            <Badge variant="warning">Has Applicants</Badge>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="flex justify-between mt-8">
                  <Button onClick={() => setStep(2)} variant="ghost" size="lg" className="inline-flex items-center gap-2">
                    <ChevronLeft className="h-5 w-5" />
                    <span>Back</span>
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    variant="glow"
                    size="lg"
                    disabled={!selectedCar}
                    className="inline-flex items-center gap-2"
                  >
                    <span>Continue</span>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
                <h2 className="font-heading font-bold text-xl text-text-primary mb-6">
                  Review Your Application
                </h2>

                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-background-elevated">
                    <h3 className="text-sm font-medium text-text-muted mb-3">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-text-muted">Name</p>
                        <p className="font-medium text-text-primary">{user?.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Phone</p>
                        <p className="font-medium text-text-primary">{phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">License Number</p>
                        <p className="font-medium text-text-primary">{licenseNumber || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Experience</p>
                        <p className="font-medium text-text-primary">{experience} years</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-background-elevated">
                    <h3 className="text-sm font-medium text-text-muted mb-3">Documents</h3>
                    <div className="space-y-2">
                      {([
                        { key: 'license' as DocKey, label: "Driver's License" },
                        { key: 'insurance' as DocKey, label: 'Proof of Insurance' },
                        { key: 'background' as DocKey, label: 'Background Check Consent' },
                      ]).map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-2">
                          {documents[key] ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-warning" />
                          )}
                          <span className="text-text-primary">{label}</span>
                          {documents[key] && (
                            <span className="text-xs text-text-muted ml-auto truncate max-w-[160px]">{documents[key]!.name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedCar && (() => {
                    const car = availableCars.find((c) => c.id === selectedCar);
                    return car ? (
                      <div className="p-4 rounded-xl bg-background-elevated">
                        <h3 className="text-sm font-medium text-text-muted mb-3">Selected Vehicle</h3>
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-14 rounded-lg overflow-hidden bg-surface shrink-0">
                            <CarThumbnail metadataCID={car.metadataCID} alt={car.name}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{car.name}</p>
                            <p className="text-sm text-text-muted">Owner: {car.owner?.name ?? 'Unknown'}</p>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-warning">Important Notice</p>
                        <p className="text-sm text-warning/80 mt-1">
                          By submitting this application, you agree to undergo a background check and comply with all platform policies.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <Button onClick={() => setStep(3)} variant="ghost" size="lg" className="inline-flex items-center gap-2">
                    <ChevronLeft className="h-5 w-5" />
                    <span>Back</span>
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    variant="success"
                    size="lg"
                    className="inline-flex items-center gap-2"
                  >
                    <Shield className="h-5 w-5" />
                    <span>Submit Application</span>
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
