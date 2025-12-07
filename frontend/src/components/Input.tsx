import React from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement>
const Input: React.FC<Props> = (props) => <input className="input" {...props} />
export default Input
