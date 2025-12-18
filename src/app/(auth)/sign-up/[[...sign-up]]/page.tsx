import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <SignUp
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-lg",
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
      />
    </div>
  );
}
