import { registerDecorator, ValidationOptions } from 'class-validator'

// Minimum 8 characters
// Minimum 1 uppercase letter
// Minimum 1 lowercase letter
// Minimum 1 number
// Minimum 1 special character

export function IsPasswordStrong(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isPasswordStrong',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          // Проверяем наличие всех необходимых компонентов
          const hasLowerCase = /[a-z]/.test(value)
          const hasUpperCase = /[A-Z]/.test(value)
          const hasNumber = /\d/.test(value)
          const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)
          const hasMinLength = value.length >= 8
          
          return hasLowerCase && hasUpperCase && hasNumber && hasSpecialChar && hasMinLength
        },
        defaultMessage() {
          return 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
        }
      }
    })
  }
}
