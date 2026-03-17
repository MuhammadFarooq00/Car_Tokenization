import { useState } from 'react';
import { motion } from 'framer-motion';
import { LifeBuoy, Mail, MessageSquare, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

export function Support() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !subject || !message) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    // Simulate sending (in production, connect to backend API or email service)
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-background to-background" />
        <div className="container relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <LifeBuoy className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">Support</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-text-primary mb-4">
              How Can We <span className="text-gradient">Help?</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Our support team is here to help you with any questions or issues.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 rounded-2xl bg-surface border border-border text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-heading font-bold text-text-primary mb-2">Email Support</h3>
            <p className="text-sm text-text-muted">support@carshares.io</p>
            <p className="text-xs text-text-muted mt-1">Response within 24 hours</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 rounded-2xl bg-surface border border-border text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-heading font-bold text-text-primary mb-2">Community</h3>
            <p className="text-sm text-text-muted">Join our Discord community</p>
            <p className="text-xs text-text-muted mt-1">Chat with other users</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-6 rounded-2xl bg-surface border border-border text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 mx-auto mb-4">
              <LifeBuoy className="h-6 w-6 text-success" />
            </div>
            <h3 className="font-heading font-bold text-text-primary mb-2">Help Center</h3>
            <Link to="/faq" className="text-sm text-primary hover:underline">Browse FAQ</Link>
            <p className="text-xs text-text-muted mt-1">Find quick answers</p>
          </motion.div>
        </div>

        {/* Contact Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl border border-border bg-surface p-8">
          <h2 className="font-heading font-bold text-xl text-text-primary mb-6">Send us a message</h2>

          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="font-heading font-bold text-lg text-text-primary mb-2">Message Sent!</h3>
              <p className="text-text-muted">We&apos;ll get back to you within 24 hours.</p>
              <Button
                onClick={() => { setSubmitted(false); setName(''); setEmail(''); setSubject(''); setMessage(''); }}
                variant="outline"
                className="mt-4"
              >
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-error/10 text-error text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label className="text-text-secondary">Your Name</Label>
                  <Input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="mt-2" />
                </div>
                <div>
                  <Label className="text-text-secondary">Email Address</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="mt-2" />
                </div>
              </div>

              <div>
                <Label className="text-text-secondary">Subject</Label>
                <Input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="What's this about?" className="mt-2" />
              </div>

              <div>
                <Label className="text-text-secondary">Message</Label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe your issue or question..."
                  rows={5}
                  className="w-full mt-2 px-4 py-3 rounded-xl bg-background border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <Button type="submit" variant="glow" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
                Send Message
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
