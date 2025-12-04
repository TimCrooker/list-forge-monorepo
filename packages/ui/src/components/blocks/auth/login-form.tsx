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
import { Label } from '@/components/ui/label'
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
import { Loader2, Mail, Lock, AlertCircle, Eye, EyeOff, User } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

// Flexible login form configuration
export interface LoginFieldConfig {
  name: 'email' | 'username' | 'identifier' // field name for form data
  label: string // field label
  type: 'email' | 'text' // input type
  placeholder: string // placeholder text
  icon?: React.ReactNode // custom icon
  helpText?: string // help text below field
}

export interface PasswordFieldConfig {
  label?: string
  placeholder?: string
  helpText?: string
}

// Flexible schema that can be configured
const createLoginSchema = (fieldName: string, fieldValidation?: z.ZodSchema) => {
  const baseSchema = {
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean(),
  }

  return z.object({
    ...baseSchema,
    [fieldName]: fieldValidation || z.string().min(1, 'This field is required'),
  })
}

export interface LoginFormProps {
  onSubmit: (values: Record<string, any>) => void | Promise<void>
  onForgotPassword?: () => void
  onSignUp?: () => void
  onSocialLogin?: (provider: string) => void
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
  // Field configuration
  fieldConfig?: LoginFieldConfig
  passwordConfig?: PasswordFieldConfig
  // Custom validation
  customValidation?: z.ZodSchema
}

export const LoginForm = ({
  onSubmit,
  onForgotPassword,
  onSignUp,
  onSocialLogin,
  error,
  loading = false,
  className,
  showSocialLogin = true,
  socialProviders = [
    { name: 'Google', icon: <GoogleIcon /> },
    { name: 'GitHub', icon: <GitHubIcon /> },
  ],
  title = 'Welcome back',
  description = 'Enter your credentials to access your account',
  fieldConfig = {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'name@example.com',
    icon: <Mail className="h-4 w-4" />,
  },
  passwordConfig = {
    label: 'Password',
    placeholder: 'Enter your password',
  },
  customValidation,
}: LoginFormProps) => {
  const [showPassword, setShowPassword] = React.useState(false)

  // Create schema based on field configuration
  const loginSchema = React.useMemo(() => {
    let fieldValidation = z.string().min(1, 'This field is required')

    if (fieldConfig.type === 'email' && !customValidation) {
      fieldValidation = z.string().email('Please enter a valid email address')
    }

    return createLoginSchema(fieldConfig.name, customValidation || fieldValidation)
  }, [fieldConfig, customValidation])

  type LoginFormValues = z.infer<typeof loginSchema>

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      [fieldConfig.name]: '',
      password: '',
      rememberMe: false,
    } as LoginFormValues,
  })

  const handleSubmit = async (values: LoginFormValues) => {
    await onSubmit(values)
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

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name={fieldConfig.name as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{fieldConfig.label}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      {fieldConfig.icon && (
                        <div className="absolute left-3 top-3 text-muted-foreground">
                          {fieldConfig.icon}
                        </div>
                      )}
                      <Input
                        {...field}
                        autoComplete={fieldConfig.type === 'email' ? 'email' : 'username'}
                        className={fieldConfig.icon ? 'pl-9' : ''}
                        disabled={loading}
                        placeholder={fieldConfig.placeholder}
                        type={fieldConfig.type}
                      />
                    </div>
                  </FormControl>
                  {fieldConfig.helpText && (
                    <div className="text-xs text-muted-foreground">{fieldConfig.helpText}</div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{passwordConfig.label || 'Password'}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        autoComplete="current-password"
                        className="pl-9 pr-9"
                        disabled={loading}
                        placeholder={passwordConfig.placeholder || 'Enter your password'}
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
                  {passwordConfig.helpText && (
                    <div className="text-xs text-muted-foreground">{passwordConfig.helpText}</div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        disabled={loading}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      Remember me
                    </FormLabel>
                  </FormItem>
                )}
              />

              {onForgotPassword && (
                <Button
                  className="px-0 text-sm"
                  disabled={loading}
                  type="button"
                  variant="link"
                  onClick={onForgotPassword}
                >
                  Forgot password?
                </Button>
              )}
            </div>

            <Button className="w-full" disabled={loading} type="submit">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </Form>

        {showSocialLogin && socialProviders.length > 0 && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

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
          </>
        )}
      </CardContent>

      {onSignUp && (
        <CardFooter>
          <p className="text-sm text-center w-full text-muted-foreground">
            Don't have an account?{' '}
            <Button className="px-0" disabled={loading} variant="link" onClick={onSignUp}>
              Sign up
            </Button>
          </p>
        </CardFooter>
      )}
    </Card>
  )
}

// Placeholder components for social icons
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
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        clipRule="evenodd"
        d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
        fillRule="evenodd"
      />
    </svg>
  )
}
