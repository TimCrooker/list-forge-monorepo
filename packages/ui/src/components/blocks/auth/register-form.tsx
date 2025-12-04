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
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Loader2, Mail, Lock, User, AlertCircle, Eye, EyeOff, Check, X } from 'lucide-react'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms and conditions',
    }),
    marketingEmails: z.boolean(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export interface RegisterFormProps {
  onSubmit: (values: Omit<RegisterFormValues, 'confirmPassword'>) => void | Promise<void>
  onSignIn?: () => void
  onSocialLogin?: (provider: string) => void
  onTermsClick?: () => void
  onPrivacyClick?: () => void
  error?: string
  loading?: boolean
  className?: string
  showSocialLogin?: boolean
  socialProviders?: Array<{
    name: string
    icon: React.ReactNode
  }>
  title?: string
  description?: string
}

export const RegisterForm = ({
  onSubmit,
  onSignIn,
  onSocialLogin,
  onTermsClick,
  onPrivacyClick,
  error,
  loading = false,
  className,
  showSocialLogin = true,
  socialProviders = [
    { name: 'Google', icon: <GoogleIcon /> },
    { name: 'GitHub', icon: <GitHubIcon /> },
  ],
  title = 'Create an account',
  description = 'Enter your information to get started',
}: RegisterFormProps) => {
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      marketingEmails: false,
    },
  })

  const password = form.watch('password')

  // Password strength calculation
  const passwordStrength = React.useMemo(() => {
    if (!password) return 0
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[a-z]/.test(password)) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 12.5
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5
    return strength
  }, [password])

  const handleSubmit = async (values: RegisterFormValues) => {
    const { confirmPassword, ...submitValues } = values
    await onSubmit(submitValues)
  }

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showSocialLogin && socialProviders.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {socialProviders.map(provider => (
                <Button
                  key={provider.name}
                  disabled={loading}
                  variant="outline"
                  onClick={() => onSocialLogin?.(provider.name)}
                >
                  {provider.icon}
                  <span className="ml-2">{provider.name}</span>
                </Button>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or register with email
                </span>
              </div>
            </div>
          </>
        )}

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        className="pl-9"
                        disabled={loading}
                        placeholder="John Doe"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        className="pl-9 pr-9"
                        disabled={loading}
                        placeholder="Create a strong password"
                        type={showPassword ? 'text' : 'password'}
                      />
                      <Button
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                        size="sm"
                        type="button"
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  {password && (
                    <div className="space-y-2">
                      <Progress className="h-1" value={passwordStrength} />
                      <div className="text-xs space-y-1">
                        <PasswordRequirement
                          met={password.length >= 8}
                          text="At least 8 characters"
                        />
                        <PasswordRequirement
                          met={/[a-z]/.test(password)}
                          text="One lowercase letter"
                        />
                        <PasswordRequirement
                          met={/[A-Z]/.test(password)}
                          text="One uppercase letter"
                        />
                        <PasswordRequirement met={/[0-9]/.test(password)} text="One number" />
                        <PasswordRequirement
                          met={/[^a-zA-Z0-9]/.test(password)}
                          text="One special character"
                        />
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        className="pl-9 pr-9"
                        disabled={loading}
                        placeholder="Confirm your password"
                        type={showConfirmPassword ? 'text' : 'password'}
                      />
                      <Button
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                        size="sm"
                        type="button"
                        variant="ghost"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        disabled={loading}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        I agree to the{' '}
                        <Button
                          className="p-0 h-auto"
                          type="button"
                          variant="link"
                          onClick={onTermsClick}
                        >
                          Terms of Service
                        </Button>{' '}
                        and{' '}
                        <Button
                          className="p-0 h-auto"
                          type="button"
                          variant="link"
                          onClick={onPrivacyClick}
                        >
                          Privacy Policy
                        </Button>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marketingEmails"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        disabled={loading}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      Send me product updates and marketing emails
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <Button className="w-full" disabled={loading} type="submit">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      {onSignIn && (
        <CardFooter>
          <p className="text-sm text-center w-full text-muted-foreground">
            Already have an account?{' '}
            <Button className="px-0" disabled={loading} variant="link" onClick={onSignIn}>
              Sign in
            </Button>
          </p>
        </CardFooter>
      )}
    </Card>
  )
}

const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <X className="h-3 w-3 text-muted-foreground" />
      )}
      <span className={cn('text-xs', met ? 'text-green-600' : 'text-muted-foreground')}>
        {text}
      </span>
    </div>
  )
}

// Simple icon components for social providers
const GoogleIcon = () => {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

const GitHubIcon = () => {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  )
}
