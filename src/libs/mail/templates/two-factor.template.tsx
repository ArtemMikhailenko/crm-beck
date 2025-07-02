import * as React from "react"
import { 
  Html, 
  Body, 
  Container, 
  Link, 
  Heading, 
  Text, 
  Tailwind,
  Section,
  Hr
} from "@react-email/components"

interface TwoFactorTemplateProps {
  domain: string
  token: string
}

export function TwoFactorTemplate({
  token,
  domain
}: TwoFactorTemplateProps) {
  // Two-factor authentication doesn't need URL

  return (
    <Html>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#6366f1",
                brandDark: "#4f46e5",
                success: "#10b981",
                warning: "#f59e0b"
              },
              fontFamily: {
                sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
              }
            }
          }
        }}
      >
        <Body className="bg-gray-50 font-sans" style={{fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}}>
          <Container className="mx-auto py-8 px-4 max-w-md" style={{maxWidth: '448px', margin: '0 auto', padding: '32px 16px'}}>
            <Section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-4" style={{backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '32px', marginBottom: '16px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'}}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-brand to-brandDark rounded-full mx-auto mb-4 flex items-center justify-center" style={{width: '64px', height: '64px', backgroundColor: '#6366f1', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <Heading className="text-2xl font-bold text-gray-900 mb-2">
                  Two-Factor Authentication
                </Heading>
                <Text className="text-gray-600 text-base leading-relaxed">
                  Your verification code is ready
                </Text>
              </div>
              <Section className="mb-6">
                <Text className="text-gray-700 text-base leading-relaxed mb-6">
                  Hello! 👋
                </Text>
                <Text className="text-gray-700 text-base leading-relaxed mb-6">
                  We've received a login attempt to your account. To complete the authentication process, 
                  please use the verification code below:
                </Text>
                <div className="text-center mb-6">
                  <div className="inline-block bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg px-6 py-4 font-mono text-2xl font-bold text-gray-800 tracking-widest" style={{display: 'inline-block', backgroundColor: '#f3f4f6', border: '2px dashed #d1d5db', borderRadius: '8px', padding: '16px 24px', fontFamily: 'Monaco, Consolas, monospace', fontSize: '24px', fontWeight: 'bold', color: '#1f2937', letterSpacing: '0.1em'}}>
                    {token}
                  </div>
                </div>
                <Text className="text-gray-700 text-base leading-relaxed mb-4">
                  Simply copy this code and paste it into the verification form to complete your login.
                </Text>
              </Section>
              <Hr className="border-gray-200 my-6" />
              <Section>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4" style={{backgroundColor: '#fefce8', border: '1px solid #fde047', borderRadius: '8px', padding: '16px', marginBottom: '16px'}}>
                  <Text className="text-sm text-yellow-800 mb-1 font-medium">
                    ⏰ Important:
                  </Text>
                  <Text className="text-sm text-yellow-700">
                    This verification code will expire in 10 minutes for security reasons.
                  </Text>
                </div>
                <Text className="text-sm text-gray-500 leading-relaxed">
                  If you didn't attempt to log in, please contact our support team immediately 
                  as your account security may be compromised.
                </Text>
              </Section>
            </Section>
            <Section className="text-center">
              <Text className="text-xs text-gray-400 mb-2">
                Thank you for choosing our service! 🚀
              </Text>
              <Text className="text-xs text-gray-400">
                This is an automated message, please do not reply to this email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}