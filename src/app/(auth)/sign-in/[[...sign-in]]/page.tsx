import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-lg",
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
