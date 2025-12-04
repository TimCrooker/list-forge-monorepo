# Authentication Blocks

This directory contains complete authentication flow components including forms, social login, and security features. These blocks handle user authentication, registration, and security workflows.

## Components

### Login Form

**Purpose**: Flexible login form with customizable fields and validation
**Use Cases**: User login, admin login, multi-tenant authentication
**Key Props**: `onSubmit`, `fieldConfig`, `socialProviders`, `loading`, `error`

```tsx
<LoginForm
  onSubmit={handleLogin}
  fieldConfig={{
    name: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'Enter email'
  }}
  showSocialLogin={true}
  loading={isSubmitting}
  error={authError}
/>
```

### Register Form

**Purpose**: User registration with configurable fields and validation
**Use Cases**: User signup, account creation, onboarding
**Key Props**: `onSubmit`, `fields`, `termsUrl`, `privacyUrl`, `loading`

```tsx
<RegisterForm
  onSubmit={handleRegister}
  fields={['firstName', 'lastName', 'email', 'password']}
  termsUrl="/terms"
  privacyUrl="/privacy"
  loading={isSubmitting}
/>
```

### Social Login

**Purpose**: Social authentication provider buttons
**Use Cases**: OAuth login, third-party authentication
**Key Props**: `providers`, `onProviderSelect`, `loading`, `disabled`

```tsx
<SocialLogin
  providers={[
    { name: 'Google', icon: <GoogleIcon /> },
    { name: 'GitHub', icon: <GitHubIcon /> },
    { name: 'Microsoft', icon: <MicrosoftIcon /> }
  ]}
  onProviderSelect={handleSocialLogin}
  loading={socialLoading}
/>
```

### Two-Factor Authentication

**Purpose**: 2FA setup and verification interface
**Use Cases**: Account security, TOTP setup, SMS verification
**Key Props**: `mode` (setup/verify), `method` (totp/sms), `onVerify`, `onSetup`

```tsx
<TwoFactorAuth
  mode="setup"
  method="totp"
  onSetup={handleTotpSetup}
  qrCode={qrCodeUrl}
  backupCodes={backupCodes}
/>

<TwoFactorAuth
  mode="verify"
  method="totp"
  onVerify={handleTotpVerify}
  loading={isVerifying}
/>
```

### Password Reset

**Purpose**: Password reset request and confirmation flow
**Use Cases**: Forgot password, password recovery
**Key Props**: `step` (request/reset), `onRequestReset`, `onConfirmReset`, `token`

```tsx
<PasswordReset
  step="request"
  onRequestReset={handlePasswordResetRequest}
  loading={isSubmitting}
/>

<PasswordReset
  step="reset"
  token={resetToken}
  onConfirmReset={handlePasswordReset}
  loading={isSubmitting}
/>
```

### Magic Link

**Purpose**: Passwordless authentication via email links
**Use Cases**: Passwordless login, email verification, secure access
**Key Props**: `onSendLink`, `onVerifyLink`, `email`, `loading`

```tsx
<MagicLink
  onSendLink={handleSendMagicLink}
  email={userEmail}
  loading={isSending}
  cooldownTime={60}
/>
```

### Permission Gate

**Purpose**: Conditional component rendering based on user permissions
**Use Cases**: Role-based access control, feature flags, conditional UI
**Key Props**: `permissions`, `roles`, `fallback`, `children`

```tsx
<PermissionGate
  permissions={['read:users', 'write:users']}
  operator="and"
  fallback={<div>Access denied</div>}
>
  <AdminPanel />
</PermissionGate>

<PermissionGate
  roles={['admin', 'moderator']}
  operator="or"
>
  <ModeratorTools />
</PermissionGate>
```

## Features

### Common Props

All authentication components support:

- `className` - Custom styling
- `loading` - Loading states with spinners
- `disabled` - Disable form interactions
- `error` - Error message display
- `onError` - Error handling callbacks

### Form Validation

- Built-in validation for common fields (email, password strength)
- Zod schema integration for custom validation
- Real-time field validation
- Custom error messages
- Form state management with React Hook Form

### Security Features

- Password strength indicators
- Show/hide password toggles
- Rate limiting support
- CSRF protection ready
- Secure token handling

### Customization

- Custom field configurations
- Flexible layout options
- Brand customization
- Icon customization
- Custom validation rules

### Accessibility

- ARIA labels and descriptions
- Keyboard navigation
- Screen reader support
- Focus management
- Error announcements

## Usage Examples

### Complete Login Flow

```tsx
function LoginPage() {
  const [step, setStep] = useState<'login' | '2fa' | 'reset'>('login');

  return (
    <div className="auth-container">
      {step === 'login' && (
        <LoginForm
          onSubmit={handleLogin}
          onForgotPassword={() => setStep('reset')}
          error={authError}
        />
      )}

      {step === '2fa' && (
        <TwoFactorAuth
          mode="verify"
          onVerify={handleTwoFactor}
        />
      )}

      {step === 'reset' && (
        <PasswordReset
          step="request"
          onRequestReset={handlePasswordReset}
        />
      )}
    </div>
  );
}
```

### Registration with Terms

```tsx
<RegisterForm
  onSubmit={handleRegister}
  fields={[
    { name: 'firstName', label: 'First Name', required: true },
    { name: 'lastName', label: 'Last Name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'password', label: 'Password', type: 'password', required: true }
  ]}
  showTermsCheckbox={true}
  termsUrl="/terms"
  privacyUrl="/privacy"
  loading={isSubmitting}
/>
```

### Protected Route Component

```tsx
<PermissionGate
  permissions={['admin:read']}
  fallback={<Navigate to="/login" />}
>
  <AdminDashboard />
</PermissionGate>
```
