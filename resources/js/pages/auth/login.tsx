import { useState } from 'react';
import FrontendLayout from '@/layouts/frontend-layout';
import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import ActionSheet from '@/components/action-sheet';
import { Button } from '@/components/frontend/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/frontend/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import AppLogoIcon from '@/components/app-logo-icon';
type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({
    status,
    canResetPassword,
}: Props) {
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    return (
        <FrontendLayout>
            <Head title="Praise & Worship Sources" />

            {/* Splash Screen */}
            <div className="relative min-h-screen flex flex-col items-center justify-end md:justify-center overflow-hidden bg-auth-login px-8 py-10">
                {/* Radial Gradient Overlay */}
                <div className="absolute inset-0 auth-gradient-overlay" />
                {/* Label */}
                <div className="text-md text-foreground font-light absolute top-10">
                    GBI Altar Tabernakel Batam
                </div>

                {/* Content */}
                <div className="relative z-10 text-center w-full max-w-md">
                    
                    {/* App Logo */}
                    <div className="flex justify-center mb-3">
                        <AppLogoIcon className="size-14 text-foreground bg-background/90 p-2 border rounded-lg" />
                    </div>

                    {/* Heading */}
                    <h1 className="text-4xl md:text-5xl font-thin tracking-tight text-foreground mb-2">
                        Praise & Worship
                    </h1>

                    {/* SOURCES - Bold Italic */}
                    <div className="text-5xl md:text-6xl font-black italic tracking-tight text-foreground mb-1">
                        SOURCES
                    </div>

                    {/* Subtitle */}
                    <p className="text-base md:text-lg text-muted-foreground mb-8">
                        Know exact page. Instantly.
                    </p>

                    {/* Get Started Button */}
                    

                    <Button
                        size="lg"
                        className="mt-4 w-full"
                        onClick={() => setIsLoginOpen(true)}
                    >
                        Get Started
                    </Button>
                </div>
            </div>

            {/* Login ActionSheet */}
            <ActionSheet
                open={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                title="Login"
            >
                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    className="flex flex-col gap-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-6">
                                {/* Email Field */}
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="email@example.com"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                {/* Password Field */}
                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">Password</Label>
                                        {canResetPassword && (
                                            <TextLink
                                                href={request()}
                                                className="ml-auto text-sm"
                                                tabIndex={5}
                                            >
                                                Forgot password?
                                            </TextLink>
                                        )}
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Password"
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                {/* Remember Me */}
                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        tabIndex={3}
                                    />
                                    <Label htmlFor="remember">Remember me</Label>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    size="lg"
                                    type="submit"
                                    className="w-full"
                                    tabIndex={4}
                                    disabled={processing}
                                    data-test="login-button"
                                >
                                    {processing && <Spinner />}
                                    Continue
                                </Button>
                            </div> 

                            {/* Status Message */}
                            {status && (
                                <div className="text-center text-sm font-medium text-green-600">
                                    {status}
                                </div>
                            )}
                        </>
                    )}
                </Form>
            </ActionSheet>
        </FrontendLayout>
    );
}