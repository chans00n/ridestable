import React from 'react'
import type { UseFormRegister, FieldError } from 'react-hook-form'
import { Input } from './Input'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string
  label?: string
  register: UseFormRegister<any>
  error?: FieldError
  icon?: React.ReactNode
  showPasswordToggle?: boolean
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  register,
  error,
  ...inputProps
}) => {
  return (
    <Input
      label={label}
      error={error?.message}
      {...register(name)}
      {...inputProps}
    />
  )
}