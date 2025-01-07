import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <SignUp appearance={{
      elements: {
        formButtonPrimary: "bg-primary hover:bg-primary/90",
        card: "shadow-none"
      }
    }} />
  )
}