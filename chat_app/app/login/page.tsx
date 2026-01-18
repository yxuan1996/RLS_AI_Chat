import { login } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Superstore Agent</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the internal data tool.
          </CardDescription>
        </CardHeader>
        <form>
          <CardContent className="space-y-4">
            {searchParams.error && (
               <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                 <AlertCircle className="h-4 w-4" />
                 {searchParams.error}
               </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button formAction={login} className="w-full">Sign In</Button>
            <p className="text-xs text-center text-gray-500">
              New accounts are currently restricted. Contact IT for access.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}