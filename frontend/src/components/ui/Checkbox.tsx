import React, { forwardRef } from 'react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <motion.input
            ref={ref}
            type="checkbox"
            className={clsx(
              'h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors',
              error && 'border-red-300',
              className
            )}
            whileTap={{ scale: 0.9 }}
            {...props}
          />
        </div>
        {label && (
          <div className="ml-3 text-sm">
            <label htmlFor={props.id} className="font-medium text-gray-700">
              {label}
            </label>
          </div>
        )}
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'