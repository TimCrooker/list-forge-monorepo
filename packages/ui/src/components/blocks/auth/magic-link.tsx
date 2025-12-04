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
import { Loader2, Mail, Send, AlertCircle, CheckCircle2, Sparkles, ArrowLeft } from 'lucide-react'

const magicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type MagicLinkValues = z.infer<typeof magicLinkSchema>

export interface MagicLinkFormProps {
  onSubmit: (values: MagicLinkValues) => void | Promise<void>
  onBack?: () => void
  onResend?: () => void | Promise<void>
  error?: string
  loading?: boolean
  resending?: boolean
  className?: string
  title?: string
  description?: string
  successMessage?: string
  showIcon?: boolean
}

export const MagicLinkForm = ({
  onSubmit,
  onBack,
  onResend,
  error,
  loading = false,
  resending = false,
  className,
  title = 'Sign in with magic link',
  description = "We'll send you a link to sign in instantly",
  successMessage = "Check your email! We've sent you a magic link.",
  showIcon = true,
}: MagicLinkFormProps) => {
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [submittedEmail, setSubmittedEmail] = React.useState('')

  const form = useForm<MagicLinkValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: '',
    },
  })

  const handleSubmit = async (values: MagicLinkValues) => {
    await onSubmit(values)
    if (!error) {
      setSubmittedEmail(values.email)
      setIsSuccess(true)
    }
  }

  const handleResend = async () => {
    if (onResend && submittedEmail) {
      await onResend()
      // Reset to show success message again
      setIsSuccess(false)
      setTimeout(() => setIsSuccess(true), 100)
    }
  }

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader className="text-center">
        {showIcon && (
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
        )}
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && !isSuccess && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSuccess ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p>{successMessage}</p>
                  <p className="text-xs text-muted-foreground">
                    Sent to: <span className="font-medium">{submittedEmail}</span>
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <div className="flex-1 border-t" />
                <span className="px-3">Didn't receive it?</span>
                <div className="flex-1 border-t" />
              </div>

              {onResend && (
                <Button
                  className="w-full"
                  disabled={resending}
                  variant="outline"
                  onClick={handleResend}
                >
                  {resending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Resend magic link
                    </>
                  )}
                </Button>
              )}

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Check your spam folder if you don't see the email
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          autoFocus
                          className="pl-9"
                          disabled={loading}
                          placeholder="name@example.com"
                          type="email"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className="w-full" disabled={loading} type="submit">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending magic link...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send magic link
                  </>
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>

      {onBack && (
        <CardFooter>
          <Button className="w-full" disabled={loading} variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in options
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

export interface MagicLinkVerificationProps {
  onVerify?: () => void | Promise<void>
  onResend?: () => void | Promise<void>
  onCancel?: () => void
  error?: string
  loading?: boolean
  className?: string
  token?: string
  email?: string
}

export const MagicLinkVerification = ({
  onVerify,
  onResend,
  onCancel,
  error,
  loading = false,
  className,
  token,
  email,
}: MagicLinkVerificationProps) => {
  const [verifying, setVerifying] = React.useState(false)

  React.useEffect(() => {
    // Auto-verify if token is provided and onVerify exists
    if (token && onVerify && !verifying) {
      setVerifying(true)
      onVerify()
    }
  }, [token, onVerify, verifying])

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {loading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Verifying your magic link</h3>
                <p className="text-sm text-muted-foreground">Please wait while we sign you in...</p>
              </div>
            </>
          ) : error ? (
            <>
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Invalid or expired link</h3>
                <p className="text-sm text-muted-foreground">
                  {error || 'This magic link has expired or is invalid. Please request a new one.'}
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                {onResend && (
                  <Button variant="default" onClick={onResend}>
                    Request new link
                  </Button>
                )}
                {onCancel && (
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Successfully verified!</h3>
                <p className="text-sm text-muted-foreground">You've been signed in successfully.</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
