import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Smartphone,
  Mail,
  Shield,
  AlertCircle,
  CheckCircle2,
  Copy,
  QrCode,
  Key,
} from 'lucide-react'

// Verification schema
const verificationSchema = z.object({
  code: z.string().min(6, 'Code must be 6 digits').max(6, 'Code must be 6 digits'),
})

type VerificationValues = z.infer<typeof verificationSchema>

export interface TwoFactorSetupProps {
  onEnable: (method: 'app' | 'sms' | 'email') => void | Promise<void>
  onVerify: (code: string) => void | Promise<void>
  onDisable?: () => void | Promise<void>
  onBack?: () => void
  qrCodeUrl?: string
  secret?: string
  phoneNumber?: string
  email?: string
  error?: string
  loading?: boolean
  isEnabled?: boolean
  enabledMethod?: 'app' | 'sms' | 'email'
  className?: string
}

export interface TwoFactorVerificationProps {
  onSubmit: (code: string) => void | Promise<void>
  onResendCode?: () => void | Promise<void>
  onUseBackupCode?: () => void
  method?: 'app' | 'sms' | 'email'
  destination?: string // phone number or email for display
  error?: string
  loading?: boolean
  resending?: boolean
  className?: string
  title?: string
  description?: string
}

export const TwoFactorSetup = ({
  onEnable,
  onVerify,
  onDisable,
  onBack,
  qrCodeUrl,
  secret,
  phoneNumber,
  email,
  error,
  loading = false,
  isEnabled = false,
  enabledMethod,
  className,
}: TwoFactorSetupProps) => {
  const [selectedMethod, setSelectedMethod] = React.useState<'app' | 'sms' | 'email'>('app')
  const [showSecret, setShowSecret] = React.useState(false)
  const [setupStep, setSetupStep] = React.useState<'select' | 'configure' | 'verify'>('select')
  const [copied, setCopied] = React.useState(false)

  const form = useForm<VerificationValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: '',
    },
  })

  const handleEnable = async () => {
    await onEnable(selectedMethod)
    setSetupStep('configure')
  }

  const handleVerify = async (values: VerificationValues) => {
    await onVerify(values.code)
  }

  const copyToClipboard = () => {
    if (secret) {
      navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isEnabled && enabledMethod) {
    return (
      <Card className={cn('w-full max-w-md', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Your account is protected with two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication is enabled using{' '}
                <span className="font-medium">
                  {enabledMethod === 'app' && 'authenticator app'}
                  {enabledMethod === 'sms' && 'SMS messages'}
                  {enabledMethod === 'email' && 'email verification'}
                </span>
              </AlertDescription>
            </Alert>

            {enabledMethod === 'sms' && phoneNumber && (
              <div className="text-sm text-muted-foreground">
                Verification codes will be sent to:{' '}
                <span className="font-medium">{phoneNumber}</span>
              </div>
            )}

            {enabledMethod === 'email' && email && (
              <div className="text-sm text-muted-foreground">
                Verification codes will be sent to: <span className="font-medium">{email}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          {onDisable && (
            <Button className="flex-1" disabled={loading} variant="destructive" onClick={onDisable}>
              Disable 2FA
            </Button>
          )}
          {onBack && (
            <Button disabled={loading} variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Set Up Two-Factor Authentication
        </CardTitle>
        <CardDescription>Add an extra layer of security to your account</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {setupStep === 'select' && (
          <Tabs
            value={selectedMethod}
            onValueChange={v => setSelectedMethod(v as 'app' | 'sms' | 'email')}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="app">App</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>

            <TabsContent className="space-y-4" value="app">
              <div className="flex items-center gap-3">
                <Smartphone className="h-10 w-10 text-muted-foreground" />
                <div className="space-y-1">
                  <h4 className="font-medium">Authenticator App</h4>
                  <p className="text-sm text-muted-foreground">
                    Use an app like Google Authenticator or Authy
                  </p>
                </div>
              </div>
              <Badge className="text-xs" variant="secondary">
                Recommended
              </Badge>
            </TabsContent>

            <TabsContent className="space-y-4" value="sms">
              <div className="flex items-center gap-3">
                <Smartphone className="h-10 w-10 text-muted-foreground" />
                <div className="space-y-1">
                  <h4 className="font-medium">Text Message</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive verification codes via SMS
                  </p>
                </div>
              </div>
              {phoneNumber && (
                <div className="text-sm text-muted-foreground">
                  Codes will be sent to: <span className="font-medium">{phoneNumber}</span>
                </div>
              )}
            </TabsContent>

            <TabsContent className="space-y-4" value="email">
              <div className="flex items-center gap-3">
                <Mail className="h-10 w-10 text-muted-foreground" />
                <div className="space-y-1">
                  <h4 className="font-medium">Email</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive verification codes via email
                  </p>
                </div>
              </div>
              {email && (
                <div className="text-sm text-muted-foreground">
                  Codes will be sent to: <span className="font-medium">{email}</span>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {setupStep === 'configure' && selectedMethod === 'app' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Scan QR Code</h4>
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app
              </p>
              {qrCodeUrl && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img alt="QR Code" className="w-48 h-48" src={qrCodeUrl} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">2. Or enter code manually</h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                  {showSecret ? secret : '••••••••••••••••'}
                </code>
                <Button size="sm" variant="ghost" onClick={() => setShowSecret(!showSecret)}>
                  {showSecret ? 'Hide' : 'Show'}
                </Button>
                <Button size="sm" variant="ghost" onClick={copyToClipboard}>
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button className="w-full" onClick={() => setSetupStep('verify')}>
              Continue to Verification
            </Button>
          </div>
        )}

        {setupStep === 'configure' && selectedMethod !== 'app' && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                We'll send a verification code to your{' '}
                {selectedMethod === 'sms' ? 'phone' : 'email'} to complete setup.
              </AlertDescription>
            </Alert>
            <Button
              className="w-full"
              disabled={loading}
              onClick={() => {
                handleEnable()
                setSetupStep('verify')
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending code...
                </>
              ) : (
                'Send verification code'
              )}
            </Button>
          </div>
        )}

        {setupStep === 'verify' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Enter verification code</h4>
              <p className="text-sm text-muted-foreground">
                {selectedMethod === 'app' && 'Enter the 6-digit code from your authenticator app'}
                {selectedMethod === 'sms' && `Enter the code sent to ${phoneNumber}`}
                {selectedMethod === 'email' && `Enter the code sent to ${email}`}
              </p>
            </div>

            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(handleVerify)}>
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          className="font-mono text-center text-lg"
                          disabled={loading}
                          maxLength={6}
                          placeholder="000000"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button className="w-full" disabled={loading} type="submit">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify and Enable'
                  )}
                </Button>
              </form>
            </Form>
          </div>
        )}
      </CardContent>

      {setupStep === 'select' && (
        <CardFooter className="flex gap-2">
          <Button className="flex-1" disabled={loading} onClick={handleEnable}>
            Continue
          </Button>
          {onBack && (
            <Button disabled={loading} variant="outline" onClick={onBack}>
              Cancel
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

export const TwoFactorVerification = ({
  onSubmit,
  onResendCode,
  onUseBackupCode,
  method = 'app',
  destination,
  error,
  loading = false,
  resending = false,
  className,
  title = 'Two-Factor Authentication',
  description,
}: TwoFactorVerificationProps) => {
  const form = useForm<VerificationValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: '',
    },
  })

  const handleSubmit = async (values: VerificationValues) => {
    await onSubmit(values.code)
  }

  const defaultDescription = () => {
    switch (method) {
      case 'app':
        return 'Enter the 6-digit code from your authenticator app'
      case 'sms':
        return destination
          ? `Enter the code sent to ${destination}`
          : 'Enter the code sent to your phone'
      case 'email':
        return destination
          ? `Enter the code sent to ${destination}`
          : 'Enter the code sent to your email'
    }
  }

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description || defaultDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoFocus
                      className="font-mono text-center text-lg"
                      disabled={loading}
                      maxLength={6}
                      placeholder="000000"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full" disabled={loading} type="submit">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>

            <div className="space-y-2">
              {onResendCode && method !== 'app' && (
                <Button
                  className="w-full"
                  disabled={loading || resending}
                  type="button"
                  variant="ghost"
                  onClick={onResendCode}
                >
                  {resending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Didn't receive the code? Resend"
                  )}
                </Button>
              )}

              {onUseBackupCode && (
                <Button
                  className="w-full"
                  disabled={loading}
                  type="button"
                  variant="ghost"
                  onClick={onUseBackupCode}
                >
                  <Key className="mr-2 h-4 w-4" />
                  Use backup code instead
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
