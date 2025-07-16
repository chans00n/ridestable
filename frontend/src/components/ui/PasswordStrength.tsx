import React from 'react'
import { motion } from 'framer-motion'

interface PasswordStrengthProps {
  password: string
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const calculateStrength = (password: string): number => {
    let strength = 0
    
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[@$!%*?&]/.test(password)) strength++
    
    return strength
  }
  
  const strength = calculateStrength(password)
  
  const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500']
  
  if (!password) return null
  
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[...Array(5)].map((_, index) => (
          <motion.div
            key={index}
            className={`h-1 flex-1 rounded-full ${
              index < strength ? strengthColors[strength - 1] : 'bg-gray-200'
            }`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: index < strength ? 1 : 0.3 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          />
        ))}
      </div>
      <p className={`text-xs ${strength > 0 ? strengthColors[strength - 1].replace('bg-', 'text-') : 'text-gray-400'}`}>
        {strength > 0 ? strengthText[strength - 1] : 'Enter a password'}
      </p>
    </div>
  )
}