import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }

const Button: React.FC<Props> = ({ variant = 'primary', children, ...rest }) => (
  <button className={`btn btn-${variant}`} {...rest}>{children}</button>
)

export default Button
