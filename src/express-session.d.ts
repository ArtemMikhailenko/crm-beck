import 'express-session'

declare module 'express-session' {
  interface SessionData {
    userId?: string
  }
}

// Fix BigInt serialization
interface BigInt {
  toJSON(): string
}
